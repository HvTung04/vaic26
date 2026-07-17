import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class LearningPathNode(BaseModel):
    node_id: uuid.UUID
    tier: Literal["foundation", "bridge", "application"]
    explanation: str


class LearningPathRead(BaseModel):
    student_id: uuid.UUID
    generated_at: datetime
    path: list[LearningPathNode]
