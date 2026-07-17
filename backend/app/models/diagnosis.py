import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Diagnosis(Base, UUIDMixin, TimestampMixin):
    """Kết quả root-cause diagnosis cho 1 câu trả lời sai — xem spec.md § Chẩn đoán lỗi theo root-cause."""

    __tablename__ = "diagnoses"

    answer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("answers.id"))
    suspected_node_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id"))
    confidence: Mapped[float] = mapped_column(Float)
    reasoning: Mapped[str | None] = mapped_column(String(500), nullable=True)
