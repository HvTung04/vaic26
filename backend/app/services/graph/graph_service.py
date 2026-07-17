import uuid

from sqlalchemy.orm import Session

from app.models.knowledge_graph import KnowledgeEdge, KnowledgeNode
from app.models.mastery import StudentMastery


class GraphService:
    """CRUD + truy vết prerequisite trên Knowledge Graph — xem spec.md § Mô hình kiến thức dạng Graph."""

    def __init__(self, db: Session):
        self.db = db

    def list_nodes(self) -> list[KnowledgeNode]:
        return self.db.query(KnowledgeNode).all()

    def list_edges(self) -> list[KnowledgeEdge]:
        return self.db.query(KnowledgeEdge).all()

    def get_student_mastery(self, student_id: uuid.UUID) -> list[StudentMastery]:
        return self.db.query(StudentMastery).filter(StudentMastery.student_id == student_id).all()

    def get_prerequisites(self, node_id: uuid.UUID) -> list[KnowledgeNode]:
        """Trả về các node tiên quyết trực tiếp của node_id. TODO: BE/AI 2."""
        raise NotImplementedError
