from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Float, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, created_at_col, uuid_pk

if TYPE_CHECKING:
    from app.models.user import User


class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    SHORT_ANSWER = "short_answer"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class UploadStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class Upload(Base):
    __tablename__ = "uploads"

    id: Mapped[uuid.UUID] = uuid_pk()
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    class_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=True)
    subject: Mapped[str] = mapped_column(String(64), nullable=False)
    grade: Mapped[int] = mapped_column(nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[UploadStatus] = mapped_column(
        Enum(UploadStatus, native_enum=False, length=16), default=UploadStatus.QUEUED, nullable=False
    )
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = created_at_col()

    drafts: Mapped[list["QuestionDraft"]] = relationship(
        back_populates="upload", cascade="all, delete-orphan"
    )


class QuestionDraft(Base):
    """OCR/upload-parsed candidate question, pending teacher approval."""

    __tablename__ = "question_drafts"

    id: Mapped[uuid.UUID] = uuid_pk()
    upload_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("uploads.id"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, native_enum=False, length=16), default=QuestionType.MCQ, nullable=False
    )
    options: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_node_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    suggested_difficulty: Mapped[Difficulty | None] = mapped_column(
        Enum(Difficulty, native_enum=False, length=16), nullable=True
    )
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    approved_question_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id"), nullable=True
    )
    created_at: Mapped[datetime] = created_at_col()

    upload: Mapped[Upload] = relationship(back_populates="drafts")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = uuid_pk()
    text: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, native_enum=False, length=16), default=QuestionType.MCQ, nullable=False
    )
    options: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[Difficulty] = mapped_column(
        Enum(Difficulty, native_enum=False, length=16), nullable=False
    )
    node_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    source_upload_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("uploads.id"), nullable=True
    )
    created_at: Mapped[datetime] = created_at_col()
