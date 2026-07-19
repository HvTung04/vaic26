from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.models.class_group import ClassGroup
from app.models.user import UserRole
from app.repositories import class_repo
from app.schemas.classes import ClassDetail, ClassListResponse, ClassStudentItem, ClassStudentsResponse

router = APIRouter(prefix="/classes", tags=["classes"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


def _class_detail(c: ClassGroup, student_count: int) -> ClassDetail:
    return ClassDetail(
        id=str(c.id),
        name=c.name,
        subject=c.subject,
        grade=c.grade,
        teacher_id=str(c.teacher_id),
        student_count=student_count,
    )


@router.get("")
async def list_classes(
    current_user: CurrentUser,
    db: DbSession,
    page: int | None = Query(None, ge=1, description="Page number (omit for all)"),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, min_length=1, max_length=100),
    grade: int | None = Query(None, ge=6, le=12),
):
    """List classes for the current user.

    Without `page` param: returns a flat list (backward-compatible with sidebar picker).
    With `page` param: returns paginated response with search/filter support.
    """
    if page is not None:
        # Paginated mode
        classes, total = await class_repo.list_by_teacher_paginated(
            db,
            current_user.id,
            search=search,
            grade=grade,
            page=page,
            page_size=page_size,
        )
        items = [_class_detail(c, sc) for c, sc in classes]
        return ClassListResponse(items=items, total=total, page=page, page_size=page_size)

    # Legacy mode: return all classes (used by sidebar picker)
    if current_user.role == UserRole.TEACHER:
        classes = await class_repo.list_by_teacher(db, current_user.id)
    else:
        classes = await class_repo.list_by_student(db, current_user.id)

    return [
        _class_detail(c, await class_repo.student_count(db, c.id))
        for c in classes
    ]


@router.get("/{class_id}", response_model=ClassDetail)
async def get_class(class_id: str, current_user: CurrentUser, db: DbSession) -> ClassDetail:
    class_group = await class_repo.get_by_id(db, class_id)
    if class_group is None:
        raise api_error(404, "not_found", "Class not found")
    count = await class_repo.student_count(db, class_id)
    return ClassDetail(
        id=str(class_group.id),
        name=class_group.name,
        subject=class_group.subject,
        grade=class_group.grade,
        teacher_id=str(class_group.teacher_id),
        student_count=count,
    )


@router.get("/{class_id}/students", response_model=ClassStudentsResponse)
async def list_students(class_id: str, current_user: CurrentUser, db: DbSession) -> ClassStudentsResponse:
    students = await class_repo.list_students(db, class_id)
    items = [ClassStudentItem(id=str(s.id), full_name=s.full_name, username=s.username) for s in students]
    return ClassStudentsResponse(items=items, total=len(items))
