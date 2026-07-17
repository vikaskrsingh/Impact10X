import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from ..schemas.document import DocumentCreate, DocumentResponse
from ..utils.db import fetch_documents, insert_document
from ..rag.vector_store import index_document
from ..rag.parser import parse_file
from google.cloud import storage

router = APIRouter(prefix="/documents", tags=["documents"])

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME")
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
def upload_document(payload: DocumentCreate):
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
            doc_status = "Approved"
        else:
            # Fallback mock text generation based on document name and agentId for demo purposes
            doc_status = payload.status or "Approved"
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
        
        # Parse and index chunks
        index_document(doc_id, payload.agentId, extracted_content)
        
        return db_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest document: {e}"
        )

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
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
            status="Approved",
            agent_id=agentId,
            content=extracted_content
        )
        
        # Index document chunks for RAG search
        index_document(doc_id, agentId, extracted_content)
        
        return db_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload and parsing failed: {e}"
        )
