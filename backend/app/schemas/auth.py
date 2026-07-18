from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole
    email: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    id: str
    username: str
    full_name: str
    role: UserRole
    created_at: datetime | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class MeResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: UserRole
    class_ids: list[str] = []
