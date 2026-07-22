from fastapi import APIRouter, HTTPException, status, Path
from ..schemas.chat import ChatRequest, ChatResponse, ChatFeedbackRequest, MultiChatRequest
from ..utils.db import fetch_agents, insert_chat_interaction, update_chat_feedback
from ..rag.vector_store import retrieve_context
from ..agents.prompts import get_system_prompt
from ..services.llm import generate_grounded_answer, generate_grounded_answer_stream
from fastapi.responses import StreamingResponse
import json

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def chat_with_expert(payload: ChatRequest):
    try:
        # 1. Fetch expert agents to verify
        agents = fetch_agents()
        agent = next((a for a in agents if a["id"] == payload.expertId), None)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expert Agent with ID '{payload.expertId}' not found."
            )
            
        # 2. Retrieve context chunks via RAG
        context_chunks = retrieve_context(payload.expertId, payload.question, top_k=3)
        
        # 3. Get domain-specific system prompt
        system_prompt = get_system_prompt(payload.expertId)
        
        # 4. Generate response grounded in context
        answer = generate_grounded_answer(
            system_prompt=system_prompt,
            user_question=payload.question,
            context_chunks=context_chunks
        )
        
        # 5. Log chat interaction in database
        msg_id = insert_chat_interaction(
            agent_id=payload.expertId,
            user_message=payload.question,
            assistant_message=answer
        )
        
        # 6. Extract source document names
        sources = list(set([chunk["document_id"] for chunk in context_chunks if chunk.get("document_id")]))
        
        # Fallback to general documents if no sources were returned
        if not sources:
            sources = ["System Knowledge Base"]
            
        # Format sources: we want to return document names rather than internal database IDs.
        # Let's map document_id (which is e.g. 'doc-1') back to document name if possible,
        # or if it's already a name, use it. Since in db.py we did insert_document_chunks
        # using the document_id (which is f"{payload.agentId}-{payload.name...}"),
        # let's look up document names. Wait, let's just fetch the document records for the agent.
        # Alternatively, we can retrieve chunk["document_id"] and map to the document name.
        # Let's write a simple helper or lookup to get the actual document names.
        from ..utils.db import fetch_documents
        doc_records = fetch_documents(payload.expertId)
        doc_id_to_name = {d["id"]: d["name"] for d in doc_records}
        
        resolved_sources = []
        for src_id in sources:
            name = doc_id_to_name.get(src_id, src_id)
            resolved_sources.append(name)
            
        return ChatResponse(
            id=msg_id,
            answer=answer,
            sources=resolved_sources,
            expert=agent["name"],
            confidenceScore=agent["health"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate answer: {e}"
        )

@router.post("/multi", response_model=ChatResponse)
def chat_with_multiple_experts(payload: MultiChatRequest):
    try:
        agents = fetch_agents()
        selected_agents = [a for a in agents if a["id"] in payload.expertIds]
        
        if not selected_agents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="None of the selected experts were found."
            )

        all_context_chunks = []
        for agent_id in payload.expertIds:
            chunks = retrieve_context(agent_id, payload.question, top_k=2)
            all_context_chunks.extend(chunks)

        # Synthesize a general system prompt indicating multi-expert mode
        expert_names = ", ".join([a["name"] for a in selected_agents])
        system_prompt = (
            f"You are the OmniMind Multi-Expert Synthesizer. You are answering on behalf of the following experts: {expert_names}. "
            "Your objective is to provide a comprehensive, combined answer drawing upon the diverse context provided from these multiple domains. "
            "Synthesize the information seamlessly, but cite the source documents clearly. "
            "If the answer cannot be found in the retrieved context, state clearly that the approved policy documents do not contain the answer."
        )
        # Append formatting instructions
        from ..agents.prompts import FORMAT_INSTRUCTIONS
        system_prompt += FORMAT_INSTRUCTIONS

        answer = generate_grounded_answer(
            system_prompt=system_prompt,
            user_question=payload.question,
            context_chunks=all_context_chunks
        )

        # For logging, use the first selected agent's ID to satisfy the foreign key constraint
        msg_id = insert_chat_interaction(
            agent_id=payload.expertIds[0],
            user_message=payload.question,
            assistant_message=answer
        )

        sources = list(set([chunk["document_id"] for chunk in all_context_chunks if chunk.get("document_id")]))
        if not sources:
            sources = ["System Knowledge Base"]
            
        from ..utils.db import fetch_documents
        resolved_sources = []
        for agent_id in payload.expertIds:
            doc_records = fetch_documents(agent_id)
            doc_id_to_name = {d["id"]: d["name"] for d in doc_records}
            for src_id in sources:
                if src_id in doc_id_to_name and doc_id_to_name[src_id] not in resolved_sources:
                    resolved_sources.append(doc_id_to_name[src_id])
                    
        # Filter out unresolved source IDs (if they were resolved by another agent)
        final_sources = [s for s in resolved_sources]
        if not final_sources and sources != ["System Knowledge Base"]:
            final_sources = sources
        elif not final_sources:
             final_sources = ["System Knowledge Base"]

        avg_health = sum([a["health"] for a in selected_agents]) // len(selected_agents)

        return ChatResponse(
            id=msg_id,
            answer=answer,
            sources=final_sources,
            expert="OmniMind Synthesizer",
            confidenceScore=avg_health
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate multi-expert answer: {e}"
        )

