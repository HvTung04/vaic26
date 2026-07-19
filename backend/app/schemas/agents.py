from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class LearningPathRequest(BaseModel):
    student_id: str
    previous_path_id: str | None = None


class GroundedOn(BaseModel):
    graph_snapshot_id: str


class PathTier(BaseModel):
    tier: Literal["foundation", "bridge", "application"]
    node_ids: list[str]
    recommended_question_ids: list[str]
    rationale: str


class LearningPathResponse(BaseModel):
    path_id: str
    student_id: str
    tiers: list[PathTier]
    generated_at: datetime
    grounded_on: GroundedOn


class RevisionTestRequest(BaseModel):
    student_id: str
    learning_path_id: str
    teacher_note: str | None = None
    question_count: int | None = None
    # When set, practice is scoped to this single node (e.g. a topic picked
    # from the learning-path UI) instead of the auto-selected weakest nodes.
    node_id: str | None = None


class DifficultyMixOut(BaseModel):
    easy: int = 0
    medium: int = 0
    hard: int = 0


class RevisionTestResponse(BaseModel):
    test_id: str
    student_id: str
    question_ids: list[str]
    difficulty_mix: DifficultyMixOut
    target_node_ids: list[str]


class PriorityStudent(BaseModel):
    student_id: str
    urgency: float
    reason: str


class StudentGroup(BaseModel):
    group_id: str
    node_ids: list[str]
    student_ids: list[str]


class ClassGapNode(BaseModel):
    node_id: str
    weak_ratio: float


class InterventionSuggestion(BaseModel):
    id: str
    type: Literal["re_teach", "mini_group", "peer_support", "extra_practice"]
    node_id: str
    target_student_ids: list[str]
    rationale: str


class DashboardInsightResponse(BaseModel):
    class_id: str
    priority_students: list[PriorityStudent]
    groups: list[StudentGroup]
    class_gap_nodes: list[ClassGapNode]
    interventions: list[InterventionSuggestion]
    generated_at: datetime


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    class_id: str
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
