from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession
from app.schemas.diagnosis import DiagnosisRead

router = APIRouter()


@router.post("/root-cause/{answer_id}", response_model=DiagnosisRead)
def diagnose_root_cause(answer_id: UUID, db: DbSession) -> DiagnosisRead:
    """
    Root-cause diagnosis: node câu sai -> prerequisite -> mastery cha < ngưỡng -> nghi hổng node cha + confidence.
    BE/AI 2 — xem app/services/graph/root_cause.py và spec.md § Chẩn đoán lỗi theo root-cause.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 2")
