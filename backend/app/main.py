from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .utils.db import init_db
from .api import agents, documents, chat, dashboard

app = FastAPI(title="OmniMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Register API routers
app.include_router(agents.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(dashboard.router)

@app.get("/")
def health():
    return {"application": "OmniMind", "status": "Running"}