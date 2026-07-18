"""Taxonomy loader. Loads the real 2018 curriculum graph from docs/.

Node list OWNED by BE/AI 2 (Knowledge Graph service) — stored in
docs/curriculum_nodes.json + docs/curriculum_edges.json.
Role 1 consumes it for LLM tagging enum.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

_DOCS_DIR = Path(__file__).resolve().parents[3] / "docs"
_NODES_PATH = _DOCS_DIR / "curriculum_nodes.json"
_EDGES_PATH = _DOCS_DIR / "curriculum_edges.json"

# Cache loaded data
_nodes_cache: list[dict] | None = None
_node_ids_cache: list[str] | None = None
_node_map_cache: dict[str, dict] | None = None


def _load_raw() -> list[dict]:
    global _nodes_cache
    if _nodes_cache is None:
        path = _NODES_PATH
        if os.environ.get("GARY_TAXONOMY_PATH"):
            path = Path(os.environ["GARY_TAXONOMY_PATH"])
        _nodes_cache = json.loads(path.read_text(encoding="utf-8"))
    return _nodes_cache


def load_taxonomy_nodes() -> list[str]:
    """Return node ID list (enum for LLM tagging). E.g. ["L6-t1-B01", ...]"""
    global _node_ids_cache
    if _node_ids_cache is None:
        _node_ids_cache = [n["_id"] for n in _load_raw()]
    return _node_ids_cache


def load_node_map() -> dict[str, dict]:
    """Return {node_id: node_dict} for quick lookup."""
    global _node_map_cache
    if _node_map_cache is None:
        _node_map_cache = {n["_id"]: n for n in _load_raw()}
    return _node_map_cache


def load_node_metadata(node_id: str) -> dict | None:
    """Return full node dict with topic_name, noi_dung_cu_the, yccd, etc."""
    return load_node_map().get(node_id)


def load_taxonomy_context() -> str:
    """Build a compact text summary of all nodes for LLM tagging prompt.
    Includes node ID, grade, topic, and short content description.
    """
    lines: list[str] = []
    for n in _load_raw():
        yccd_ids = [y["id"] for y in n.get("yccd", [])]
        lines.append(
            f'{n["_id"]} | G{n["grade"]} | {n["topic_name"]} | '
            f'{n["noi_dung_cu_the"][:80]} | outcomes: {",".join(yccd_ids)}'
        )
    return "\n".join(lines)


def _topic_key(grade: int, topic_id: str) -> str:
    """Groups node ids like 'L6-t1-B01'..'L6-t1-B03' under one topic key
    'L6-t1' (topic_id alone repeats across grades, e.g. 't1' is a different
    topic in grade 6 vs grade 7)."""
    return f"L{grade}-{topic_id}"


def load_topics() -> list[dict]:
    """Return deduped topics: {id, topic_name, grade, topic_id, mach}, one
    per (grade, topic_id) pair, id = the shared node-id prefix.
    """
    seen: dict[str, dict] = {}
    for n in _load_raw():
        key = _topic_key(n["grade"], n["topic_id"])
        if key not in seen:
            seen[key] = {
                "id": key,
                "topic_name": n["topic_name"],
                "grade": n["grade"],
                "topic_id": n["topic_id"],
                "mach": n["mach"],
            }
    return list(seen.values())


def node_ids_for_topic(topic_key: str) -> list[str]:
    """All node ids sharing a topic (e.g. 'L6-t1' -> ['L6-t1-B01', 'L6-t1-B02', ...])."""
    return [n["_id"] for n in _load_raw() if _topic_key(n["grade"], n["topic_id"]) == topic_key]


def is_valid_node(node: str | None) -> bool:
    if not node:
        return False
    return node in load_taxonomy_nodes()


def load_edges() -> list[dict]:
    """Load prerequisite/bridge edges from curriculum_edges.json."""
    if _EDGES_PATH.exists():
        return json.loads(_EDGES_PATH.read_text(encoding="utf-8"))
    return []
