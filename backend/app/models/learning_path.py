from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, created_at_col, uuid_pk


class PathStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    SUPERSEDED = "superseded"
    VERIFIED = "verified"


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[uuid.UUID] = uuid_pk()
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[PathStatus] = mapped_column(
        Enum(PathStatus, native_enum=False, length=16), default=PathStatus.ACTIVE, nullable=False
    )
    # [{"tier": str, "node_ids": [str], "recommended_question_ids": [str], "rationale": str}]
    tiers: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    graph_snapshot_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    previous_path_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("learning_paths.id"), nullable=True
    )
    generated_at: Mapped[datetime] = created_at_col()
