from fastapi import APIRouter, HTTPException, status, Path
from ..schemas.chat import ChatRequest, ChatResponse, ChatFeedbackRequest
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
        context_chunks = retrieve_context(payload.expertId, payload.question, top_k=2)
        
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
            
        context_chunks = retrieve_context(payload.expertId, payload.question, top_k=2)
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
            # Send initial metadata immediately
            metadata = {
                "type": "metadata",
                "sources": resolved_sources,
                "confidenceScore": agent["health"],
                "expert": agent["name"]
            }
            yield f"data: {json.dumps(metadata)}\n\n"

            full_answer = ""
            for event_type, content in generate_grounded_answer_stream(system_prompt, payload.question, context_chunks):
                if event_type == "chunk":
                    full_answer += content
                    yield f"data: {json.dumps({'type': 'chunk', 'text': content})}\n\n"
                elif event_type == "image":
                    # Image generated after text stream — append to end
                    yield f"data: {json.dumps({'type': 'image', 'markdown': content})}\n\n"
                elif event_type == "error":
                    yield f"data: {json.dumps({'type': 'chunk', 'text': content})}\n\n"

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
