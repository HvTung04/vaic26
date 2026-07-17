from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession
from app.core.security import require_teacher

router = APIRouter(dependencies=[Depends(require_teacher)])


@router.get("/{teacher_id}/dashboard/priority-queue")
def get_priority_queue(teacher_id: UUID, db: DbSession) -> list:
    """Student Priority Queue — xem spec.md § Luồng 4."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 3")


@router.get("/{teacher_id}/dashboard/groups")
def get_need_based_groups(teacher_id: UUID, db: DbSession) -> list:
    """Need-based Groups — gom nhóm học sinh theo hổng kiến thức chung."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 3")


@router.get("/{teacher_id}/dashboard/gap-radar")
def get_class_gap_radar(teacher_id: UUID, db: DbSession) -> list:
    """Class Gap Radar — node kiến thức mà số đông đang yếu."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 3")
