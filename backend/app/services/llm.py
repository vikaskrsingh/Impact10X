from typing import List
from google import genai
from google.genai import types
import ollama
import re
import os
import uuid

from ..core.config import settings

def get_gemini_client():
    api_key = settings.GEMINI_API_KEY
    if api_key:
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"Error initializing Gemini client: {e}")
    return None

def is_ollama_enabled() -> bool:
    return settings.USE_OLLAMA

def process_image_prompts(response_text: str, client) -> str:
    if not settings.ENABLE_IMAGE_GENERATION or not client:
        return response_text

    pattern = r'\[IMAGE_PROMPT:\s*(.*?)\]'
    
    def replacer(match):
        prompt = match.group(1)
        public_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "images")
        os.makedirs(public_dir, exist_ok=True)
        try:
            print(f"Generating image for prompt: {prompt}")
            result = client.models.generate_images(
                model='imagen-3.0-generate-002',
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="16:9"
                )
            )
            for generated_image in result.generated_images:
                filename = f"gen_{uuid.uuid4().hex[:8]}.png"
                filepath = os.path.join(public_dir, filename)
                
                with open(filepath, "wb") as f:
                    f.write(generated_image.image.image_bytes)
                
                return f"![Generated Image](/images/{filename})"
        except Exception as e:
            print(f"Error generating image: {e}")
        return match.group(0)

    return re.sub(pattern, replacer, response_text, flags=re.IGNORECASE)

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
        f"IMPORTANT FORMATTING REQUIREMENT:\n"
        f"You must format your entire response as a highly structured, formal markdown document. "
        f"Use appropriate markdown elements such as Headings (##), Subheadings (###), Tables, Bullet points, "
        f"and Bold text to organize the information clearly and professionally. Do not return plain conversational text.\n\n"
    )
    
    if settings.ENABLE_IMAGE_GENERATION:
        prompt += (
            f"If the user explicitly asks for an image, or if the context warrants a visual representation, "
            f"generate an image prompt and enclose it in exactly this format: [IMAGE_PROMPT: <detailed description of the image>]. "
            f"For example: [IMAGE_PROMPT: A professional pie chart showing corporate risk distribution].\n\n"
        )
        
    prompt += (
        f"Retrieved Context:\n{formatted_context}\n"
        f"Question: {user_question}"
    )

    if use_ollama:
        try:
            model_name = settings.OLLAMA_CHAT_MODEL
            response = ollama.chat(
                model=model_name,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt}
                ]
            )
            return process_image_prompts(response['message']['content'], client)
        except Exception as e:
            print(f"Error during Ollama generation: {e}. Falling back to simulated generation.")
            
    elif client:
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1
                )
            )
            return process_image_prompts(response.text, client)
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
    return process_image_prompts(answer, client)

def generate_grounded_answer_stream(
    system_prompt: str,
    user_question: str,
    context_chunks: List[dict]
):
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
            model_name = settings.OLLAMA_CHAT_MODEL
            response = ollama.chat(
                model=model_name,
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt}
                ],
                stream=True
            )
            for chunk in response:
                if 'message' in chunk and 'content' in chunk['message']:
                    yield chunk['message']['content']
            return
        except Exception as e:
            print(f"Error during Ollama generation: {e}. Falling back to simulated generation.")
            
    elif client:
        try:
            response_stream = client.models.generate_content_stream(
                model=settings.GEMINI_CHAT_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1
                )
            )
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            print(f"Error during Gemini generation: {e}. Falling back to simulated generation.")
            
    # Local Simulated Generation (Offline/Mock fallback)
    if not context_chunks:
        yield "I searched the active knowledge base but could not find any source documents or information relevant to your query. Please ensure the reference documents are uploaded and approved."
        return
        
    source_names = list(set([c.get("document_id") or "Source" for c in context_chunks]))
    sources_str = ", ".join(source_names)
    
    sentences = []
    query_words = [w.lower() for w in user_question.split() if len(w) > 3]
    
    for chunk in context_chunks:
        content = chunk["content"]
        chunk_sentences = [s.strip() for s in content.split(".") if s.strip()]
        for sentence in chunk_sentences:
            if any(word in sentence.lower() for word in query_words):
                if sentence not in sentences:
                    sentences.append(sentence)
                    
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
    
    import time
    words = answer.split(' ')
    for word in words:
        yield word + ' '
        time.sleep(0.05)

