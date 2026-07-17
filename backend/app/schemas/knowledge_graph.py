import uuid

from pydantic import BaseModel, ConfigDict

from app.models.knowledge_graph import EdgeRelation


class KnowledgeNodeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    grade: int
    subject: str
    topic: str
    description: str | None = None


class KnowledgeNodeCreate(BaseModel):
    name: str
    grade: int
    subject: str = "math"
    topic: str
    description: str | None = None


class KnowledgeEdgeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    from_node_id: uuid.UUID
    to_node_id: uuid.UUID
    relation: EdgeRelation


class StudentMasteryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    node_id: uuid.UUID
    mastery_score: float
    confidence: float
