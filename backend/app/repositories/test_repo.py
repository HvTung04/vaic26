from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
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
) -> Test:
    test = Test(title=title, class_id=class_id, type=type_, created_by=created_by)
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
    result = await db.execute(select(Test).where(Test.class_id == class_id).order_by(Test.created_at.desc()))
    return list(result.scalars().all())


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
