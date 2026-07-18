from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, created_at_col, uuid_pk


class InterventionType(str, enum.Enum):
    RE_TEACH = "re_teach"
    MINI_GROUP = "mini_group"
    PEER_SUPPORT = "peer_support"
    EXTRA_PRACTICE = "extra_practice"


class InterventionStatus(str, enum.Enum):
    SUGGESTED = "suggested"
    APPLIED = "applied"
    DISMISSED = "dismissed"


class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[uuid.UUID] = uuid_pk()
    class_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    type: Mapped[InterventionType] = mapped_column(
        Enum(InterventionType, native_enum=False, length=32), nullable=False
    )
    node_id: Mapped[str] = mapped_column(String(64), nullable=False)
    target_student_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[InterventionStatus] = mapped_column(
        Enum(InterventionStatus, native_enum=False, length=16),
        default=InterventionStatus.SUGGESTED,
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = created_at_col()
