"""Database engine, session factory, and the FastAPI dependency `get_db`."""

from datetime import UTC, datetime

from sqlalchemy import create_engine, make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL

# SQLite needs this because FastAPI runs normal `def` routes in a thread pool.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def describe_database(url: str) -> str:
    """A safe one-line description of the database: never the user or password."""
    parsed = make_url(url)
    if parsed.get_backend_name() == "sqlite":
        return f"SQLite file {parsed.database} (local runs only)"
    return f"{parsed.get_backend_name()} database '{parsed.database}' on {parsed.host}:{parsed.port}"


def utc_now() -> datetime:
    """Now in UTC, without tzinfo.

    All times are saved as naive UTC so SQLite and PostgreSQL behave the same.
    """
    return datetime.now(UTC).replace(tzinfo=None)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
