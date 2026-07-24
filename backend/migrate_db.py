import os
import json
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker

# Import models from our db module so we have the SQLAlchemy structure
from app.utils.db import User, Agent, UserAgentAccess, Document, DocumentChunk, ChatHistory

def remove_null_bytes(text):
    if isinstance(text, str):
        return text.replace("\x00", "")
    return text

def migrate():
    # SQLite Setup
    sqlite_url = "sqlite:///omnimind.db"
    sqlite_engine = create_engine(sqlite_url)
    SqliteSession = sessionmaker(bind=sqlite_engine)
    
    # Postgres Setup
    # Hardcoding the public IP we found since we are running this locally over the internet
    pg_url = "postgresql+psycopg2://omni:omnimind123@34.56.57.0:5432/omnimind_db"
    pg_engine = create_engine(pg_url)
    PgSession = sessionmaker(bind=pg_engine)
    
    print("Extracting from SQLite...")
    with SqliteSession() as s_session:
        users = s_session.query(User).all()
        agents = s_session.query(Agent).all()
        access = s_session.query(UserAgentAccess).all()
        docs = s_session.query(Document).all()
        chunks = s_session.query(DocumentChunk).all()
        chats = s_session.query(ChatHistory).all()
        
    print(f"Extracted {len(users)} users, {len(agents)} agents, {len(docs)} documents, {len(chunks)} chunks, {len(chats)} chats.")
    
    print("Inserting into Postgres...")
    with PgSession() as p_session:
        # Clear existing data just in case
        p_session.query(User).delete()
        p_session.query(Agent).delete()
        p_session.query(Document).delete()
        
        # 1. Users
        for u in users:
            new_u = User(username=u.username, password_hash=u.password_hash, role=u.role)
            # preserve IDs to keep relationships intact
            new_u.id = u.id 
            p_session.add(new_u)
            
        # 2. Agents
        for a in agents:
            new_a = Agent(id=a.id, name=a.name, owner=a.owner, health=a.health, status=a.status)
            p_session.add(new_a)
            
        # 3. Access
        for ac in access:
            p_session.add(UserAgentAccess(user_id=ac.user_id, agent_id=ac.agent_id))
            
        # 4. Documents
        for d in docs:
            p_session.add(Document(id=d.id, name=remove_null_bytes(d.name), owner=remove_null_bytes(d.owner), status=remove_null_bytes(d.status), version=d.version, agent_id=d.agent_id, content=remove_null_bytes(d.content)))
            
        # 5. Chunks
        for c in chunks:
            # Parse the embedding JSON string back to a list of floats
            emb = c.embedding
            if isinstance(emb, str):
                try:
                    emb = json.loads(emb)
                except Exception:
                    emb = None
                    
            if isinstance(emb, list) and len(emb) > 768:
                emb = emb[:768]
            
            p_session.add(DocumentChunk(
                document_id=c.document_id,
                agent_id=c.agent_id,
                chunk_index=c.chunk_index,
                content=remove_null_bytes(c.content),
                embedding=emb
            ))
            
        # 6. Chat History
        for ch in chats:
            p_session.add(ChatHistory(
                agent_id=ch.agent_id,
                session_id=ch.session_id,
                user_message=remove_null_bytes(ch.user_message),
                assistant_message=remove_null_bytes(ch.assistant_message),
                timestamp=ch.timestamp
            ))
            
        print("Committing to Postgres...")
        p_session.commit()
        
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
