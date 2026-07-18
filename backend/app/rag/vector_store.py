import json
import os
import re
import math
from collections import Counter
from typing import List, Dict, Any, Optional
import concurrent.futures
from google import genai
import ollama
from ..utils.db import insert_document_chunks, fetch_chunks_by_agent, update_document_status

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

def get_tokens(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())

def compute_local_similarity(query_tokens: List[str], chunk_text: str) -> float:
    chunk_tokens = get_tokens(chunk_text)
    if not chunk_tokens:
        return 0.0
    
    chunk_counter = Counter(chunk_tokens)
    query_counter = Counter(query_tokens)
    
    intersection = set(chunk_counter.keys()) & set(query_counter.keys())
    numerator = sum(chunk_counter[w] * query_counter[w] for w in intersection)
    
    sum1 = sum(chunk_counter[w]**2 for w in chunk_counter)
    sum2 = sum(query_counter[w]**2 for w in query_counter)
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    
    if not denominator:
        return 0.0
    return numerator / denominator

def get_gemini_client() -> Optional[genai.Client]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"Error initializing Gemini client for embeddings: {e}")
    return None

def is_ollama_enabled() -> bool:
    return os.environ.get("USE_OLLAMA", "false").lower() == "true"

def _embed_chunk(idx: int, chunk: str, use_ollama: bool, client: Optional[genai.Client]) -> Dict[str, Any]:
    embedding_str = None
    if use_ollama:
        try:
            model_name = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
            response = ollama.embeddings(model=model_name, prompt=chunk)
            embedding_str = json.dumps(response["embedding"])
        except Exception as e:
            print(f"Failed to generate Ollama embedding for chunk {idx}: {e}")
    elif client:
        try:
            response = client.models.embed_content(
                model='text-embedding-004',
                contents=chunk
            )
            embedding_str = json.dumps(response.embeddings[0].values)
        except Exception as e:
            print(f"Failed to generate Gemini embedding for chunk {idx}: {e}")
            
    return {
        "chunk_index": idx,
        "content": chunk,
        "embedding": embedding_str
    }

def process_document_background(document_id: str, agent_id: str, text: str) -> None:
    try:
        chunks = chunk_text(text)
        if not chunks:
            update_document_status(document_id, "Approved")
            return
            
        use_ollama = is_ollama_enabled()
        client = get_gemini_client() if not use_ollama else None
        
        db_chunks = []
        max_workers = 5
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for idx, chunk in enumerate(chunks):
                futures.append(executor.submit(_embed_chunk, idx, chunk, use_ollama, client))
                
            for future in concurrent.futures.as_completed(futures):
                res = future.result()
                db_chunks.append({
                    "document_id": document_id,
                    "agent_id": agent_id,
                    "chunk_index": res["chunk_index"],
                    "content": res["content"],
                    "embedding": res["embedding"]
                })
                
        # Sort chunks to maintain order before inserting
        db_chunks.sort(key=lambda x: x["chunk_index"])
        insert_document_chunks(db_chunks)
        update_document_status(document_id, "Approved")
        
    except Exception as e:
        print(f"Background processing failed for document {document_id}: {e}")
        update_document_status(document_id, "Failed")

def index_document(document_id: str, agent_id: str, text: str) -> None:
    # Forward to the new process (used primarily by the original sync logic if called directly)
    process_document_background(document_id, agent_id, text)

def retrieve_context(agent_id: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    chunks = fetch_chunks_by_agent(agent_id)
    if not chunks:
        return []
        
    use_ollama = is_ollama_enabled()
    client = get_gemini_client() if not use_ollama else None
    scored_chunks = []
    
    # Attempt embedding similarity if engine is active and embeddings exist in db
    can_use_embeddings = (use_ollama or client) and all(c.get("embedding") for c in chunks)
    
    if can_use_embeddings:
        try:
            query_embedding = None
            if use_ollama:
                model_name = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
                response = ollama.embeddings(model=model_name, prompt=query)
                query_embedding = response["embedding"]
            else:
                response = client.models.embed_content(
                    model='text-embedding-004',
                    contents=query
                )
                query_embedding = response.embeddings[0].values
            
            for chunk in chunks:
                chunk_emb = json.loads(chunk["embedding"])
                
                # Compute cosine similarity
                dot_product = sum(a * b for a, b in zip(query_embedding, chunk_emb))
                norm_a = math.sqrt(sum(a * a for a in query_embedding))
                norm_b = math.sqrt(sum(b * b for b in chunk_emb))
                similarity = dot_product / (norm_a * norm_b) if norm_a and norm_b else 0.0
                
                scored_chunks.append((chunk, similarity))
        except Exception as e:
            print(f"Embedding search failed (Ollama={use_ollama}), falling back to local keyword matching: {e}")
            can_use_embeddings = False # Force fallback
            
    # Fallback to local keyword search
    if not can_use_embeddings or not scored_chunks:
        query_tokens = get_tokens(query)
        for chunk in chunks:
            similarity = compute_local_similarity(query_tokens, chunk["content"])
            scored_chunks.append((chunk, similarity))
            
    # Sort by similarity descending
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    
    # Return top K chunks as a list of dicts
    return [item[0] for item in scored_chunks[:top_k]]
