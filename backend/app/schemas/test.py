import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.test import TestType


class TestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: TestType
    title: str


class AnswerSubmit(BaseModel):
    question_id: uuid.UUID
    student_answer: str
    time_taken_seconds: int | None = None


class AttemptSubmit(BaseModel):
    test_id: uuid.UUID
    answers: list[AnswerSubmit]


class AnswerResult(BaseModel):
    question_id: uuid.UUID
    is_correct: bool
    error_type: str | None = None


class AttemptResult(BaseModel):
    attempt_id: uuid.UUID
    submitted_at: datetime
    results: list[AnswerResult]
