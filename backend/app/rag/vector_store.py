import json
import re
import math
from collections import Counter
from typing import List, Dict, Any, Optional
import concurrent.futures
from google import genai
from ..core.config import settings
from ..utils.db import insert_document_chunks, fetch_chunks_by_agent, update_document_status, SessionLocal, DocumentChunk

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
    api_key = settings.GEMINI_API_KEY
    if api_key:
        try:
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"Error initializing Gemini client for embeddings: {e}")
    return None

def _embed_chunk(idx: int, chunk: str, client: Optional[genai.Client]) -> Dict[str, Any]:
    embedding_list = None
    if client:
        try:
            response = client.models.embed_content(
                model=settings.GEMINI_EMBED_MODEL,
                contents=chunk
            )
            embedding_list = response.embeddings[0].values
        except Exception as e:
            print(f"Failed to generate Gemini embedding for chunk {idx}: {e}")
            
    return {
        "chunk_index": idx,
        "content": chunk,
        "embedding": embedding_list
    }

def process_document_background(document_id: str, agent_id: str, text: str) -> None:
    try:
        chunks = chunk_text(text)
        if not chunks:
            update_document_status(document_id, "Approved")
            return
            
        client = get_gemini_client()
        
        db_chunks = []
        max_workers = 5
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for idx, chunk in enumerate(chunks):
                futures.append(executor.submit(_embed_chunk, idx, chunk, client))
                
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
    client = get_gemini_client()
    
    # 1. Try Native GCP Vector Search (pgvector)
    if client:
        try:
            response = client.models.embed_content(
                model=settings.GEMINI_EMBED_MODEL,
                contents=query
            )
            query_embedding = response.embeddings[0].values
            
            with SessionLocal() as session:
                chunks = session.query(DocumentChunk).filter(DocumentChunk.agent_id == agent_id).order_by(
                    DocumentChunk.embedding.cosine_distance(query_embedding)
                ).limit(top_k).all()
                
                if chunks:
                    return [{"content": c.content, "document_id": c.document_id} for c in chunks]
        except Exception as e:
            print(f"Native vector search failed, falling back to local keyword matching: {e}")
            
    # 2. Fallback to local keyword search
    chunks = fetch_chunks_by_agent(agent_id)
    if not chunks:
        return []
        
    query_tokens = get_tokens(query)
    scored_chunks = []
    
    for chunk in chunks:
        similarity = compute_local_similarity(query_tokens, chunk["content"])
        scored_chunks.append((chunk, similarity))
        
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    return [item[0] for item in scored_chunks[:top_k]]
