from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, created_at_col, uuid_pk


class TestType(str, enum.Enum):
    WEEKLY = "weekly"
    REVISION = "revision"
    PRACTICE = "practice"


class AssignmentStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"


class Test(Base):
    __tablename__ = "tests"

    id: Mapped[uuid.UUID] = uuid_pk()
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    class_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    type: Mapped[TestType] = mapped_column(Enum(TestType, native_enum=False, length=16), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = created_at_col()

    questions: Mapped[list["TestQuestion"]] = relationship(
        back_populates="test", cascade="all, delete-orphan", order_by="TestQuestion.order"
    )
    assignments: Mapped[list["TestAssignment"]] = relationship(
        back_populates="test", cascade="all, delete-orphan"
    )


class TestQuestion(Base):
    __tablename__ = "test_questions"

    test_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tests.id"), primary_key=True)
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id"), primary_key=True
    )
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    test: Mapped[Test] = relationship(back_populates="questions")


class TestAssignment(Base):
    __tablename__ = "test_assignments"

    id: Mapped[uuid.UUID] = uuid_pk()
    test_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tests.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[AssignmentStatus] = mapped_column(
        Enum(AssignmentStatus, native_enum=False, length=16),
        default=AssignmentStatus.PENDING,
        nullable=False,
    )
    assigned_at: Mapped[datetime] = created_at_col()

    test: Mapped[Test] = relationship(back_populates="assignments")
