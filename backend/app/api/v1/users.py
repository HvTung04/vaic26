from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.repositories import user_repo
from app.schemas.users import UserProfile

router = APIRouter(prefix="/users", tags=["users"])


DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/{user_id}", response_model=UserProfile)
async def get_user(user_id: str, current_user: CurrentUser, db: DbSession) -> UserProfile:
    user = await user_repo.get_by_id(db, user_id)
    if user is None:
        raise api_error(404, "not_found", "User not found")
    return UserProfile(
        id=str(user.id),
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        email=user.email,
        created_at=user.created_at,
    )
