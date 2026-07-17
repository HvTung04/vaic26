from uuid import UUID

from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.knowledge_graph import KnowledgeEdgeRead, KnowledgeNodeRead, StudentMasteryRead
from app.services.graph.graph_service import GraphService

router = APIRouter()


@router.get("/nodes", response_model=list[KnowledgeNodeRead])
def list_nodes(db: DbSession) -> list:
    return GraphService(db).list_nodes()


@router.get("/edges", response_model=list[KnowledgeEdgeRead])
def list_edges(db: DbSession) -> list:
    return GraphService(db).list_edges()


@router.get("/students/{student_id}/mastery", response_model=list[StudentMasteryRead])
def get_student_mastery(student_id: UUID, db: DbSession) -> list:
    return GraphService(db).get_student_mastery(student_id)
