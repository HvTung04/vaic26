from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.class_group import ClassGroup, ClassStudent
from app.models.user import User


async def get_by_id(db: AsyncSession, class_id: str | uuid.UUID) -> ClassGroup | None:
    return await db.get(ClassGroup, class_id)


async def student_count(db: AsyncSession, class_id: str | uuid.UUID) -> int:
    result = await db.execute(select(ClassStudent).where(ClassStudent.class_id == class_id))
    return len(result.scalars().all())


async def list_students(db: AsyncSession, class_id: str | uuid.UUID) -> list[User]:
    result = await db.execute(
        select(User).join(ClassStudent, ClassStudent.student_id == User.id).where(ClassStudent.class_id == class_id)
    )
    return list(result.scalars().all())


async def list_by_teacher(db: AsyncSession, teacher_id: str | uuid.UUID) -> list[ClassGroup]:
    result = await db.execute(
        select(ClassGroup).where(ClassGroup.teacher_id == teacher_id).order_by(ClassGroup.name)
    )
    return list(result.scalars().all())


async def list_by_student(db: AsyncSession, student_id: str | uuid.UUID) -> list[ClassGroup]:
    result = await db.execute(
        select(ClassGroup)
        .join(ClassStudent, ClassStudent.class_id == ClassGroup.id)
        .where(ClassStudent.student_id == student_id)
        .order_by(ClassGroup.name)
    )
    return list(result.scalars().all())


async def list_class_ids_for_student(db: AsyncSession, student_id: str | uuid.UUID) -> list[str]:
    result = await db.execute(select(ClassStudent.class_id).where(ClassStudent.student_id == student_id))
    return [str(cid) for cid in result.scalars().all()]


async def list_class_ids_for_teacher(db: AsyncSession, teacher_id: str | uuid.UUID) -> list[str]:
    result = await db.execute(select(ClassGroup.id).where(ClassGroup.teacher_id == teacher_id))
    return [str(cid) for cid in result.scalars().all()]


async def is_member(db: AsyncSession, class_id: str | uuid.UUID, student_id: str | uuid.UUID) -> bool:
    result = await db.execute(
        select(ClassStudent).where(ClassStudent.class_id == class_id, ClassStudent.student_id == student_id)
    )
    return result.scalar_one_or_none() is not None


async def list_by_teacher_paginated(
    db: AsyncSession,
    teacher_id: str | uuid.UUID,
    *,
    search: str | None = None,
    grade: int | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[ClassGroup], int]:
    """List classes for a teacher with search, grade filter, and pagination.

    Returns (classes, total_count).
    """
    # Subquery for student counts per class
    student_count_sq = (
        select(ClassStudent.class_id, func.count().label("cnt"))
        .group_by(ClassStudent.class_id)
        .subquery()
    )

    query = (
        select(ClassGroup, func.coalesce(student_count_sq.c.cnt, 0).label("student_count"))
        .outerjoin(student_count_sq, ClassGroup.id == student_count_sq.c.class_id)
        .where(ClassGroup.teacher_id == teacher_id)
    )

    if search:
        query = query.where(ClassGroup.name.ilike(f"%{search}%"))
    if grade is not None:
        query = query.where(ClassGroup.grade == grade)

    # Count total (before pagination)
    count_query = select(func.count()).select_from(
        select(ClassGroup).where(ClassGroup.teacher_id == teacher_id).subquery()
    )
    if search:
        count_query = count_query.where(ClassGroup.name.ilike(f"%{search}%"))
    if grade is not None:
        count_query = count_query.where(ClassGroup.grade == grade)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination
    query = query.order_by(ClassGroup.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    rows = result.all()

    return list(rows), total


async def student_counts_by_classes(
    db: AsyncSession, class_ids: list[str | uuid.UUID]
) -> dict[str, int]:
    """Batch student count for multiple classes."""
    if not class_ids:
        return {}
    result = await db.execute(
        select(ClassStudent.class_id, func.count().label("cnt"))
        .where(ClassStudent.class_id.in_(class_ids))
        .group_by(ClassStudent.class_id)
    )
    return {str(cid): cnt for cid, cnt in result.all()}