@router.post("/stream")
def chat_stream(payload: ChatRequest):
    try:
        agents = fetch_agents()
        agent = next((a for a in agents if a["id"] == payload.expertId), None)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Expert Agent with ID '{payload.expertId}' not found."
            )
            
        context_chunks = retrieve_context(payload.expertId, payload.question, top_k=3)
        system_prompt = get_system_prompt(payload.expertId)
        
        sources = list(set([chunk["document_id"] for chunk in context_chunks if chunk.get("document_id")]))
        if not sources:
            sources = ["System Knowledge Base"]
            
        from ..utils.db import fetch_documents
        doc_records = fetch_documents(payload.expertId)
        doc_id_to_name = {d["id"]: d["name"] for d in doc_records}
        
        resolved_sources = []
        for src_id in sources:
            resolved_sources.append(doc_id_to_name.get(src_id, src_id))

        def event_generator():
            # Send initial metadata
            metadata = {
                "type": "metadata",
                "sources": resolved_sources,
                "confidenceScore": agent["health"],
                "expert": agent["name"]
            }
            yield f"data: {json.dumps(metadata)}\n\n"
            
            full_answer = ""
            for chunk in generate_grounded_answer_stream(system_prompt, payload.question, context_chunks):
                full_answer += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
                
            # Log interaction after stream finishes
            msg_id = insert_chat_interaction(
                agent_id=payload.expertId,
                user_message=payload.question,
                assistant_message=full_answer
            )
            
            yield f"data: {json.dumps({'type': 'done', 'id': msg_id})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate answer stream: {e}"
        )

@router.post("/multi/stream")
def chat_with_multiple_experts_stream(payload: MultiChatRequest):
    try:
        agents = fetch_agents()
        selected_agents = [a for a in agents if a["id"] in payload.expertIds]
        
        if not selected_agents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="None of the selected experts were found."
            )

        all_context_chunks = []
        for agent_id in payload.expertIds:
            chunks = retrieve_context(agent_id, payload.question, top_k=2)
            all_context_chunks.extend(chunks)

        expert_names = ", ".join([a["name"] for a in selected_agents])
        system_prompt = (
            f"You are the OmniMind Multi-Expert Synthesizer. You are answering on behalf of the following experts: {expert_names}. "
            "Your objective is to provide a comprehensive, combined answer drawing upon the diverse context provided from these multiple domains. "
            "Synthesize the information seamlessly, but cite the source documents clearly. "
            "If the answer cannot be found in the retrieved context, state clearly that the approved policy documents do not contain the answer."
        )
        from ..agents.prompts import FORMAT_INSTRUCTIONS
        system_prompt += FORMAT_INSTRUCTIONS

        sources = list(set([chunk["document_id"] for chunk in all_context_chunks if chunk.get("document_id")]))
        if not sources:
            sources = ["System Knowledge Base"]
            
        from ..utils.db import fetch_documents
        resolved_sources = []
        for agent_id in payload.expertIds:
            doc_records = fetch_documents(agent_id)
            doc_id_to_name = {d["id"]: d["name"] for d in doc_records}
            for src_id in sources:
                if src_id in doc_id_to_name and doc_id_to_name[src_id] not in resolved_sources:
                    resolved_sources.append(doc_id_to_name[src_id])
                    
        final_sources = [s for s in resolved_sources]
        if not final_sources and sources != ["System Knowledge Base"]:
            final_sources = sources
        elif not final_sources:
             final_sources = ["System Knowledge Base"]

        avg_health = sum([a["health"] for a in selected_agents]) // len(selected_agents)

        def event_generator():
            yield f"data: {json.dumps({'type': 'metadata', 'sources': final_sources, 'confidenceScore': avg_health, 'expert': 'OmniMind Synthesizer'})}\n\n"
            
            answer_generator = generate_grounded_answer_stream(
                system_prompt=system_prompt,
                user_question=payload.question,
                context_chunks=all_context_chunks
            )
            
            full_answer = ""
            for text_chunk in answer_generator:
                full_answer += text_chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': text_chunk})}\n\n"
                
            msg_id = insert_chat_interaction(
                agent_id=payload.expertIds[0],
                user_message=payload.question,
                assistant_message=full_answer
            )
            
            yield f"data: {json.dumps({'type': 'done', 'id': msg_id})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate multi-expert answer stream: {e}"
        )

@router.post("/{message_id}/feedback", status_code=status.HTTP_200_OK)
def submit_feedback(payload: ChatFeedbackRequest, message_id: int = Path(...)):
    try:
        success = update_chat_feedback(message_id, payload.isHelpful)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {e}"
        )
