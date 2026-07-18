from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser, ensure_self_or_teacher
from app.db.postgres import get_db
from app.repositories import learning_path_repo, submission_repo
from app.schemas.agents import PathTier
from app.schemas.learning_path import ProgressPoint, StudentLearningPathResponse, StudentProgressResponse

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
