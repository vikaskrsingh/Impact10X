import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import (
    create_engine, Column, String, Integer, ForeignKey, Text, DateTime,
    func, event, Float
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, aliased
from pgvector.sqlalchemy import Vector

from ..core.config import settings

_db_url = settings.DATABASE_URL

# Convert local sqlite relative path to SQLAlchemy connection string
if "://" not in _db_url:
    _db_url = f"sqlite:///{_db_url}"

# If PostgreSQL URL starts with postgres://, replace with postgresql://
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(_db_url)

# Enable foreign keys for SQLite database connections
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception:
        pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="expert")

class UserAgentAccess(Base):
    __tablename__ = 'user_agent_access'
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    agent_id = Column(String, ForeignKey('agents.id', ondelete='CASCADE'), primary_key=True)

class Agent(Base):
    __tablename__ = 'agents'
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    health = Column(Integer, nullable=False, default=100)
    status = Column(String, nullable=False, default='Active')

    documents = relationship("Document", back_populates="agent", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="agent", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = 'documents'
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    owner = Column(String, nullable=False)
    status = Column(String, nullable=False, default='Approved')
    version = Column(String, nullable=False, default='v1')
    agent_id = Column(String, ForeignKey('agents.id', ondelete='CASCADE'), nullable=False)
    content = Column(Text, nullable=True)

    agent = relationship("Agent", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = 'document_chunks'
    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String, ForeignKey('documents.id', ondelete='CASCADE'), nullable=False)
    agent_id = Column(String, ForeignKey('agents.id', ondelete='CASCADE'), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=True)

    document = relationship("Document", back_populates="chunks")

class ChatHistory(Base):
    __tablename__ = 'chat_history'
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String, ForeignKey('agents.id', ondelete='CASCADE'), nullable=False)
    session_id = Column(String, index=True, nullable=True)
    user_message = Column(Text, nullable=False)
    assistant_message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    agent = relationship("Agent", back_populates="chat_history")

class TokenUsage(Base):
    __tablename__ = 'token_usage'
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String, index=True, nullable=True)
    operation = Column(String, nullable=False) # 'chat' or 'embed'
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


def init_db():
    from sqlalchemy import text
    if settings.VECTOR_DB_TYPE == "postgres":
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    Base.metadata.create_all(bind=engine)
    
    with SessionLocal() as session:
        # Check if default users exist
        if session.query(User).count() == 0:
            import bcrypt
            # Seed default users with password 'password'
            # (In a real app, hash should be generated securely beforehand)
            # For this MVP, we hash on startup if no users exist.
            pwd_hash = bcrypt.hashpw(b"password", bcrypt.gensalt()).decode("utf-8")
            users = [
                User(username="admin", password_hash=pwd_hash, role="admin"),
                User(username="Vikas", password_hash=pwd_hash, role="admin"),
                User(username="Nehal", password_hash=pwd_hash, role="admin"),
                User(username="Rajdeep", password_hash=pwd_hash, role="admin"),
                User(username="Chitra", password_hash=pwd_hash, role="expert"),
                User(username="Pranita", password_hash=pwd_hash, role="expert"),
                User(username="expert", password_hash=pwd_hash, role="expert")
            ]
            session.add_all(users)
            session.commit()

        # Dummy agents seeding removed

