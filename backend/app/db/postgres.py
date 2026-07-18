"""Async SQLAlchemy engine/session for the relational store (Postgres)."""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        yield session


async def init_models() -> None:
    """Create tables from ORM metadata. Skeleton-speed alternative to Alembic."""
    import app.models  # noqa: F401  (register model metadata)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
