from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser, create_access_token, hash_password, verify_password
from app.db.postgres import get_db
from app.repositories import class_repo, user_repo
from app.schemas.auth import LoginRequest, MeResponse, RegisterRequest, TokenResponse, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: DbSession) -> TokenResponse:
    existing = await user_repo.get_by_username(db, payload.username)
    if existing is not None:
        raise api_error(409, "username_taken", "Username already exists")

    user = await user_repo.create_user(
        db,
        username=payload.username,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        email=payload.email,
    )
    token, expires_in = create_access_token(str(user.id))
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=UserPublic(
            id=str(user.id),
            username=user.username,
            full_name=user.full_name,
            role=user.role,
            created_at=user.created_at,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    user = await user_repo.get_by_username(db, payload.username)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise api_error(401, "invalid_credentials", "Invalid username or password")

    token, expires_in = create_access_token(str(user.id))
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=UserPublic(id=str(user.id), username=user.username, full_name=user.full_name, role=user.role),
    )


@router.get("/me", response_model=MeResponse)
async def me(current_user: CurrentUser, db: DbSession) -> MeResponse:
    class_ids = await class_repo.list_class_ids_for_student(db, current_user.id)
    return MeResponse(
        id=str(current_user.id),
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        class_ids=class_ids,
    )
