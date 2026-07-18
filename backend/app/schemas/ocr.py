from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.models.ocr_scan import ScanStatus


class ScanCreateResponse(BaseModel):
    scan_id: str
    status: ScanStatus
    created_at: datetime


class ScanAnswer(BaseModel):
    question_id: str
    detected_answer: str
    confidence: float


class ScanResultResponse(BaseModel):
    scan_id: str
    status: ScanStatus
    test_id: str
    detected_student_id: str | None = None
    answers: list[ScanAnswer] = []
    low_confidence_flags: list[str] = []


class ScanConfirmAnswer(BaseModel):
    question_id: str
    final_answer: str


class ScanConfirmRequest(BaseModel):
    student_id: str
    answers: list[ScanConfirmAnswer]


class ScanConfirmResponse(BaseModel):
    scan_id: str
    submission_id: str
    status: str = "confirmed"
