"""Knowledge Graph service: MongoDB is the store, the pure kg/* modules (already
built by the KG role) are the algorithms. This module is the only place that
knows both — it loads nodes/edges/mastery from Mongo into the in-memory
dataclasses those modules expect, and persists the results back.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorDatabase

from kg.graph import build_graph
from kg.mastery import MIN_ANSWERS_TO_TRUST, unit_proximity, update_student_mastery
from kg.models import Graph, MasteryRecord

from app.db import mongodb as mdb

_DOCS = Path(__file__).resolve().parents[3] / "docs"
_GRAPH_META_ID = "graph"

# In-process cache: curriculum graph is static seed data, reloaded on demand only.
_graph_cache: Graph | None = None


async def seed_graph(
    db: AsyncIOMotorDatabase,
    nodes_path: Path | None = None,
    edges_path: Path | None = None,
) -> dict:
    """Load docs/curriculum_nodes.json + curriculum_edges.json into Mongo. Idempotent."""
    raw_nodes = json.loads((nodes_path or _DOCS / "curriculum_nodes.json").read_text(encoding="utf-8"))
    raw_edges = json.loads((edges_path or _DOCS / "curriculum_edges.json").read_text(encoding="utf-8"))

    for n in raw_nodes:
        await db[mdb.NODES].replace_one({"_id": n["_id"]}, n, upsert=True)
    for e in raw_edges:
        await db[mdb.EDGES].replace_one({"_id": e["_id"]}, e, upsert=True)

    meta = {
        "_id": _GRAPH_META_ID,
        "version": f"v{len(raw_nodes)}-{len(raw_edges)}",
        "node_count": len(raw_nodes),
        "edge_count": len(raw_edges),
        "seeded_at": datetime.now(timezone.utc),
    }
    await db[mdb.META].replace_one({"_id": _GRAPH_META_ID}, meta, upsert=True)

    global _graph_cache
    _graph_cache = None
    return meta


async def get_graph_snapshot_id(db: AsyncIOMotorDatabase) -> str:
    meta = await db[mdb.META].find_one({"_id": _GRAPH_META_ID})
    return meta["version"] if meta else "unseeded"


async def load_graph(db: AsyncIOMotorDatabase, *, refresh: bool = False) -> Graph:
    global _graph_cache
    if _graph_cache is not None and not refresh:
        return _graph_cache

    raw_nodes = [doc async for doc in db[mdb.NODES].find({})]
    raw_edges = [doc async for doc in db[mdb.EDGES].find({})]
    _graph_cache = build_graph(raw_nodes, raw_edges)
    return _graph_cache


def _topic_order(topic_id: str) -> int:
    try:
        return int(topic_id[1:])  # "t1" -> 1
    except (ValueError, IndexError):
        return 0


def _mastery_doc_id(student_id: str, node_id: str) -> str:
    return f"{student_id}:{node_id}"


def record_from_doc(doc: dict) -> MasteryRecord:
    return MasteryRecord(
        student_id=doc["student_id"],
        node_id=doc["node_id"],
        mastery_level=doc.get("mastery_level", 1.0),
        weight=doc.get("weight", 0.0),
        confidence=doc.get("confidence", 1.0),
        answer_count=doc.get("answer_count", 0),
    )


async def get_mastery_map(db: AsyncIOMotorDatabase, student_id: str) -> dict[str, MasteryRecord]:
    cursor = db[mdb.MASTERY].find({"student_id": student_id})
    return {doc["node_id"]: record_from_doc(doc) async for doc in cursor}


async def get_mastery_docs(db: AsyncIOMotorDatabase, student_id: str) -> dict[str, dict]:
    """Raw Mongo docs (includes `last_updated`, unlike the MasteryRecord dataclass)."""
    cursor = db[mdb.MASTERY].find({"student_id": student_id})
    return {doc["node_id"]: doc async for doc in cursor}


async def get_mastery_maps(
    db: AsyncIOMotorDatabase, student_ids: list[str]
) -> dict[str, dict[str, MasteryRecord]]:
    cursor = db[mdb.MASTERY].find({"student_id": {"$in": student_ids}})
    result: dict[str, dict[str, MasteryRecord]] = {sid: {} for sid in student_ids}
    async for doc in cursor:
        result.setdefault(doc["student_id"], {})[doc["node_id"]] = record_from_doc(doc)
    return result


def node_confidence(attempts: int) -> float:
    return min(1.0, attempts / MIN_ANSWERS_TO_TRUST)


def needs_review(record: MasteryRecord) -> bool:
    return record.answer_count < MIN_ANSWERS_TO_TRUST or record.mastery_level < 0.5


async def apply_answer(
    db: AsyncIOMotorDatabase,
    *,
    student_id: str,
    node_id: str,
    is_correct: bool,
    difficulty: int,
    graph: Graph,
    current_unit: tuple[int, int],
    reason: str,
    source_submission_id: str | None = None,
    existing_record: MasteryRecord | None = None,
) -> tuple[float, MasteryRecord]:
    """Update one node's mastery for a student, deterministically (kg.mastery formula),
    and log the change to history. Returns (mastery_before, updated_record).

    Pass `existing_record` when the caller already holds an up-to-date mastery
    map (e.g. mid-submission grading) to skip a redundant Mongo read.
    """
    if existing_record is not None:
        record = existing_record
    else:
        doc = await db[mdb.MASTERY].find_one({"_id": _mastery_doc_id(student_id, node_id)})
        record = record_from_doc(doc) if doc else MasteryRecord(student_id=student_id, node_id=node_id)
    mastery_before = record.mastery_level

    proximity = unit_proximity(node_id, current_unit, graph)
    mastery_map = {node_id: record}
    update_student_mastery(mastery_map, node_id, is_correct, difficulty, proximity)
    updated = mastery_map[node_id]
    updated.student_id = student_id

    now = datetime.now(timezone.utc)
    history_entry = {
        "mastery": updated.mastery_level,
        "confidence": node_confidence(updated.answer_count),
        "reason": reason,
        "source_submission_id": source_submission_id,
        "changed_at": now,
    }
    await db[mdb.MASTERY].update_one(
        {"_id": _mastery_doc_id(student_id, node_id)},
        {
            "$set": {
                "student_id": student_id,
                "node_id": node_id,
                "mastery_level": updated.mastery_level,
                "weight": updated.weight,
                "confidence": node_confidence(updated.answer_count),
                "answer_count": updated.answer_count,
                "last_updated": now,
            },
            "$push": {"history": history_entry},
        },
        upsert=True,
    )
    return mastery_before, updated


async def get_node_history(db: AsyncIOMotorDatabase, student_id: str, node_id: str) -> list[dict]:
    doc = await db[mdb.MASTERY].find_one({"_id": _mastery_doc_id(student_id, node_id)})
    return doc.get("history", []) if doc else []


def current_unit_for(graph: Graph, node_id: str, fallback_grade: int) -> tuple[int, int]:
    node = graph.nodes.get(node_id)
    if not node:
        return (fallback_grade, 0)
    return (node.grade, _topic_order(node.topic_id))