def fetch_agents(username: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
    with SessionLocal() as session:
        doc_count_subquery = session.query(func.count(Document.id)).filter(Document.agent_id == Agent.id).correlate(Agent).scalar_subquery()
        chat_count_subquery = session.query(func.count(ChatHistory.id)).filter(ChatHistory.agent_id == Agent.id).correlate(Agent).scalar_subquery()
        
        ua_alias = aliased(UserAgentAccess)
        user_count_subquery = session.query(func.count(ua_alias.user_id)).filter(ua_alias.agent_id == Agent.id).correlate(Agent).scalar_subquery()
        
        admin_count = session.query(func.count(User.id)).filter(User.role == 'admin').scalar()
        
        query = session.query(
            Agent.id,
            Agent.name,
            Agent.owner,
            Agent.health,
            Agent.status,
            doc_count_subquery.label("documents"),
            chat_count_subquery.label("questions"),
            user_count_subquery.label("user_accesses")
        ).order_by(Agent.name)
        
        # If the user is an expert, filter by assigned agents
        if role == "expert" and username:
            user = session.query(User).filter(User.username == username).first()
            if user:
                query = query.join(UserAgentAccess, UserAgentAccess.agent_id == Agent.id).filter(UserAgentAccess.user_id == user.id)
            else:
                return [] # User not found, no access

        results = []
        for row in query.all():
            results.append({
                "id": row.id,
                "name": row.name,
                "owner": row.owner,
                "health": row.health,
                "status": row.status,
                "documents": row.documents,
                "questions": row.questions,
                "users": row.user_accesses + admin_count
            })
        return results

def fetch_users_with_access() -> List[Dict[str, Any]]:
    with SessionLocal() as session:
        users = session.query(User).all()
        result = []
        for user in users:
            accesses = session.query(UserAgentAccess).filter(UserAgentAccess.user_id == user.id).all()
            agent_ids = [a.agent_id for a in accesses]
            result.append({
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "allowed_agents": agent_ids
            })
        return result

def update_user_access(username: str, agent_ids: List[str]) -> bool:
    with SessionLocal() as session:
        user = session.query(User).filter(User.username == username).first()
        if not user:
            return False
            
        # Clear existing access
        session.query(UserAgentAccess).filter(UserAgentAccess.user_id == user.id).delete()
        
        # Insert new access
        for aid in agent_ids:
            session.add(UserAgentAccess(user_id=user.id, agent_id=aid))
            
        session.commit()
        return True

def insert_agent(agent_id: str, name: str, owner: str) -> Dict[str, Any]:
    with SessionLocal() as session:
        import random
        initial_health = random.randint(88, 98)
        agent = Agent(id=agent_id, name=name, owner=owner, health=initial_health, status="New")
        session.add(agent)
        session.commit()
        return {
            "id": agent_id,
            "name": name,
            "owner": owner,
            "health": initial_health,
            "status": "New",
            "documents": 0,
            "questions": 0
        }

def delete_agent_by_id(agent_id: str) -> bool:
    with SessionLocal() as session:
        agent = session.query(Agent).filter(Agent.id == agent_id).first()
        if agent:
            session.delete(agent)
            session.commit()
            return True
        return False

def update_agent_status(agent_id: str, status: str):
    with SessionLocal() as session:
        agent = session.query(Agent).filter(Agent.id == agent_id).first()
        if agent:
            agent.status = status
            session.commit()

def update_document_status(doc_id: str, status: str):
    with SessionLocal() as session:
        doc = session.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = status
            session.commit()

def fetch_documents(agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
    with SessionLocal() as session:
        query = session.query(
            Document.id,
            Document.name,
            Document.owner,
            Document.status,
            Document.version,
            Document.agent_id.label("agentId")
        )
        if agent_id:
            query = query.filter(Document.agent_id == agent_id)
        query = query.order_by(Document.id.desc())
        
        results = []
        for row in query.all():
            results.append({
                "id": row.id,
                "name": row.name,
                "owner": row.owner,
                "status": row.status,
                "version": row.version,
                "agentId": row.agentId
            })
        return results

def delete_document(doc_id: str) -> bool:
    with SessionLocal() as session:
        doc = session.query(Document).filter(Document.id == doc_id).first()
        if doc:
            session.delete(doc)
            session.commit()
            return True
        return False

def insert_document(doc_id: str, name: str, owner: str, status: str, agent_id: str, content: str = "") -> Dict[str, Any]:
    with SessionLocal() as session:
        doc = Document(
            id=doc_id,
            name=name,
            owner=owner,
            status=status,
            version="v1",
            agent_id=agent_id,
            content=content
        )
        session.add(doc)
        session.commit()
        return {
            "id": doc_id,
            "name": name,
            "owner": owner,
            "status": status,
            "version": "v1",
            "agentId": agent_id
        }

def insert_document_chunks(chunks: List[Dict[str, Any]]):
    with SessionLocal() as session:
        db_chunks = []
        for c in chunks:
            db_chunks.append(DocumentChunk(
                document_id=c["document_id"],
                agent_id=c["agent_id"],
                chunk_index=c["chunk_index"],
                content=c["content"],
                embedding=c.get("embedding")
            ))
        session.add_all(db_chunks)
        session.commit()

def fetch_chunks_by_agent(agent_id: str) -> List[Dict[str, Any]]:
    with SessionLocal() as session:
        query = session.query(
            DocumentChunk.id,
            DocumentChunk.document_id,
            DocumentChunk.agent_id,
            DocumentChunk.chunk_index,
            DocumentChunk.content,
            DocumentChunk.embedding
        ).filter(DocumentChunk.agent_id == agent_id)
        
        results = []
        for row in query.all():
            results.append({
                "id": row.id,
                "document_id": row.document_id,
                "agent_id": row.agent_id,
                "chunk_index": row.chunk_index,
                "content": row.content,
                "embedding": row.embedding
            })
        return results

def insert_chat_interaction(agent_id: str, user_message: str, assistant_message: str, session_id: str = None) -> int:
    with SessionLocal() as session:
        chat = ChatHistory(
            agent_id=agent_id,
            user_message=user_message,
            assistant_message=assistant_message,
            session_id=session_id
        )
        session.add(chat)
        session.commit()
        return chat.id

def fetch_chat_history(agent_id: str, session_id: str) -> List[Dict[str, Any]]:
    with SessionLocal() as session:
        history = session.query(ChatHistory).filter(
            ChatHistory.agent_id == agent_id,
            ChatHistory.session_id == session_id
        ).order_by(ChatHistory.timestamp.asc()).all()
        
        results = []
        for chat in history:
            results.append({
                "id": chat.id,
                "user_message": chat.user_message,
                "assistant_message": chat.assistant_message,
                "timestamp": chat.timestamp.isoformat()
            })
        return results

def clear_chat_history(agent_id: str, session_id: str) -> bool:
    with SessionLocal() as session:
        deleted_count = session.query(ChatHistory).filter(
            ChatHistory.agent_id == agent_id,
            ChatHistory.session_id == session_id
        ).delete()
        session.commit()
        return deleted_count > 0

def update_chat_feedback(message_id: int, is_helpful: bool) -> bool:
    with SessionLocal() as session:
        chat = session.query(ChatHistory).filter(ChatHistory.id == message_id).first()
        if not chat:
            return False
        
        agent = session.query(Agent).filter(Agent.id == chat.agent_id).first()
        if agent:
            if is_helpful:
                agent.health = min(agent.health + 1, 100)
            else:
                agent.health = max(agent.health - 2, 0)
            session.commit()
            return True
        return False

def fetch_dashboard_stats() -> Dict[str, Any]:
    with SessionLocal() as session:
        agent_stats = session.query(
            func.count(Agent.id).label("count"),
            func.avg(Agent.health).label("avg_health")
        ).first()
        
        doc_count = session.query(func.count(Document.id)).scalar()
        chat_count = session.query(func.count(ChatHistory.id)).scalar()
        
        total_experts = agent_stats.count if agent_stats and agent_stats.count else 0
        avg_health = round(agent_stats.avg_health) if agent_stats and agent_stats.avg_health else 100
        
        return {
            "totalExperts": total_experts,
            "averageHealth": avg_health,
            "totalDocuments": doc_count if doc_count else 0,
            "totalQuestions": chat_count if chat_count else 0,
        }

def fetch_recent_uploads(limit: int = 3) -> List[Dict[str, Any]]:
    with SessionLocal() as session:
        query = session.query(
            Document.name,
            Document.owner,
            Document.status
        ).order_by(Document.id.desc()).limit(limit)
        
        results = []
        for row in query.all():
            results.append({
                "name": row.name,
                "owner": row.owner,
                "status": row.status
            })
        return results

def fetch_recent_activity(limit: int = 4) -> List[Dict[str, Any]]:
    with SessionLocal() as session:
        doc_query = session.query(
            Document.name,
            Document.owner
        ).order_by(Document.id.desc()).limit(limit)
        
        chat_query = session.query(
            Agent.name.label("agent_name"),
            ChatHistory.timestamp
        ).join(Agent, ChatHistory.agent_id == Agent.id).order_by(ChatHistory.timestamp.desc()).limit(limit)
        
        doc_rows = doc_query.all()
        chat_rows = chat_query.all()
        
        combined = []
        for row in doc_rows:
            combined.append({
                "title": "Document Uploaded",
                "detail": f"Document {row.name} was added by {row.owner}",
                "time": "Recent"
            })
        
        for row in chat_rows:
            combined.append({
                "title": "Question Asked",
                "detail": f"A user queried expert {row.agent_name}",
                "time": "Recent"
            })
            
        return combined[:limit]

def fetch_token_metrics() -> Dict[str, Any]:
    with SessionLocal() as session:
        # Sum all tokens and cost
        total_input = session.query(func.sum(TokenUsage.input_tokens)).scalar() or 0
        total_output = session.query(func.sum(TokenUsage.output_tokens)).scalar() or 0
        total_cost = session.query(func.sum(TokenUsage.cost)).scalar() or 0.0
        
        # Get usage over the last 7 days for a chart
        seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        # We'll just group by the date component of the timestamp
        daily_records = session.query(
            func.date(TokenUsage.timestamp).label('day'),
            func.sum(TokenUsage.input_tokens + TokenUsage.output_tokens).label('tokens'),
            func.sum(TokenUsage.cost).label('cost')
        ).filter(TokenUsage.timestamp >= seven_days_ago) \
         .group_by(func.date(TokenUsage.timestamp)) \
         .order_by(func.date(TokenUsage.timestamp)).all()
         
        chart_data = []
        for r in daily_records:
            chart_data.append({
                "date": str(r.day),
                "tokens": int(r.tokens),
                "cost": float(r.cost)
            })
            
        # If there's only 1 data point, Recharts AreaChart won't draw anything.
        # Add a dummy data point for the previous day so it renders a line.
        if len(chart_data) == 1:
            prev_date = datetime.datetime.strptime(chart_data[0]["date"], "%Y-%m-%d") - datetime.timedelta(days=1)
            chart_data.insert(0, {
                "date": prev_date.strftime("%Y-%m-%d"),
                "tokens": 0,
                "cost": 0.0
            })
            
        return {
            "total_input_tokens": int(total_input),
            "total_output_tokens": int(total_output),
            "total_tokens": int(total_input + total_output),
            "total_cost_usd": float(total_cost),
            "chart_data": chart_data
        }
