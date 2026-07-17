import uuid

from pydantic import BaseModel, ConfigDict

from app.models.question import Difficulty


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    content: str
    options: dict | None = None
    node_id: uuid.UUID
    difficulty: Difficulty


class QuestionCreate(BaseModel):
    content: str
    options: dict | None = None
    correct_answer: str
    node_id: uuid.UUID
    difficulty: Difficulty
    source: str | None = None


class IngestionUploadResponse(BaseModel):
    job_id: uuid.UUID
    status: str  # "queued" | "processing" | "done" | "failed"
    questions_extracted: int = 0
