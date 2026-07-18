"""Tagger: LLM structured output labels each question with taxonomy node + difficulty.
Off-enum node -> retry once -> else flag low confidence for teacher review.
"""

from __future__ import annotations

from .llm_client import structured_completion
from .models import Difficulty, SplitQuestion, TagResponse
from .taxonomy import load_taxonomy_nodes

_TAG_SYSTEM = (
    "You tag a Vietnamese exam question. Choose knowledge_node ONLY from the given "
    "node list. Set difficulty 1=easy/2=medium/3=hard. Give confidence 0..1. "
    "Output strict JSON. If unsure, set low confidence; never invent a node."
)

_TAG_SCHEMA = {
    "type": "object",
    "properties": {
        "knowledge_node": {"type": ["string", "null"]},
        "difficulty": {"type": ["integer", "null"], "enum": [1, 2, 3]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "sub_skill": {"type": ["string", "null"]},
    },
    "required": ["knowledge_node", "difficulty", "confidence"],
    "additionalProperties": False,
}


def _build_user(q: SplitQuestion, nodes: list[str]) -> str:
    opts = "\n".join(q.options)
    return (
        f"NODE LIST (enum): {nodes}\n\n"
        f"QUESTION: {q.text}\nOPTIONS:\n{opts}\n"
    )


def tag_question(q: SplitQuestion) -> TagResponse:
    nodes = load_taxonomy_nodes()
    data = structured_completion(
        system=_TAG_SYSTEM,
        user=_build_user(q, nodes),
        json_schema=_TAG_SCHEMA,
        schema_name="TagResponse",
    )
    tag = TagResponse.model_validate(data)
    # Off-enum -> retry once
    if tag.knowledge_node not in nodes:
        data = structured_completion(
            system=_TAG_SYSTEM + " The previous node was invalid. Pick a valid one.",
            user=_build_user(q, nodes),
            json_schema=_TAG_SCHEMA,
            schema_name="TagResponse",
        )
        tag = TagResponse.model_validate(data)
    # Still off-enum or low confidence -> flag for teacher (no auto-reject)
    if tag.knowledge_node not in nodes or (tag.confidence or 0) < 0.5:
        tag.confidence = min(tag.confidence or 0.0, 0.4)
    return tag
