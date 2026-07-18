"""Tests for revision test selector."""

from kg.revision import select_revision_questions, get_answered_question_ids
from kg.models import MasteryRecord


def test_select_weak_nodes():
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.3),
        "L6-t1-B02": MasteryRecord("s1", "L6-t1-B02", 0.2),
        "L6-t1-B03": MasteryRecord("s1", "L6-t1-B03", 0.9),
    }
    bank = [
        {"id": "q1", "knowledge_nodes": ["L6-t1-B01"], "difficulty": 1},
        {"id": "q2", "knowledge_nodes": ["L6-t1-B01"], "difficulty": 2},
        {"id": "q3", "knowledge_nodes": ["L6-t1-B02"], "difficulty": 1},
        {"id": "q4", "knowledge_nodes": ["L6-t1-B03"], "difficulty": 1},
    ]
    rt = select_revision_questions(mmap, bank, max_nodes=2, questions_per_node=2)
    assert len(rt.target_nodes) == 2
    assert "L6-t1-B03" not in rt.target_nodes  # strong node excluded


def test_select_avoids_answered():
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.3),
    }
    bank = [
        {"id": "q1", "knowledge_nodes": ["L6-t1-B01"], "difficulty": 1},
        {"id": "q2", "knowledge_nodes": ["L6-t1-B01"], "difficulty": 2},
    ]
    answered = {"q1"}
    rt = select_revision_questions(mmap, bank, answered_ids=answered)
    # Should prefer q2 (unanswered) over q1
    ids = [q.get("id") for q in rt.questions]
    assert "q2" in ids


def test_select_empty_if_all_strong():
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.9),
    }
    bank = [{"id": "q1", "knowledge_nodes": ["L6-t1-B01"], "difficulty": 1}]
    rt = select_revision_questions(mmap, bank)
    assert len(rt.questions) == 0


def test_difficulty_distribution():
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.3),
    }
    bank = [
        {"id": f"q{i}", "knowledge_nodes": ["L6-t1-B01"], "difficulty": d}
        for i, d in enumerate([1, 1, 2, 2, 3, 3])
    ]
    rt = select_revision_questions(mmap, bank, questions_per_node=4)
    total = sum(rt.difficulty_distribution.values())
    assert total == len(rt.questions)


def test_max_total_cap():
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.3),
        "L6-t1-B02": MasteryRecord("s1", "L6-t1-B02", 0.2),
    }
    bank = [
        {"id": f"q{i}", "knowledge_nodes": [n], "difficulty": 1}
        for n in ["L6-t1-B01", "L6-t1-B02"]
        for i in range(5)
    ]
    rt = select_revision_questions(mmap, bank, max_total=5)
    assert len(rt.questions) <= 5


def test_get_answered_ids():
    answers = [{"question_id": "q1"}, {"question_id": "q2"}, {}]
    ids = get_answered_question_ids(answers)
    assert ids == {"q1", "q2"}
