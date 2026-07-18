from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.repositories import ocr_repo, submission_repo
from app.schemas.ocr import (
    ScanConfirmRequest,
    ScanConfirmResponse,
    ScanCreateResponse,
    ScanResultResponse,
)
from app.services.grading_service import grade_submission

router = APIRouter(prefix="/ocr", tags=["ocr"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("/scan", response_model=ScanCreateResponse)
async def create_scan(
    current_user: CurrentUser,
    db: DbSession,
    image: Annotated[UploadFile, File()],
    test_id: Annotated[str, Form()],
    student_id: Annotated[str | None, Form()] = None,
) -> ScanCreateResponse:
    await image.read()  # bubble-sheet detection is not wired up yet (API_SPEC.md §F, cut-line)
    scan = await ocr_repo.create_scan(db, test_id=test_id, student_id=student_id)
    return ScanCreateResponse(scan_id=str(scan.id), status=scan.status, created_at=scan.created_at)


@router.get("/scan/{scan_id}", response_model=ScanResultResponse)
async def get_scan(scan_id: str, current_user: CurrentUser, db: DbSession) -> ScanResultResponse:
    scan = await ocr_repo.get_scan(db, scan_id)
    if scan is None:
        raise api_error(404, "not_found", "Scan not found")
    return ScanResultResponse(
        scan_id=str(scan.id),
        status=scan.status,
        test_id=str(scan.test_id),
        detected_student_id=str(scan.detected_student_id) if scan.detected_student_id else None,
        answers=scan.answers or [],
        low_confidence_flags=scan.low_confidence_flags or [],
    )


@router.post("/scan/{scan_id}/confirm", response_model=ScanConfirmResponse)
async def confirm_scan(
    scan_id: str,
    payload: ScanConfirmRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: DbSession,
) -> ScanConfirmResponse:
    scan = await ocr_repo.get_scan(db, scan_id)
    if scan is None:
        raise api_error(404, "not_found", "Scan not found")

    submission = await submission_repo.create_submission(
        db,
        test_id=scan.test_id,
        student_id=payload.student_id,
        answers=[
            {"question_id": a.question_id, "answer": a.final_answer, "time_spent_seconds": 0}
            for a in payload.answers
        ],
    )
    await ocr_repo.confirm_scan(db, scan, submission_id=submission.id)
    background_tasks.add_task(grade_submission, str(submission.id))

    return ScanConfirmResponse(scan_id=scan_id, submission_id=str(submission.id))
