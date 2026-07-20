import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from ..schemas.document import DocumentCreate, DocumentResponse
from ..utils.db import fetch_documents, insert_document, update_agent_status
from ..rag.vector_store import index_document
from ..rag.parser import parse_file
from ..core.config import settings
from google.cloud import storage

router = APIRouter(prefix="/documents", tags=["documents"])

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

GCS_BUCKET_NAME = settings.GCS_BUCKET_NAME or None
storage_client = storage.Client() if GCS_BUCKET_NAME else None

@router.get("", response_model=List[DocumentResponse])
def get_documents(agent_id: Optional[str] = None):
    try:
        return fetch_documents(agent_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch documents: {e}"
        )

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(payload: DocumentCreate, background_tasks: BackgroundTasks):
    try:
        doc_id = f"{payload.agentId}-{payload.name.lower().replace(' ', '-').replace('_', '-')}"
        # Make ID unique
        existing_docs = fetch_documents(payload.agentId)
        suffix = 1
        original_doc_id = doc_id
        while any(d["id"] == doc_id for d in existing_docs):
            doc_id = f"{original_doc_id}-{suffix}"
            suffix += 1
            
        # Check if actual file exists in storage folder
        file_path = os.path.join(STORAGE_DIR, payload.name)
        extracted_content = ""
        
        if os.path.exists(file_path):
            extracted_content = parse_file(file_path)
            doc_status = "Processing"
        else:
            # Fallback mock text generation based on document name and agentId for demo purposes
            doc_status = payload.status or "Processing"
            extracted_content = (
                f"This document represents the official guide for {payload.name}. "
                f"It outlines core regulations, operating policies, and guidelines managed by the {payload.owner} team. "
                f"All operations under the {payload.agentId} agent workflow must adhere to these specifications. "
                f"Specific guidelines require analysts to verify details, execute standard screening, "
                f"and escalate complex cases in accordance with section 4.1 procedures."
            )
            
        # Write to database
        db_doc = insert_document(
            doc_id=doc_id,
            name=payload.name,
            owner=payload.owner,
            status=doc_status,
            agent_id=payload.agentId,
            content=extracted_content
        )
        
        # Parse and index chunks in background
        background_tasks.add_task(index_document, doc_id, payload.agentId, extracted_content)
        
        update_agent_status(payload.agentId, "Active")
        
        return db_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest document: {e}"
        )

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    owner: str = Form(...),
    agentId: str = Form(...)
):
    try:
        # Save file to storage directory temporarily
        file_path = os.path.join(STORAGE_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Upload to Google Cloud Storage if configured
        if GCS_BUCKET_NAME and storage_client:
            bucket = storage_client.bucket(GCS_BUCKET_NAME)
            blob = bucket.blob(file.filename)
            blob.upload_from_filename(file_path)
            
        # Extract text content
        extracted_content = parse_file(file_path)
        if not extracted_content:
            # Safe default fallback in case file extraction fails/is empty
            extracted_content = f"Empty content or unparseable format for file: {file.filename}."
            
        # Make ID unique
        doc_id = f"{agentId}-{file.filename.lower().replace(' ', '-').replace('_', '-')}"
        existing_docs = fetch_documents(agentId)
        suffix = 1
        original_doc_id = doc_id
        while any(d["id"] == doc_id for d in existing_docs):
            doc_id = f"{original_doc_id}-{suffix}"
            suffix += 1
            
        # Write metadata and content to database
        db_doc = insert_document(
            doc_id=doc_id,
            name=file.filename,
            owner=owner,
            status="Processing",
            agent_id=agentId,
            content=extracted_content
        )
        
        # Index document chunks for RAG search in background
        background_tasks.add_task(index_document, doc_id, agentId, extracted_content)
        
        update_agent_status(agentId, "Active")
        
        return db_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload and parsing failed: {e}"
        )

from pydantic import BaseModel
class UrlUploadRequest(BaseModel):
    url: str
    owner: str
    agentId: str

@router.post("/url", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_url(payload: UrlUploadRequest, background_tasks: BackgroundTasks):
    try:
        import urllib.request
        from html.parser import HTMLParser
        
        class TextExtractor(HTMLParser):
            def __init__(self):
                super().__init__()
                self.text = []
                self.ignore = False
            def handle_starttag(self, tag, attrs):
                if tag in ['script', 'style', 'noscript']:
                    self.ignore = True
            def handle_endtag(self, tag):
                if tag in ['script', 'style', 'noscript']:
                    self.ignore = False
            def handle_data(self, data):
                if not self.ignore and data.strip():
                    self.text.append(data.strip())
            def get_text(self):
                return ' '.join(self.text)
                
        # Fetch the URL
        req = urllib.request.Request(payload.url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
        parser = TextExtractor()
        parser.feed(html)
        extracted_content = parser.get_text()
        
        if not extracted_content:
            extracted_content = f"Empty content or unparseable format for URL: {payload.url}."
            
        # Make ID unique
        filename = payload.url.split('//')[-1].split('/')[0] + "-webpage"
        doc_id = f"{payload.agentId}-{filename.lower().replace('.', '-')}"
        existing_docs = fetch_documents(payload.agentId)
        suffix = 1
        original_doc_id = doc_id
        while any(d["id"] == doc_id for d in existing_docs):
            doc_id = f"{original_doc_id}-{suffix}"
            suffix += 1
            
        # Write metadata and content to database
        db_doc = insert_document(
            doc_id=doc_id,
            name=payload.url,
            owner=payload.owner,
            status="Processing",
            agent_id=payload.agentId,
            content=extracted_content
        )
        
        # Index document chunks for RAG search in background
        background_tasks.add_task(index_document, doc_id, payload.agentId, extracted_content)
        
        update_agent_status(payload.agentId, "Active")
        
        return db_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"URL parsing failed: {e}"
        )

@router.delete("/{doc_id}")
def remove_document(doc_id: str):
    from ..utils.db import delete_document
    success = delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted"}
