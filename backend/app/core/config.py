"""
Centralized application configuration.

All environment-related properties are loaded from a .env file
(located in the backend root) and exposed via a single `settings` instance.
To switch databases, LLM providers, or embedding models in production,
edit the .env file and restart the server — no code changes required.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Locate the .env file relative to this file: backend/.env
_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_path = _backend_dir / ".env"
load_dotenv(_env_path)


class Settings:
    """Read-once configuration sourced from .env → os.environ fallbacks."""

    # ── Database ──────────────────────────────────────────────────────
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "omnimind.db")

    # ── LLM engine toggle ─────────────────────────────────────────────
    USE_OLLAMA: bool = os.environ.get("USE_OLLAMA", "false").lower() == "true"
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")

    # ── Chat models ───────────────────────────────────────────────────
    OLLAMA_CHAT_MODEL: str = os.environ.get("OLLAMA_CHAT_MODEL", "llama3")
    GEMINI_CHAT_MODEL: str = os.environ.get("GEMINI_CHAT_MODEL", "gemini-3.5-flash")

    # ── Embedding models ──────────────────────────────────────────────
    OLLAMA_EMBED_MODEL: str = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    GEMINI_EMBED_MODEL: str = os.environ.get("GEMINI_EMBED_MODEL", "text-embedding-004")

    # ── Vector DB ─────────────────────────────────────────────────────
    VECTOR_DB_TYPE: str = os.environ.get("VECTOR_DB_TYPE", "sqlite")

    # ── Cloud storage (optional) ──────────────────────────────────────
    GCS_BUCKET_NAME: str = os.environ.get("GCS_BUCKET_NAME", "")

    # ── Image Generation ──────────────────────────────────────────────
    ENABLE_IMAGE_GENERATION: bool = os.environ.get("ENABLE_IMAGE_GENERATION", "false").lower() == "true"


# Singleton instance used across the application
settings = Settings()
