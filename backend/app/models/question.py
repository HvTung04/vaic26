import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Question(Base, UUIDMixin, TimestampMixin):
    """Câu hỏi đã chuẩn hóa vào ngân hàng — xem spec.md § Content Bank."""

    __tablename__ = "questions"

    content: Mapped[str] = mapped_column(Text)
    options: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {"A": "...", "B": "..."} nếu trắc nghiệm
    correct_answer: Mapped[str] = mapped_column(String(50))
    node_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id"))
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty))
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)  # đề gốc / người soạn
