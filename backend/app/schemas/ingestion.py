"""Pydantic models for the ingestion pipeline (Role 1)."""

from __future__ import annotations

from enum import Enum, IntEnum
from typing import Optional

from pydantic import BaseModel, Field


class Difficulty(IntEnum):
    EASY = 1
    MEDIUM = 2
    HARD = 3


class SourceType(str, Enum):
    PDF = "pdf"
    PHOTO = "photo"


class AnswerOption(BaseModel):
    key: str  # "A", "B", ...
    text: str


class RawExam(BaseModel):
    """Unified raw text from either PDF parse or photo OCR."""

    source_type: SourceType
    text: str  # raw extracted text, LaTeX/symbols preserved
    file_name: Optional[str] = None


class QuestionDraft(BaseModel):
    """Output of LLM split + tag, staged for teacher review (status=draft)."""

    index: int
    text: str
    options: list[AnswerOption] = Field(default_factory=list)
    correct_answer: str = ""  # LLM solves, teacher verifies on review
    knowledge_nodes: list[str] = Field(default_factory=list)  # taxonomy node ids
    difficulty: Optional[Difficulty] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    source_type: SourceType
    status: str = "draft"  # draft -> approved via teacher review


class SplitQuestion(BaseModel):
    index: int
    text: str
    options: list[str] = Field(default_factory=list)
    correct_answer: str = ""  # LLM always solves, never null


class SplitResponse(BaseModel):
    questions: list[SplitQuestion]


class TagResponse(BaseModel):
    knowledge_nodes: list[str] = Field(default_factory=list)
    difficulty: Optional[Difficulty] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    sub_skill: Optional[str] = None
