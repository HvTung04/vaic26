from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.test import AssignmentStatus, Test, TestAssignment, TestQuestion, TestType


async def create_test(
    db: AsyncSession,
    *,
    title: str,
    class_id: str | uuid.UUID,
    type_: TestType,
    created_by: str | uuid.UUID,
    question_ids: list[str | uuid.UUID],
    scheduled_at: datetime | None = None,
) -> Test:
    test = Test(title=title, class_id=class_id, type=type_, created_by=created_by, scheduled_at=scheduled_at)
    db.add(test)
    await db.flush()
    for order, qid in enumerate(question_ids):
        db.add(TestQuestion(test_id=test.id, question_id=qid, order=order))
    await db.commit()
    return await get_test(db, test.id)


async def get_test(db: AsyncSession, test_id: str | uuid.UUID) -> Test | None:
    result = await db.execute(
        select(Test)
        .where(Test.id == test_id)
        .options(selectinload(Test.questions), selectinload(Test.assignments))
    )
    return result.scalar_one_or_none()


async def list_tests_by_class(db: AsyncSession, class_id: str | uuid.UUID) -> list[Test]:
    result = await db.execute(
        select(Test)
        .where(Test.class_id == class_id)
        .options(selectinload(Test.assignments))
        .order_by(Test.created_at.desc())
    )
    return list(result.scalars().all())


async def list_tests_by_class_paginated(
    db: AsyncSession,
    class_id: str | uuid.UUID,
    *,
    search: str | None = None,
    type_: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Test], int]:
    """List tests for a class with search, type filter, and pagination.

    Returns (tests, total_count).
    """
    base = select(Test).where(Test.class_id == class_id)

    if search:
        base = base.where(Test.title.ilike(f"%{search}%"))
    if type_:
        base = base.where(Test.type == type_)

    # Count total
    count_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Fetch page with assignments eager-loaded
    query = (
        base.options(selectinload(Test.assignments))
        .order_by(Test.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.execute(query)
    return list(result.scalars().all()), total


async def create_assignments(
    db: AsyncSession,
    *,
    test_id: str | uuid.UUID,
    student_ids: list[str | uuid.UUID],
    due_at: datetime | None,
) -> list[TestAssignment]:
    rows = [
        TestAssignment(test_id=test_id, student_id=sid, due_at=due_at, status=AssignmentStatus.PENDING)
        for sid in student_ids
    ]
    db.add_all(rows)
    await db.commit()
    return rows


async def list_assignments_for_student(
    db: AsyncSession, student_id: str | uuid.UUID, status: str | None = None
) -> list[TestAssignment]:
    query = (
        select(TestAssignment)
        .where(TestAssignment.student_id == student_id)
        .options(selectinload(TestAssignment.test))
    )
    if status:
        query = query.where(TestAssignment.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_assignment(
    db: AsyncSession, test_id: str | uuid.UUID, student_id: str | uuid.UUID
) -> TestAssignment | None:
    result = await db.execute(
        select(TestAssignment).where(
            TestAssignment.test_id == test_id, TestAssignment.student_id == student_id
        )
    )
    return result.scalar_one_or_none()


async def set_assignment_status(db: AsyncSession, assignment: TestAssignment, status: AssignmentStatus) -> None:
    assignment.status = status
    await db.commit()
