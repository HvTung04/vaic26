import enum
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings


class Role(str, enum.Enum):
    TEACHER = "teacher"
    STUDENT = "student"


class CurrentUser(BaseModel):
    role: Role
    user_id: str


def get_current_user(authorization: str = Header(default="")) -> CurrentUser:
    """
    Auth giả cho hackathon: 1 token cố định / role, không JWT không session.
    Header: Authorization: Bearer <token> — xem plan.md § 1 (BE/AI 3).
    """
    token = authorization.removeprefix("Bearer ").strip()

    if token == settings.FAKE_TEACHER_TOKEN:
        return CurrentUser(role=Role.TEACHER, user_id="demo-teacher-1")
    if token == settings.FAKE_STUDENT_TOKEN:
        return CurrentUser(role=Role.STUDENT, user_id="demo-student-1")

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]


def require_teacher(user: CurrentUserDep) -> CurrentUser:
    if user.role != Role.TEACHER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher role required")
    return user


def require_student(user: CurrentUserDep) -> CurrentUser:
    if user.role != Role.STUDENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student role required")
    return user
