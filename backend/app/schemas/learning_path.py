from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.learning_path import PathStatus
from app.schemas.agents import PathTier


class StudentLearningPathResponse(BaseModel):
    path_id: str
    generated_at: datetime
    tiers: list[PathTier]
    status: PathStatus
    # node_id -> human name, so the UI can render tiers without a separate
    # node-catalog lookup (there is no standalone endpoint for that).
    node_names: dict[str, str] = {}


class ProgressPoint(BaseModel):
    period: str
    avg_mastery: float
    nodes_improved: int
    tests_taken: int


class StudentProgressResponse(BaseModel):
    student_id: str
    timeline: list[ProgressPoint]


class TestHistoryItem(BaseModel):
    test_id: str
    title: str
    type: str
    score: float
    total: int
    submitted_at: datetime
    weak_node_ids: list[str]


class TestHistoryResponse(BaseModel):
    student_id: str
    items: list[TestHistoryItem]
    total: int
