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


class ProgressPoint(BaseModel):
    period: str
    avg_mastery: float
    nodes_improved: int
    tests_taken: int


class StudentProgressResponse(BaseModel):
    student_id: str
    timeline: list[ProgressPoint]
