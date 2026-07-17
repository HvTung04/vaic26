import uuid

from pydantic import BaseModel, ConfigDict


class DiagnosisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    answer_id: uuid.UUID
    suspected_node_id: uuid.UUID
    confidence: float
    reasoning: str | None = None
