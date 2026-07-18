"""Taxonomy loader. Node list OWNED by BE/AI 2 (Knowledge Graph service).

Role 1 only consumes it. Until BE/AI 2 locks the real list, a placeholder is used
so the pipeline runs. Swap by setting GAPLENS_TAXONOMY_PATH or replacing PLACEHOLDER_NODES.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

# Placeholder until BE/AI 2 delivers the fixed 2018-curriculum node list.
PLACEHOLDER_NODES: list[str] = [
    "math-g5-fraction-equivalent",
    "math-g5-fraction-compare",
    "math-g5-fraction-divide",
    "math-g7-fraction-decompose",
    "math-g7-function-basic",
]

_TAXONOMY_PATH = os.environ.get(
    "GAPLENS_TAXONOMY_PATH",
    Path(__file__).resolve().parents[1] / "taxonomy.json",
)


def load_taxonomy_nodes() -> list[str]:
    """Return the fixed knowledge-node id list (enum for LLM tagging)."""
    path = Path(_TAXONOMY_PATH)
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return PLACEHOLDER_NODES


def is_valid_node(node: str | None) -> bool:
    if not node:
        return False
    return node in load_taxonomy_nodes()
