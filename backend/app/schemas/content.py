from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.models.question import Difficulty, QuestionType, UploadStatus


class UploadCreateResponse(BaseModel):
    upload_id: str
    status: UploadStatus
    created_at: datetime


class ParsedQuestion(BaseModel):
    draft_id: str
    text: str
    type: QuestionType
    options: list[str] | None = None
    answer: str | None = None
    suggested_node_id: str | None = None
    suggested_difficulty: Difficulty | None = None
    confidence: float


class UploadStatusResponse(BaseModel):
    upload_id: str
    status: UploadStatus
    parsed_questions: list[ParsedQuestion] = []
    error: str | None = None


class ApproveQuestionItem(BaseModel):
    draft_id: str
    text: str | None = None
    options: list[str] | None = None
    answer: str | None = None
    node_id: str
    difficulty: Difficulty


class ApproveRequest(BaseModel):
    questions: list[ApproveQuestionItem]


class ApproveResponse(BaseModel):
    upload_id: str
    created_question_ids: list[str]
    approved_count: int


class QuestionOption(BaseModel):
    key: str
    text: str


class QuestionDetail(BaseModel):
    id: str
    text: str
    type: QuestionType
    options: list[QuestionOption] | None = None
    answer: str
    explanation: str | None = None
    difficulty: Difficulty
    node_id: str
    source_upload_id: str | None = None
    created_at: datetime


class QuestionListResponse(BaseModel):
    items: list[QuestionDetail]
    total: int
