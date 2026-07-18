from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole


async def get_by_id(db: AsyncSession, user_id: str | uuid.UUID) -> User | None:
    return await db.get(User, user_id)


async def get_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    *,
    username: str,
    password_hash: str,
    full_name: str,
    role: UserRole,
    email: str | None = None,
) -> User:
    user = User(username=username, password_hash=password_hash, full_name=full_name, role=role, email=email)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
