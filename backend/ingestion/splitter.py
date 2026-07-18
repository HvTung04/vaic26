"""Splitter: LLM structured output segments RawExam into Question drafts.
No numbering heuristics — one schema handles PDF-text and photo-OCR uniformly.
"""

from __future__ import annotations

from .llm_client import structured_completion
from .models import RawExam, SplitQuestion, SplitResponse

_SPLIT_SYSTEM = (
    "You segment a Vietnamese exam into individual questions. Preserve LaTeX and "
    "math symbols verbatim. For each question return its text, option texts in order "
    "(A, B, C, D...), and the correct answer key if visible. Output strict JSON."
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
                    "correct_answer": {"type": ["string", "null"]},
                },
                "required": ["index", "text", "options"],
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
