import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class TestType(str, enum.Enum):
    WEEKLY = "weekly"
    REVISION = "revision"


class Test(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tests"

    type: Mapped[TestType] = mapped_column(Enum(TestType))
    title: Mapped[str] = mapped_column(String(255))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))


class TestQuestion(Base, UUIDMixin):
    __tablename__ = "test_questions"

    test_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tests.id"))
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id"))
    order: Mapped[int] = mapped_column(Integer, default=0)


class TestAttempt(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "test_attempts"

    test_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tests.id"))
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Answer(Base, UUIDMixin, TimestampMixin):
    """Metric theo từng câu trả lời — xem spec.md § Luồng 2 (đúng/sai, thời gian, kiểu lỗi)."""

    __tablename__ = "answers"

    attempt_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("test_attempts.id"))
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("questions.id"))
    student_answer: Mapped[str] = mapped_column(String(50))
    is_correct: Mapped[bool] = mapped_column(Boolean)
    time_taken_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
