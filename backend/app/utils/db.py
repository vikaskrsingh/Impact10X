import sqlite3
import os
from typing import List, Dict, Any, Optional

def get_db_connection():
    db_path = os.environ.get("DATABASE_URL", "omnimind.db")
    if db_path.startswith("postgresql"):
        # For local testing without docker, fallback to omnimind.db
        db_path = "omnimind.db"
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner TEXT NOT NULL,
            health INTEGER NOT NULL DEFAULT 100,
            status TEXT NOT NULL DEFAULT 'Active'
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            owner TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Approved',
            version TEXT NOT NULL DEFAULT 'v1',
            agent_id TEXT NOT NULL,
            content TEXT,
            FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT NOT NULL,
            agent_id TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding TEXT,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT NOT NULL,
            user_message TEXT NOT NULL,
            assistant_message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM agents")
    if cursor.fetchone()[0] == 0:
        cursor.executemany('''
            INSERT OR IGNORE INTO agents (id, name, owner, health, status) VALUES (?, ?, ?, ?, ?)
        ''', [
            ("kyc", "KYC Expert", "Compliance Team", 98, "Active"),
            ("aml", "AML Expert", "Risk & Compliance", 97, "Active"),
            ("compliance", "Compliance Expert", "Regulatory Board", 99, "Active"),
            ("payments", "Payments Expert", "Payments Processing", 95, "Active"),
            ("risk", "Risk Expert", "Enterprise Risk", 96, "Active"),
            ("esg", "ESG Expert", "Sustainability", 94, "Active"),
            ("wealth", "Wealth Expert", "Wealth Management", 98, "Active")
        ])

        default_docs = [
            ("doc-1", "KYC_Onboarding_Policy_2026.pdf", "Compliance Team", "Approved", "v4", "kyc", "Standard operating procedures for client onboarding."),
            ("doc-2", "AML_Sanctions_Policy_2026.pdf", "Risk & Compliance", "Approved", "v2", "aml", "Detailed policy on sanctions screening."),
            ("doc-3", "ESG Greenwashing Guidelines.pdf", "Sustainability", "In Review", "v1", "esg", "Guidelines on environmental metrics reporting."),
            ("doc-4", "Wealth Management Client Suitability.pdf", "Wealth Management", "Approved", "v3", "wealth", "Credit limits and investment risk policies.")
        ]
        
        cursor.executemany(
            "INSERT INTO documents (id, name, owner, status, version, agent_id, content) VALUES (?, ?, ?, ?, ?, ?, ?)",
            default_docs
        )
        
        for doc_id, name, owner, status, version, agent_id, content in default_docs:
            cursor.execute(
                "INSERT INTO document_chunks (document_id, agent_id, chunk_index, content) VALUES (?, ?, ?, ?)",
                (doc_id, agent_id, 0, content)
            )
            
        conn.commit()
        
    conn.close()

def fetch_agents() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.name, a.owner, a.health, a.status,
               (SELECT COUNT(*) FROM documents d WHERE d.agent_id = a.id) as documents,
               (SELECT COUNT(*) FROM chat_history c WHERE c.agent_id = a.id) as questions
        FROM agents a
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def insert_agent(agent_id: str, name: str, owner: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO agents (id, name, owner, health, status) VALUES (?, ?, ?, 100, 'New')",
        (agent_id, name, owner)
    )
    conn.commit()
    conn.close()
    return {
        "id": agent_id,
        "name": name,
        "owner": owner,
        "health": 100,
        "status": "New",
        "documents": 0,
        "questions": 0
    }

def delete_agent_by_id(agent_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM agents WHERE id = ?", (agent_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def update_agent_status(agent_id: str, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE agents SET status = ? WHERE id = ?", (status, agent_id))
    conn.commit()
    conn.close()

def update_document_status(doc_id: str, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE documents SET status = ? WHERE id = ?", (status, doc_id))
    conn.commit()
    conn.close()

def fetch_documents(agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if agent_id:
        cursor.execute("SELECT id, name, owner, status, version, agent_id as agentId FROM documents WHERE agent_id = ? ORDER BY id DESC", (agent_id,))
    else:
        cursor.execute("SELECT id, name, owner, status, version, agent_id as agentId FROM documents ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_document(doc_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM document_chunks WHERE document_id = ?", (doc_id,))
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def insert_document(doc_id: str, name: str, owner: str, status: str, agent_id: str, content: str = "") -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO documents (id, name, owner, status, version, agent_id, content) VALUES (?, ?, ?, ?, 'v1', ?, ?)",
        (doc_id, name, owner, status, agent_id, content)
    )
    conn.commit()
    conn.close()
    return {
        "id": doc_id,
        "name": name,
        "owner": owner,
        "status": status,
        "version": "v1",
        "agentId": agent_id
    }

def insert_document_chunks(chunks: List[Dict[str, Any]]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executemany(
        "INSERT INTO document_chunks (document_id, agent_id, chunk_index, content, embedding) VALUES (?, ?, ?, ?, ?)",
        [(c["document_id"], c["agent_id"], c["chunk_index"], c["content"], c.get("embedding")) for c in chunks]
    )
    conn.commit()
    conn.close()

def fetch_chunks_by_agent(agent_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, document_id, agent_id, chunk_index, content, embedding FROM document_chunks WHERE agent_id = ?", (agent_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def insert_chat_interaction(agent_id: str, user_message: str, assistant_message: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_history (agent_id, user_message, assistant_message) VALUES (?, ?, ?)",
        (agent_id, user_message, assistant_message)
    )
    msg_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return msg_id

def update_chat_feedback(message_id: int, is_helpful: bool) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT agent_id FROM chat_history WHERE id = ?", (message_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
        
    agent_id = row["agent_id"]
    
    if is_helpful:
        cursor.execute("UPDATE agents SET health = MIN(health + 1, 100) WHERE id = ?", (agent_id,))
    else:
        cursor.execute("UPDATE agents SET health = MAX(health - 2, 0) WHERE id = ?", (agent_id,))
        
    conn.commit()
    conn.close()
    return True

def fetch_dashboard_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as count, AVG(health) as avg_health FROM agents")
    agent_stats = cursor.fetchone()
    
    cursor.execute("SELECT COUNT(*) as count FROM documents")
    doc_stats = cursor.fetchone()
    
    cursor.execute("SELECT COUNT(*) as count FROM chat_history")
    chat_stats = cursor.fetchone()
    
    conn.close()
    
    return {
        "totalExperts": agent_stats["count"] if agent_stats and agent_stats["count"] else 0,
        "averageHealth": round(agent_stats["avg_health"]) if agent_stats and agent_stats["avg_health"] else 100,
        "totalDocuments": doc_stats["count"] if doc_stats else 0,
        "totalQuestions": chat_stats["count"] if chat_stats else 0,
    }

def fetch_recent_uploads(limit: int = 3) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name, owner, status
        FROM documents
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def fetch_recent_activity(limit: int = 4) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            'Document Uploaded' as title,
            'Document ' || name || ' was added by ' || owner as detail,
            'Recent' as time
        FROM documents
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    doc_rows = cursor.fetchall()
    
    cursor.execute("""
        SELECT 
            'Question Asked' as title,
            'A user queried expert ' || a.name as detail,
            'Recent' as time
        FROM chat_history c
        JOIN agents a ON c.agent_id = a.id
        ORDER BY c.timestamp DESC
        LIMIT ?
    """, (limit,))
    chat_rows = cursor.fetchall()
    
    conn.close()
    
    combined = [dict(r) for r in doc_rows] + [dict(r) for r in chat_rows]
    return combined[:limit]
