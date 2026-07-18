from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.models.user import UserRole
from app.repositories import class_repo
from app.schemas.classes import ClassDetail, ClassStudentItem, ClassStudentsResponse

router = APIRouter(prefix="/classes", tags=["classes"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=list[ClassDetail])
async def list_classes(current_user: CurrentUser, db: DbSession) -> list[ClassDetail]:
    if current_user.role == UserRole.TEACHER:
        classes = await class_repo.list_by_teacher(db, current_user.id)
    else:
        classes = await class_repo.list_by_student(db, current_user.id)

    return [
        ClassDetail(
            id=str(c.id),
            name=c.name,
            subject=c.subject,
            grade=c.grade,
            teacher_id=str(c.teacher_id),
            student_count=await class_repo.student_count(db, c.id),
        )
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
