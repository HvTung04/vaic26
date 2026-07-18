"""Bank client: push drafted questions to Question Bank per contract.md.
Falls back to local JSON store when the API is not live (FE mock mode).
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import httpx

from .models import QuestionDraft

_API_BASE = os.environ.get("GAPLENS_API_BASE", "").rstrip("/")


def _local_bank_path() -> Path:
    return Path(
        os.environ.get(
            "GAPLENS_LOCAL_BANK",
            Path(__file__).resolve().parents[1] / "bank.local.json",
        )
    )


def _draft_to_payload(d: QuestionDraft) -> dict:
    return {
        "text": d.text,
        "options": [{"key": o.key, "text": o.text} for o in d.options],
        "correct_answer": d.correct_answer,
        "knowledge_node": d.knowledge_node,
        "difficulty": int(d.difficulty) if d.difficulty else None,
        "confidence": d.confidence,
        "source_type": d.source_type.value,
        "status": "draft",
    }


def push_drafts(drafts: list[QuestionDraft]) -> list[dict]:
    """POST drafts. Uses API if GAPLENS_API_BASE set, else local JSON fallback."""
    payloads = [_draft_to_payload(d) for d in drafts]
    if _API_BASE:
        httpx.post(f"{_API_BASE}/questions", json=payloads, timeout=30)
        return payloads
    # local fallback
    fb = _local_bank_path()
    fb.parent.mkdir(parents=True, exist_ok=True)
    existing = json.loads(fb.read_text()) if fb.exists() else []
    existing.extend(payloads)
    fb.write_text(json.dumps(existing, ensure_ascii=False, indent=2))
    return payloads
