from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser, ensure_self_or_teacher
from app.db.postgres import get_db
from app.models.test import AssignmentStatus
from app.repositories import question_repo, submission_repo, test_repo
from app.schemas.dashboard import StudentResultsResponse
from app.schemas.test_taking import (
    AttemptQuestion,
    AttemptResponse,
    GraphUpdate,
    QuestionResult,
    StudentTestListItem,
    SubmissionResultResponse,
    SubmitRequest,
    SubmitResponse,
)
from app.services import results_service
from app.services.grading_service import grade_submission

router = APIRouter(tags=["test-taking"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/students/{student_id}/tests", response_model=list[StudentTestListItem])
async def list_student_tests(
    student_id: str,
    current_user: CurrentUser,
    db: DbSession,
    status: Annotated[str | None, Query()] = None,
) -> list[StudentTestListItem]:
    ensure_self_or_teacher(current_user, student_id)
    assignments = await test_repo.list_assignments_for_student(db, student_id, status)
    return [
        StudentTestListItem(
            test_id=str(a.test_id),
            title=a.test.title,
            type=a.test.type,
            due_at=a.due_at,
            status=a.status.value,
        )
        for a in assignments
    ]


@router.get("/students/{student_id}/results", response_model=StudentResultsResponse)
async def list_student_results(student_id: str, current_user: CurrentUser, db: DbSession) -> StudentResultsResponse:
    ensure_self_or_teacher(current_user, student_id)
    return await results_service.get_student_results(db, student_id)


@router.get("/tests/{test_id}/attempt", response_model=AttemptResponse)
async def get_attempt(test_id: str, current_user: CurrentUser, db: DbSession) -> AttemptResponse:
    test = await test_repo.get_test(db, test_id)
    if test is None:
        raise api_error(404, "not_found", "Test not found")

    questions = await question_repo.get_questions(db, [tq.question_id for tq in test.questions])
    by_id = {str(q.id): q for q in questions}
    ordered = [by_id[str(tq.question_id)] for tq in test.questions if str(tq.question_id) in by_id]

    return AttemptResponse(
        test_id=str(test.id),
        title=test.title,
        questions=[
            AttemptQuestion(
                id=str(q.id),
                text=q.text,
                type=q.type.value,
                options=[o["text"] for o in q.options] if q.options else None,
            )
            for q in ordered
        ],
    )


@router.post("/tests/{test_id}/submissions", response_model=SubmitResponse)
async def submit_test(
    test_id: str,
    payload: SubmitRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: DbSession,
) -> SubmitResponse:
    assignment = await test_repo.get_assignment(db, test_id, payload.student_id)
    if assignment is not None:
        await test_repo.set_assignment_status(db, assignment, AssignmentStatus.IN_PROGRESS)

    submission = await submission_repo.create_submission(
        db,
        test_id=test_id,
        student_id=payload.student_id,
        answers=[a.model_dump() for a in payload.answers],
    )
    background_tasks.add_task(grade_submission, str(submission.id))

    return SubmitResponse(
        submission_id=str(submission.id),
        test_id=test_id,
        student_id=payload.student_id,
        status=submission.status,
        submitted_at=submission.submitted_at,
    )


@router.get("/submissions/{submission_id}", response_model=SubmissionResultResponse)
async def get_submission_result(
    submission_id: str, current_user: CurrentUser, db: DbSession
) -> SubmissionResultResponse:
    submission = await submission_repo.get_submission(db, submission_id)
    if submission is None:
        raise api_error(404, "not_found", "Submission not found")

    results: list[QuestionResult] = []
    if submission.status.value == "graded":
        questions = await question_repo.get_questions(db, [a.question_id for a in submission.answers])
        by_id = {str(q.id): q for q in questions}
        results = [
            QuestionResult(
                question_id=str(a.question_id),
                is_correct=bool(a.is_correct),
                correct_answer=by_id[str(a.question_id)].answer if str(a.question_id) in by_id else "",
                explanation=by_id[str(a.question_id)].explanation if str(a.question_id) in by_id else None,
                root_cause_node_id=a.root_cause_node_id,
                root_cause_chain=a.root_cause_chain or [],
                confidence=a.confidence,
            )
            for a in submission.answers
        ]

    return SubmissionResultResponse(
        submission_id=str(submission.id),
        status=submission.status,
        score=submission.score or 0,
        total=submission.total or len(submission.answers),
        results=results,
        graph_updates=[GraphUpdate(**g) for g in (submission.graph_updates or [])],
    )
