import uuid

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class LearningPath(Base, UUIDMixin, TimestampMixin):
    """Snapshot lộ trình học sinh tại 1 thời điểm — xem spec.md § Personalized practice path.

    path: [{"node_id": ..., "tier": "foundation|bridge|application", "explanation": "..."}]
    """

    __tablename__ = "learning_paths"

    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    path: Mapped[list] = mapped_column(JSONB)
