from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, created_at_col, uuid_pk

if TYPE_CHECKING:
    from app.models.user import User


class ClassGroup(Base):
    __tablename__ = "classes"

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(64), nullable=False)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = created_at_col()

    teacher: Mapped["User"] = relationship(back_populates="taught_classes", foreign_keys=[teacher_id])
    memberships: Mapped[list["ClassStudent"]] = relationship(
        back_populates="class_group", cascade="all, delete-orphan"
    )


class ClassStudent(Base):
    """Seeded roster membership — no API to create/edit (per API_SPEC.md §B)."""

    __tablename__ = "class_students"

    class_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classes.id"), primary_key=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )

    class_group: Mapped[ClassGroup] = relationship(back_populates="memberships")
    student: Mapped["User"] = relationship()
