from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession
from app.core.security import require_teacher
from app.schemas.user import UserRead

router = APIRouter()


@router.get("/{student_id}", response_model=UserRead, dependencies=[Depends(require_teacher)])
def get_student(student_id: UUID, db: DbSession) -> UserRead:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 3")
