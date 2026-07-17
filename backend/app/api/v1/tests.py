from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession
from app.core.security import require_student
from app.schemas.test import AttemptResult, AttemptSubmit

router = APIRouter()


@router.post("/attempts", response_model=AttemptResult, dependencies=[Depends(require_student)])
def submit_attempt(payload: AttemptSubmit, db: DbSession) -> AttemptResult:
    """
    Học sinh nộp bài Weekly/Revision Test -> chấm -> cập nhật graph mastery.
    BE/AI 3 — xem spec.md § Luồng 2.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 3")
