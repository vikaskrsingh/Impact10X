import os
from typing import List
from google import genai
from google.genai import types
import ollama

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"Error initializing Gemini client: {e}")
    return None

def is_ollama_enabled() -> bool:
    return os.environ.get("USE_OLLAMA", "false").lower() == "true"

def generate_grounded_answer(
    system_prompt: str,
    user_question: str,
    context_chunks: List[dict]
) -> str:
    use_ollama = is_ollama_enabled()
    client = get_gemini_client() if not use_ollama else None
    
    # Build context formatting
    formatted_context = ""
    for idx, chunk in enumerate(context_chunks):
        doc_name = chunk.get("document_id") or "Source Doc"
        formatted_context += f"--- Source: {doc_name} ---\n{chunk['content']}\n\n"
        
    prompt = (
        f"Use the following source contexts to answer the question. Make sure to ground your answer "
        f"strictly in the source contexts provided below. If you use information from a source, cite the source name.\n\n"
        f"Retrieved Context:\n{formatted_context}\n"
        f"Question: {user_question}"
    )

    if use_ollama:
        try:
            model_name = os.environ.get("OLLAMA_CHAT_MODEL", "llama3")
            response = ollama.chat(
                model=model_name,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt}
                ]
            )
            return response['message']['content']
        except Exception as e:
            print(f"Error during Ollama generation: {e}. Falling back to simulated generation.")
            
    elif client:
        try:
            # Use gemini-2.5-flash or fallback to gemini-1.5-flash
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1
                )
            )
            return response.text
        except Exception as e:
            print(f"Error during Gemini generation: {e}. Falling back to simulated generation.")
            
    # Local Simulated Generation (Offline/Mock fallback)
    if not context_chunks:
        return (
            "I searched the active knowledge base but could not find any source documents or information relevant to your query. "
            "Please ensure the reference documents are uploaded and approved."
        )
        
    # Build a professional mock answer using the context chunks
    source_names = list(set([c.get("document_id") or "Source" for c in context_chunks]))
    sources_str = ", ".join(source_names)
    
    # Let's extract a few relevant sentences from the chunk content that might match words in the question
    sentences = []
    query_words = [w.lower() for w in user_question.split() if len(w) > 3]
    
    for chunk in context_chunks:
        content = chunk["content"]
        # Split by periods to get sentences
        chunk_sentences = [s.strip() for s in content.split(".") if s.strip()]
        for sentence in chunk_sentences:
            if any(word in sentence.lower() for word in query_words):
                if sentence not in sentences:
                    sentences.append(sentence)
                    
    # Fallback to first few sentences if no direct matches
    if not sentences:
        for chunk in context_chunks:
            chunk_sentences = [s.strip() for s in chunk["content"].split(".") if s.strip()]
            sentences.extend(chunk_sentences[:2])
            if len(sentences) >= 3:
                break
                
    joined_sentences = ". ".join(sentences[:3])
    if not joined_sentences.endswith("."):
        joined_sentences += "."
        
    answer = (
        f"[DEMO MODE - No GEMINI_API_KEY or USE_OLLAMA detected]\n\n"
        f"Grounded response based on approved knowledge assets ({sources_str}):\n\n"
        f"{joined_sentences}\n\n"
        f"For real LLM reasoning, please set USE_OLLAMA=true or the GEMINI_API_KEY environment variable."
    )
    return answer
