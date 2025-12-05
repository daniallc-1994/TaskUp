import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL") or ""

engine = create_engine(DATABASE_URL, echo=False, future=True) if DATABASE_URL else None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None


def get_db():
    """FastAPI dependency that yields a SQLAlchemy session."""
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL not configured for SQLAlchemy session")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables in dev-only scenarios."""
    if engine is None:
        raise RuntimeError("DATABASE_URL not configured")
    Base.metadata.create_all(bind=engine)
