import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class EdgeRelation(str, enum.Enum):
    PREREQUISITE = "prerequisite"
    RELATED_ERROR = "related_error"
    SIMILAR = "similar"


class KnowledgeNode(Base, UUIDMixin, TimestampMixin):
    """1 node = 1 vùng kiến thức/kỹ năng con, bám chương trình 2018 — xem spec.md § Mô hình kiến thức dạng Graph."""

    __tablename__ = "knowledge_nodes"

    name: Mapped[str] = mapped_column(String(200))
    grade: Mapped[int] = mapped_column(Integer)
    subject: Mapped[str] = mapped_column(String(50), default="math")
    topic: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class KnowledgeEdge(Base, UUIDMixin, TimestampMixin):
    """Cạnh mô tả quan hệ tiên quyết / phụ thuộc / tương đồng sai lầm giữa 2 node."""

    __tablename__ = "knowledge_edges"

    from_node_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id"))
    to_node_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_nodes.id"))
    relation: Mapped[EdgeRelation] = mapped_column(Enum(EdgeRelation))
