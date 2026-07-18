"""Tests for splitter + tagger schemas (no real LLM; monkeypatch client)."""

from ingestion import splitter, tagger
from ingestion.models import RawExam, SourceType, SplitQuestion, TagResponse, Difficulty


def test_split_exam_segments(monkeypatch):
    fake = {"questions": [
        {"index": 1, "text": "Câu 1?", "options": ["A", "B"]},
        {"index": 2, "text": "Câu 2?", "options": ["A", "B", "C"]},
    ]}
    monkeypatch.setattr(splitter, "structured_completion", lambda **k: fake)
    out = splitter.split_exam(RawExam(source_type=SourceType.PDF, text="raw"))
    assert len(out) == 2
    assert out[0].text == "Câu 1?"


def test_split_empty_raises(monkeypatch):
    monkeypatch.setattr(splitter, "structured_completion", lambda **k: {"questions": []})
    raw = RawExam(source_type=SourceType.PDF, text="")
    try:
        splitter.split_exam(raw)
        assert False, "expected ValueError"
    except ValueError:
        pass


def test_tag_off_enum_flagged(monkeypatch):
    # first call off-enum, retry still off-enum -> low confidence flag
    monkeypatch.setattr(tagger, "structured_completion", lambda **k: {
        "knowledge_node": "bad-node", "difficulty": 1, "confidence": 0.9
    })
    q = SplitQuestion(index=1, text="q?", options=["A"])
    t = tagger.tag_question(q)
    assert t.knowledge_node not in tagger.load_taxonomy_nodes()
    assert t.confidence <= 0.4


def test_tag_valid_node_passthrough(monkeypatch):
    node = "math-g5-fraction-equivalent"
    monkeypatch.setattr(tagger, "structured_completion", lambda **k: {
        "knowledge_node": node, "difficulty": 2, "confidence": 0.8
    })
    t = tagger.tag_question(SplitQuestion(index=1, text="q?", options=["A"]))
    assert t.knowledge_node == node
    assert t.difficulty == Difficulty.MEDIUM
