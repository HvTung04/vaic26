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
