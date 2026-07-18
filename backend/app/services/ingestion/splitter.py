"""Splitter: LLM structured output segments RawExam into Question drafts.
No numbering heuristics — one schema handles PDF-text and photo-OCR uniformly.
LLM also solves each question and always returns correct_answer.
"""

from __future__ import annotations

from .llm_client import structured_completion
from app.schemas.ingestion import RawExam, SplitQuestion, SplitResponse

_SPLIT_SYSTEM = (
    "You are a Vietnamese math teacher. Segment this exam into individual questions.\n"
    "For each question:\n"
    "1. Extract the question text exactly (preserve LaTeX and math symbols).\n"
    "2. Extract all options (A, B, C, D...) exactly.\n"
    "3. SOLVE the question yourself and determine the correct answer.\n"
    "   - If the answer key is visible in the source, use it.\n"
    "   - If not, solve it yourself. You are a math teacher — compute the answer.\n"
    "4. Always return correct_answer as a non-null option key (e.g. \"B\").\n\n"
    "Output strict JSON. Never return null for correct_answer."
)

_SPLIT_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "index": {"type": "integer"},
                    "text": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}},
                    "correct_answer": {"type": "string"},
                },
                "required": ["index", "text", "options", "correct_answer"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["questions"],
    "additionalProperties": False,
}


def split_exam(raw: RawExam) -> list[SplitQuestion]:
    """LLM segments raw exam text into ordered question drafts."""
    data = structured_completion(
        system=_SPLIT_SYSTEM,
        user=raw.text,
        json_schema=_SPLIT_SCHEMA,
        schema_name="SplitResponse",
    )
    parsed = SplitResponse.model_validate(data)
    # Re-count guard: ask model to honor visible question markers; if empty, raise.
    if not parsed.questions:
        raise ValueError("LLM split returned 0 questions; raw text may be empty.")
    return parsed.questions
