from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser, ensure_self_or_teacher
from app.db.postgres import get_db
from app.repositories import learning_path_repo, submission_repo, test_repo
from app.schemas.agents import PathTier
from app.schemas.learning_path import (
    ProgressPoint,
    StudentLearningPathResponse,
    StudentProgressResponse,
    TestHistoryItem,
    TestHistoryResponse,
)

router = APIRouter(tags=["learning-path"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/students/{student_id}/learning-path", response_model=StudentLearningPathResponse)
async def get_learning_path(student_id: str, current_user: CurrentUser, db: DbSession) -> StudentLearningPathResponse:
    ensure_self_or_teacher(current_user, student_id)
    path = await learning_path_repo.get_active_for_student(db, student_id)
    if path is None:
        raise api_error(404, "not_found", "No learning path generated yet for this student")

    return StudentLearningPathResponse(
        path_id=str(path.id),
        generated_at=path.generated_at,
        tiers=[PathTier(**t) for t in path.tiers],
        status=path.status,
    )


@router.get("/students/{student_id}/progress", response_model=StudentProgressResponse)
async def get_progress(
    student_id: str,
    current_user: CurrentUser,
    db: DbSession,
    range: Annotated[str, Query()] = "weekly",  # noqa: A002 - matches API_SPEC.md query param name
) -> StudentProgressResponse:
    ensure_self_or_teacher(current_user, student_id)
    submissions = await submission_repo.list_submissions_for_student(db, student_id)

    buckets: dict[str, list] = {}
    for s in submissions:
        if s.status.value != "graded" or s.graded_at is None:
            continue
        period = s.graded_at.strftime("%Y-W%W") if range == "weekly" else s.graded_at.strftime("%Y-%m")
        buckets.setdefault(period, []).append(s)

    timeline = [
        ProgressPoint(
            period=period,
            avg_mastery=sum((s.score or 0) / (s.total or 1) for s in subs) / len(subs),
            nodes_improved=sum(len(s.graph_updates or []) for s in subs),
            tests_taken=len(subs),
        )
        for period, subs in sorted(buckets.items())
    ]
    return StudentProgressResponse(student_id=student_id, timeline=timeline)


@router.get("/students/{student_id}/test-history", response_model=TestHistoryResponse)
async def get_test_history(
    student_id: str,
    current_user: CurrentUser,
    db: DbSession,
    range: Annotated[str, Query()] = "all",  # noqa: A002 - matches API_SPEC.md query param name
) -> TestHistoryResponse:
    submissions = await submission_repo.list_submissions_for_student(db, student_id)
    graded = [s for s in submissions if s.status.value == "graded" and s.graded_at is not None]

    if range in ("weekly", "monthly"):
        cutoff_days = 7 if range == "weekly" else 30
        cutoff = datetime.now(timezone.utc) - timedelta(days=cutoff_days)
        graded = [s for s in graded if s.graded_at >= cutoff]

    items: list[TestHistoryItem] = []
    for s in graded:
        test = await test_repo.get_test(db, s.test_id)
        weak_nodes = [g["node_id"] for g in (s.graph_updates or []) if g["mastery_after"] < 0.5]
        items.append(
            TestHistoryItem(
                test_id=str(s.test_id),
                title=test.title if test else str(s.test_id),
                type=test.type.value if test else "unknown",
                score=s.score or 0,
                total=s.total or len(s.answers),
                submitted_at=s.submitted_at,
                weak_node_ids=weak_nodes,
            )
        )

    return TestHistoryResponse(student_id=student_id, items=items, total=len(items))
