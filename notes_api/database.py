"""Postgres connectivity: engine, session factory, FastAPI dependency.

Shared by the app and by Alembic (migrations/env.py imports DATABASE_URL from
here), so the connection string is configured in exactly one place.
"""

import os
from collections.abc import Iterator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

# Pinned to this package's own .env: load_dotenv() searches upward from the
# working directory, so a bare call misses it whenever the app is started from
# the repo root.
load_dotenv(Path(__file__).with_name(".env"))

# postgresql+psycopg://... -- see .env.example. No default: against a remote
# database a silent fallback turns a missing variable into a confusing
# connection error.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy notes_api/.env.example to "
        "notes_api/.env and fill in the connection string."
    )

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "").lower() in {"1", "true", "yes"},
    pool_pre_ping=True,  # drop connections the server closed under us
    pool_recycle=1800,  # Supabase's pooler hangs up on idle connections
    future=True,
)

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_session() -> Iterator[Session]:
    """FastAPI dependency yielding one session per request."""
    with SessionLocal() as session:
        yield session


def ping() -> bool:
    """True if the database answers a trivial query."""
    with engine.connect() as conn:
        return conn.execute(text("SELECT 1")).scalar_one() == 1
