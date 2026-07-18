"""Tests for bank_client local fallback (no API)."""

import json
import os

from ingestion.models import QuestionDraft, AnswerOption, SourceType
from ingestion.bank_client import push_drafts


def test_push_local_fallback(tmp_path, monkeypatch):
    bank = tmp_path / "bank.local.json"
    monkeypatch.setenv("GAPLENS_LOCAL_BANK", str(bank))
    monkeypatch.delenv("GAPLENS_API_BASE", raising=False)
    d = QuestionDraft(
        index=1, text="q?", options=[AnswerOption(key="A", text="x")],
        source_type=SourceType.PDF, knowledge_nodes=["math-g5-fraction-equivalent"],
        difficulty=1, confidence=0.9,
    )
    pushed = push_drafts([d])
    assert pushed[0]["status"] == "draft"
    assert pushed[0]["knowledge_nodes"] == ["math-g5-fraction-equivalent"]
    saved = json.loads(bank.read_text())
    assert saved[0]["text"] == "q?"
