from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.models.submission import SubmissionStatus
from app.models.test import TestType


class StudentTestListItem(BaseModel):
    test_id: str
    title: str
    type: TestType
    due_at: datetime | None = None
    status: Literal["pending", "in_progress", "submitted"]


class AttemptQuestion(BaseModel):
    id: str
    text: str
    type: str
    options: list[str] | None = None


class AttemptResponse(BaseModel):
    test_id: str
    title: str
    questions: list[AttemptQuestion]


class SubmitAnswerItem(BaseModel):
    question_id: str
    answer: str
    time_spent_seconds: int


class SubmitRequest(BaseModel):
    student_id: str
    answers: list[SubmitAnswerItem]


class SubmitResponse(BaseModel):
    submission_id: str
    test_id: str
    student_id: str
    status: SubmissionStatus
    submitted_at: datetime


class GraphUpdate(BaseModel):
    node_id: str
    node_name: str | None = None
    mastery_before: float
    mastery_after: float


class QuestionResult(BaseModel):
    question_id: str
    question_text: str | None = None
    is_correct: bool
    student_answer: str | None = None
    correct_answer: str
    explanation: str | None = None
    root_cause_node_id: str | None = None
    root_cause_node_name: str | None = None
    root_cause_chain: list[str] = []
    confidence: float | None = None


class SubmissionResultResponse(BaseModel):
    submission_id: str
    test_id: str | None = None
    test_title: str | None = None
    student_id: str | None = None
    student_name: str | None = None
    submitted_at: datetime | None = None
    status: SubmissionStatus
    score: float
    total: int
    results: list[QuestionResult]
    graph_updates: list[GraphUpdate]
