from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learning_path import LearningPath, PathStatus


async def get_by_id(db: AsyncSession, path_id: str | uuid.UUID) -> LearningPath | None:
    return await db.get(LearningPath, path_id)


async def get_active_for_student(db: AsyncSession, student_id: str | uuid.UUID) -> LearningPath | None:
    result = await db.execute(
        select(LearningPath)
        .where(LearningPath.student_id == student_id, LearningPath.status == PathStatus.ACTIVE)
        .order_by(LearningPath.generated_at.desc())
    )
    return result.scalars().first()


async def create(
    db: AsyncSession,
    *,
    student_id: str | uuid.UUID,
    tiers: list[dict],
    graph_snapshot_id: str,
    previous_path_id: str | uuid.UUID | None,
) -> LearningPath:
    if previous_path_id:
        previous = await get_by_id(db, previous_path_id)
        if previous and previous.status == PathStatus.ACTIVE:
            previous.status = PathStatus.SUPERSEDED

    current = await get_active_for_student(db, student_id)
    if current and str(current.id) != str(previous_path_id or ""):
        current.status = PathStatus.SUPERSEDED

    path = LearningPath(
        student_id=student_id,
        tiers=tiers,
        graph_snapshot_id=graph_snapshot_id,
        previous_path_id=previous_path_id,
        status=PathStatus.ACTIVE,
    )
    db.add(path)
    await db.commit()
    await db.refresh(path)
    return path
