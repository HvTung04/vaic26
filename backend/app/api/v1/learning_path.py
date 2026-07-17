from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession
from app.schemas.learning_path import LearningPathRead

router = APIRouter()


@router.get("/{student_id}", response_model=LearningPathRead)
def get_learning_path(student_id: UUID, db: DbSession) -> LearningPathRead:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 2")


@router.post("/{student_id}/generate", response_model=LearningPathRead)
def generate_learning_path(student_id: UUID, db: DbSession) -> LearningPathRead:
    """
    Graph state hiện tại -> LangGraph flow -> LLM sinh lời giải thích + thứ tự ôn.
    BE/AI 2 — xem app/services/learning_path/generator.py và spec.md § Personalized practice path.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 2")
