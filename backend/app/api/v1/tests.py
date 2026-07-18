from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.models.user import UserRole
from app.repositories import class_repo, question_repo, submission_repo, test_repo
from app.schemas.tests import (
    TestAssignRequest,
    TestAssignResponse,
    TestCompletionStatus,
    TestCreateRequest,
    TestCreateResponse,
    TestDetailResponse,
    TestListItem,
    TestQuestionTeacherView,
)

router = APIRouter(prefix="/tests", tags=["tests"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("", response_model=TestCreateResponse)
async def create_test(payload: TestCreateRequest, current_user: CurrentUser, db: DbSession) -> TestCreateResponse:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can create tests")

    mix = payload.auto_compose.difficulty_mix.model_dump() if payload.auto_compose.difficulty_mix else None
    questions = await question_repo.find_for_auto_compose(
        db, node_ids=payload.auto_compose.node_ids, count=payload.auto_compose.count, difficulty_mix=mix
    )
    if not questions:
        raise api_error(422, "no_questions", "No approved questions match the requested nodes/difficulty")

    test = await test_repo.create_test(
        db,
        title=payload.title,
        class_id=payload.class_id,
        type_=payload.type,
        created_by=current_user.id,
        question_ids=[q.id for q in questions],
    )
    return TestCreateResponse(
        id=str(test.id),
        title=test.title,
        type=test.type,
        class_id=str(test.class_id),
        question_ids=[str(tq.question_id) for tq in test.questions],
        created_at=test.created_at,
    )


@router.get("/{test_id}", response_model=TestDetailResponse)
async def get_test(test_id: str, current_user: CurrentUser, db: DbSession) -> TestDetailResponse:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can view answer keys")

    test = await test_repo.get_test(db, test_id)
    if test is None:
        raise api_error(404, "not_found", "Test not found")

    questions = await question_repo.get_questions(db, [tq.question_id for tq in test.questions])
    by_id = {str(q.id): q for q in questions}
    ordered = [by_id[str(tq.question_id)] for tq in test.questions if str(tq.question_id) in by_id]

    return TestDetailResponse(
        id=str(test.id),
        title=test.title,
        type=test.type,
        class_id=str(test.class_id),
        questions=[
            TestQuestionTeacherView(
                id=str(q.id), text=q.text, difficulty=q.difficulty.value, node_id=q.node_id, answer=q.answer
            )
            for q in ordered
        ],
        assigned_student_ids=[str(a.student_id) for a in test.assignments],
    )


def _completion_status(assigned_count: int, submitted_count: int) -> TestCompletionStatus:
    if submitted_count == 0:
        return "not_started"
    if assigned_count and submitted_count >= assigned_count:
        return "completed"
    return "in_progress"


@router.get("", response_model=list[TestListItem])
async def list_tests(class_id: Annotated[str, Query()], current_user: CurrentUser, db: DbSession) -> list[TestListItem]:
    tests = await test_repo.list_tests_by_class(db, class_id)
    submitted_counts = await submission_repo.count_submitted_students_by_test(db, [t.id for t in tests])
    items = []
    for t in tests:
        assigned_count = len(t.assignments)
        submitted_count = submitted_counts.get(str(t.id), 0)
        items.append(
            TestListItem(
                id=str(t.id),
                title=t.title,
                type=t.type,
                class_id=str(t.class_id),
                created_at=t.created_at,
                status=_completion_status(assigned_count, submitted_count),
                assigned_count=assigned_count,
                submitted_count=submitted_count,
            )
        )
    return items


@router.post("/{test_id}/assign", response_model=TestAssignResponse)
async def assign_test(
    test_id: str, payload: TestAssignRequest, current_user: CurrentUser, db: DbSession
) -> TestAssignResponse:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can assign tests")

    student_ids = list(payload.student_ids or [])
    if payload.class_id:
        roster = await class_repo.list_students(db, payload.class_id)
        student_ids.extend(str(s.id) for s in roster if str(s.id) not in student_ids)

    if not student_ids:
        raise api_error(422, "no_recipients", "Provide class_id and/or student_ids")

    await test_repo.create_assignments(db, test_id=test_id, student_ids=student_ids, due_at=payload.due_at)
    return TestAssignResponse(test_id=test_id, assigned_student_ids=student_ids, due_at=payload.due_at)
