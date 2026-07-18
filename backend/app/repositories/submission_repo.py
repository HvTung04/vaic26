from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.submission import Submission, SubmissionAnswer, SubmissionStatus


async def create_submission(
    db: AsyncSession,
    *,
    test_id: str | uuid.UUID,
    student_id: str | uuid.UUID,
    answers: list[dict],
) -> Submission:
    submission = Submission(test_id=test_id, student_id=student_id, status=SubmissionStatus.GRADING)
    db.add(submission)
    await db.flush()
    for a in answers:
        db.add(
            SubmissionAnswer(
                submission_id=submission.id,
                question_id=a["question_id"],
                answer=a["answer"],
                time_spent_seconds=a.get("time_spent_seconds", 0),
            )
        )
    await db.commit()
    return await get_submission(db, submission.id)


async def get_submission(db: AsyncSession, submission_id: str | uuid.UUID) -> Submission | None:
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id).options(selectinload(Submission.answers))
    )
    return result.scalar_one_or_none()


async def list_submissions_for_test(db: AsyncSession, test_id: str | uuid.UUID) -> list[Submission]:
    result = await db.execute(
        select(Submission).where(Submission.test_id == test_id).options(selectinload(Submission.answers))
    )
    return list(result.scalars().all())


async def list_submissions_for_student(db: AsyncSession, student_id: str | uuid.UUID) -> list[Submission]:
    result = await db.execute(
        select(Submission)
        .where(Submission.student_id == student_id)
        .options(selectinload(Submission.answers))
        .order_by(Submission.submitted_at.desc())
    )
    return list(result.scalars().all())


async def mark_graded(
    db: AsyncSession,
    submission: Submission,
    *,
    score: float,
    total: int,
    graded_answers: list[dict],
    graph_updates: list[dict] | None = None,
) -> Submission:
    by_question = {a["question_id"]: a for a in graded_answers}
    for row in submission.answers:
        graded = by_question.get(str(row.question_id))
        if not graded:
            continue
        row.is_correct = graded["is_correct"]
        row.root_cause_node_id = graded.get("root_cause_node_id")
        row.root_cause_chain = graded.get("root_cause_chain") or []
        row.confidence = graded.get("confidence")

    submission.status = SubmissionStatus.GRADED
    submission.score = score
    submission.total = total
    submission.graph_updates = graph_updates or []
    submission.graded_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(submission)
    return submission
