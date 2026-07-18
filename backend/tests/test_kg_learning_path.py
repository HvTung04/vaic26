"""Tests for learning path (template fallback only — no LLM in tests)."""

from app.services.kg.learning_path import _template_path, _build_mastery_summary
from app.schemas.kg import MasteryRecord, Graph
from app.repositories.graph_repo import load_graph


def test_template_path_weak():
    g = load_graph()
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.2),
        "L6-t1-B02": MasteryRecord("s1", "L6-t1-B02", 0.8),
    }
    lp = _template_path("s1", mmap, g)
    assert len(lp.tiers) >= 1
    assert lp.tiers[0].name == "Bù nền tảng"
    assert "L6-t1-B01" in lp.tiers[0].nodes


def test_template_path_all_strong():
    g = load_graph()
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.9),
    }
    lp = _template_path("s1", mmap, g)
    assert len(lp.tiers) >= 1


def test_build_mastery_summary():
    g = load_graph()
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.3, answer_count=5),
    }
    text = _build_mastery_summary(mmap, g)
    assert "L6-t1-B01" in text
    assert "0.30" in text
