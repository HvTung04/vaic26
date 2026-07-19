from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class NodeState(BaseModel):
    node_id: str
    node_name: str
    mastery: float
    confidence: float
    attempts: int
    last_updated: datetime
    needs_review: bool


class GraphStateResponse(BaseModel):
    student_id: str
    nodes: list[NodeState]


class MasteryHistoryItem(BaseModel):
    mastery: float
    confidence: float
    reason: Literal["submission_scoring", "revision_result"]
    source_submission_id: str | None = None
    changed_at: datetime


class NodeHistoryResponse(BaseModel):
    node_id: str
    items: list[MasteryHistoryItem]


class FullNode(BaseModel):
    """Curriculum node + this student's mastery overlay, for graph visualization.
    `mastery`/`confidence`/`last_updated` are null when the student hasn't
    attempted anything on this node yet (distinct from a 0 score)."""

    node_id: str
    node_name: str
    grade: int
    mach: str
    topic_id: str
    description: str
    mastery: float | None = None
    confidence: float | None = None
    attempts: int = 0
    needs_review: bool = False
    last_updated: datetime | None = None


class GraphEdge(BaseModel):
    id: str
    from_node: str
    to_node: str
    kind: str
    cross_grade: bool


class GraphFullResponse(BaseModel):
    student_id: str
    nodes: list[FullNode]
    edges: list[GraphEdge]
