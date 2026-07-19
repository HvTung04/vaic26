from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.models.test import TestType

TestCompletionStatus = Literal["not_started", "in_progress", "completed"]


class DifficultyMix(BaseModel):
    easy: int = 0
    medium: int = 0
    hard: int = 0


class AutoCompose(BaseModel):
    node_ids: list[str]
    count: int
    difficulty_mix: DifficultyMix | None = None


class TestCreateRequest(BaseModel):
    title: str
    class_id: str
    type: TestType
    auto_compose: AutoCompose


class TestCreateResponse(BaseModel):
    id: str
    title: str
    type: TestType
    class_id: str
    question_ids: list[str]
    created_at: datetime


class TestQuestionTeacherView(BaseModel):
    id: str
    text: str
    difficulty: str
    node_id: str
    answer: str


class TestDetailResponse(BaseModel):
    id: str
    title: str
    type: TestType
    class_id: str
    questions: list[TestQuestionTeacherView]
    assigned_student_ids: list[str] = Field(default_factory=list)


class TestListItem(BaseModel):
    id: str
    title: str
    type: TestType
    class_id: str
    created_at: datetime
    status: TestCompletionStatus
    assigned_count: int = 0
    submitted_count: int = 0


class TestListResponse(BaseModel):
    items: list[TestListItem]
    total: int
    page: int
    page_size: int


class TestAssignRequest(BaseModel):
    class_id: str | None = None
    student_ids: list[str] | None = None
    due_at: datetime | None = None


class TestAssignResponse(BaseModel):
    test_id: str
    assigned_student_ids: list[str]
    due_at: datetime | None = None
