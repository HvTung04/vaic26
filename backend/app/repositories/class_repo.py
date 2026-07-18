from __future__ import annotations

import uuid

from sqlalchemy import select
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


async def is_member(db: AsyncSession, class_id: str | uuid.UUID, student_id: str | uuid.UUID) -> bool:
    result = await db.execute(
        select(ClassStudent).where(ClassStudent.class_id == class_id, ClassStudent.student_id == student_id)
    )
    return result.scalar_one_or_none() is not None
