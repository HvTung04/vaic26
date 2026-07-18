from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class UserProfile(BaseModel):
    id: str
    username: str
    full_name: str
    role: UserRole
    email: str | None = None
    created_at: datetime
