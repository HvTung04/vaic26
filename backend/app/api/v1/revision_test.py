from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession
from app.schemas.test import TestRead

router = APIRouter()


@router.post("/{student_id}/generate", response_model=TestRead)
def generate_revision_test(student_id: UUID, db: DbSession) -> TestRead:
    """
    Rule-based: chọn 2-3 node yếu nhất, thang dễ->khó.
    BE/AI 2 — xem app/services/graph/revision_selector.py và spec.md § Luồng 3.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 2")
