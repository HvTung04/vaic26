"""Tests for KG client local fallback."""

import json
import os

from app.repositories.mastery_repo import save_mastery, load_mastery
from app.schemas.kg import MasteryRecord


def test_save_load_roundtrip(tmp_path, monkeypatch):
    monkeypatch.setenv("GAPLENS_MASTERY_FILE", str(tmp_path / "m.json"))
    mmap = {
        "L6-t1-B01": MasteryRecord(
            student_id="s1", node_id="L6-t1-B01",
            mastery_level=0.65, weight=0.2, answer_count=3,
        )
    }
    save_mastery("s1", mmap)
    loaded = load_mastery("s1")
    assert "L6-t1-B01" in loaded
    assert abs(loaded["L6-t1-B01"].mastery_level - 0.65) < 0.01


def test_load_nonexistent():
    loaded = load_mastery("nonexistent_student_xyz")
    assert loaded == {}
