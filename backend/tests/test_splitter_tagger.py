"""Tests for splitter + tagger schemas (no real LLM; monkeypatch client)."""

from app.services.ingestion import splitter, tagger
from app.schemas.ingestion import RawExam, SourceType, SplitQuestion, TagResponse, Difficulty


def test_split_exam_segments(monkeypatch):
    fake = {"questions": [
        {"index": 1, "text": "Câu 1?", "options": ["A", "B"], "correct_answer": "B"},
        {"index": 2, "text": "Câu 2?", "options": ["A", "B", "C"], "correct_answer": "A"},
    ]}
    monkeypatch.setattr(splitter, "structured_completion", lambda **k: fake)
    out = splitter.split_exam(RawExam(source_type=SourceType.PDF, text="raw"))
    assert len(out) == 2
    assert out[0].text == "Câu 1?"
    assert out[0].correct_answer == "B"
    assert out[1].correct_answer == "A"


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
        "knowledge_nodes": ["bad-node"], "difficulty": 1, "confidence": 0.9
    })
    q = SplitQuestion(index=1, text="q?", options=["A"])
    t = tagger.tag_question(q)
    assert len(t.knowledge_nodes) == 0
    assert t.confidence <= 0.4


def test_tag_valid_node_passthrough(monkeypatch):
    node = "L6-t1-B01"
    monkeypatch.setattr(tagger, "structured_completion", lambda **k: {
        "knowledge_nodes": [node], "difficulty": 2, "confidence": 0.8
    })
    t = tagger.tag_question(SplitQuestion(index=1, text="q?", options=["A"]))
    assert t.knowledge_nodes == [node]
    assert t.difficulty == Difficulty.MEDIUM


def test_tag_multi_node(monkeypatch):
    n1, n2 = "L6-t1-B01", "L6-t1-B02"
    monkeypatch.setattr(tagger, "structured_completion", lambda **k: {
        "knowledge_nodes": [n1, n2], "difficulty": 2, "confidence": 0.75
    })
    t = tagger.tag_question(SplitQuestion(index=1, text="q?", options=["A"]))
    assert t.knowledge_nodes == [n1, n2]
