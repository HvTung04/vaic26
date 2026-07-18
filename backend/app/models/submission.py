from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, created_at_col, uuid_pk


class SubmissionStatus(str, enum.Enum):
    GRADING = "grading"
    GRADED = "graded"


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[uuid.UUID] = uuid_pk()
    test_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tests.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, native_enum=False, length=16),
        default=SubmissionStatus.GRADING,
        nullable=False,
    )
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # [{"node_id": str, "mastery_before": float, "mastery_after": float}], one per touched node
    graph_updates: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    submitted_at: Mapped[datetime] = created_at_col()
    graded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    answers: Mapped[list["SubmissionAnswer"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan"
    )


class SubmissionAnswer(Base):
    __tablename__ = "submission_answers"

    id: Mapped[uuid.UUID] = uuid_pk()
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submissions.id"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    root_cause_node_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    root_cause_chain: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    submission: Mapped[Submission] = relationship(back_populates="answers")
