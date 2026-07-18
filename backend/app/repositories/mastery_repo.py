"""KG client: read/write mastery via API or local JSON fallback.
Same pattern as ingestion.bank_client.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import httpx

from app.schemas.kg import MasteryRecord

_API_BASE = os.environ.get("GAPLENS_API_BASE", "").rstrip("/")
_MASTERY_FILE = Path(__file__).resolve().parents[2] / "mastery.local.json"


def _mastery_path() -> Path:
    return Path(os.environ.get("GAPLENS_MASTERY_FILE", str(_MASTERY_FILE)))


def save_mastery(
    student_id: str,
    mastery_map: dict[str, MasteryRecord],
) -> None:
    """Persist mastery state."""
    payload = {
        nid: {
            "student_id": rec.student_id or student_id,
            "node_id": rec.node_id,
            "mastery_level": rec.mastery_level,
            "weight": rec.weight,
            "confidence": rec.confidence,
            "answer_count": rec.answer_count,
        }
        for nid, rec in mastery_map.items()
    }

    if _API_BASE:
        httpx.post(
            f"{_API_BASE}/mastery/{student_id}",
            json=payload,
            timeout=30,
        )
        return

    # Local fallback: per-student file
    fb = _mastery_path().parent
    fb.mkdir(parents=True, exist_ok=True)
    student_file = fb / f"mastery_{student_id}.json"
    student_file.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_mastery(student_id: str) -> dict[str, MasteryRecord]:
    """Load mastery state for a student."""
    if _API_BASE:
        resp = httpx.get(f"{_API_BASE}/mastery/{student_id}", timeout=30)
        data = resp.json()
    else:
        fb = _mastery_path().parent
        student_file = fb / f"mastery_{student_id}.json"
        if not student_file.exists():
            return {}
        data = json.loads(student_file.read_text(encoding="utf-8"))

    result: dict[str, MasteryRecord] = {}
    for nid, rec in data.items():
        result[nid] = MasteryRecord(
            student_id=rec.get("student_id", student_id),
            node_id=rec.get("node_id", nid),
            mastery_level=rec.get("mastery_level", 1.0),
            weight=rec.get("weight", 0.0),
            confidence=rec.get("confidence", 1.0),
            answer_count=rec.get("answer_count", 0),
        )
    return result


def save_all_mastery(
    students: list[dict],
    all_mastery: dict[str, dict[str, MasteryRecord]],
) -> None:
    """Batch save mastery for all students."""
    for s in students:
        sid = s["id"]
        if sid in all_mastery:
            save_mastery(sid, all_mastery[sid])
