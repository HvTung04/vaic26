from __future__ import annotations

from pydantic import BaseModel

from app.schemas.test_taking import AttemptQuestion, GraphUpdate, QuestionResult


class PracticeQuestionsResponse(BaseModel):
    node_id: str
    questions: list[AttemptQuestion]


class PracticeAnswerItem(BaseModel):
    question_id: str
    answer: str


class PracticeCheckRequest(BaseModel):
    answers: list[PracticeAnswerItem]


class PracticeCheckResponse(BaseModel):
    results: list[QuestionResult]
    graph_updates: list[GraphUpdate]
