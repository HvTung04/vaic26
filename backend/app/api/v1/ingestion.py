from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.security import require_teacher
from app.schemas.question import IngestionUploadResponse

router = APIRouter()


@router.post("/upload", response_model=IngestionUploadResponse, dependencies=[Depends(require_teacher)])
async def upload_exam(file: UploadFile) -> IngestionUploadResponse:
    """
    Upload đề (PDF/ảnh) -> tách câu -> LLM label vùng kiến thức + độ khó -> question bank.
    BE/AI 1 — xem plan.md § 1 và app/services/ingestion/.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 1")


@router.get("/{job_id}/status", dependencies=[Depends(require_teacher)])
async def get_ingestion_status(job_id: UUID) -> IngestionUploadResponse:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 1")
