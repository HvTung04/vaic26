"""Tagger: LLM structured output labels each question with taxonomy nodes + difficulty.
Off-enum nodes -> retry once -> else flag low confidence for teacher review.
"""

from __future__ import annotations

from .llm_client import structured_completion
from .models import Difficulty, SplitQuestion, TagResponse
from .taxonomy import load_taxonomy_nodes, load_taxonomy_context

_TAG_SYSTEM = (
    "You tag a Vietnamese math exam question against the 2018 curriculum knowledge graph.\n"
    "Choose one or more knowledge_nodes from the provided node list.\n"
    "Each node is: ID | Grade | Topic | Content description | Learning outcome IDs.\n"
    "Pick nodes whose content matches what the question tests.\n"
    "Set difficulty 1=easy/2=medium/3=hard. Give confidence 0..1.\n"
    "Output strict JSON. If unsure, set low confidence; never invent a node."
)

_TAG_SCHEMA = {
    "type": "object",
    "properties": {
        "knowledge_nodes": {
            "type": "array",
            "items": {"type": "string"},
        },
        "difficulty": {"type": ["integer", "null"], "enum": [1, 2, 3]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "sub_skill": {"type": ["string", "null"]},
    },
    "required": ["knowledge_nodes", "difficulty", "confidence"],
    "additionalProperties": False,
}


def _build_user(q: SplitQuestion, nodes: list[str]) -> str:
    opts = "\n".join(q.options)
    ctx = load_taxonomy_context()
    return (
        f"TAXONOMY NODES:\n{ctx}\n\n"
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
    invalid = [n for n in tag.knowledge_nodes if n not in nodes]
    if invalid:
        data = structured_completion(
            system=_TAG_SYSTEM + f"\nInvalid nodes rejected: {invalid}. Pick only from the taxonomy list above.",
            user=_build_user(q, nodes),
            json_schema=_TAG_SCHEMA,
            schema_name="TagResponse",
        )
        tag = TagResponse.model_validate(data)
    # Remove any still-invalid nodes
    tag.knowledge_nodes = [n for n in tag.knowledge_nodes if n in nodes]
    # Low confidence -> flag for teacher (no auto-reject)
    if not tag.knowledge_nodes or (tag.confidence or 0) < 0.5:
        tag.confidence = min(tag.confidence or 0.0, 0.4)
    return tag
