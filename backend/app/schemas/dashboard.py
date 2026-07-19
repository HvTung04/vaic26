from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.models.intervention import InterventionStatus, InterventionType


class PriorityQueueItem(BaseModel):
    student_id: str
    full_name: str
    urgency: float
    reason: str
    weak_node_ids: list[str]


class PriorityQueueResponse(BaseModel):
    items: list[PriorityQueueItem]


class GroupItem(BaseModel):
    group_id: str
    node_ids: list[str]
    node_names: list[str]
    student_ids: list[str]


class GroupsResponse(BaseModel):
    items: list[GroupItem]


class GapRadarItem(BaseModel):
    node_id: str
    node_name: str
    weak_ratio: float
    avg_mastery: float


class GapRadarResponse(BaseModel):
    items: list[GapRadarItem]


class InterventionItem(BaseModel):
    id: str
    type: InterventionType
    node_id: str
    target_student_ids: list[str]
    rationale: str
    status: InterventionStatus


class InterventionsResponse(BaseModel):
    items: list[InterventionItem]


class ApplyInterventionRequest(BaseModel):
    note: str | None = None


class ApplyInterventionResponse(BaseModel):
    id: str
    status: Literal["applied"] = "applied"
    applied_at: datetime


class ScoreDistributionBucket(BaseModel):
    score_range: str
    count: int


class NodeAccuracy(BaseModel):
    node_id: str
    accuracy: float


class StudentResultRow(BaseModel):
    student_id: str
    full_name: str
    score: float | None = None
    status: Literal["submitted", "pending"]
    submission_id: str | None = None


class ClassResultsResponse(BaseModel):
    test_id: str
    test_title: str
    class_avg_score: float
    distribution: list[ScoreDistributionBucket]
    per_node_accuracy: list[NodeAccuracy]
    students: list[StudentResultRow]


class StudentTestResult(BaseModel):
    submission_id: str
    test_id: str
    title: str
    score: float
    submitted_at: datetime
    weak_node_ids: list[str]


class StudentResultsResponse(BaseModel):
    student_id: str
    tests: list[StudentTestResult]


class ClassProgressPoint(BaseModel):
    period: str
    avg_mastery: float
    tests_completed: int
    students_improved: int


class ClassProgressTimelineResponse(BaseModel):
    class_id: str
    timeline: list[ClassProgressPoint]


class HeatmapCell(BaseModel):
    node_id: str
    mastery: float | None = None  # null = untested


class HeatmapTopicBE(BaseModel):
    key: str       # node_id
    label: str     # topic_name from graph
    grade: int     # grade from graph


class HeatmapStudentRowBE(BaseModel):
    student_id: str
    full_name: str
    avg_mastery: float
    foundation_gap: bool  # any grade<8 node with mastery < 0.4
    cells: list[HeatmapCell]


class HeatmapResponse(BaseModel):
    topics: list[HeatmapTopicBE]
    students: list[HeatmapStudentRowBE]
