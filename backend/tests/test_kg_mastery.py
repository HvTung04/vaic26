"""Tests for mastery update formula."""

from app.kg.mastery import (
    update_mastery,
    unit_proximity,
    update_student_mastery,
    batch_update,
    get_weak_nodes,
    DIFFICULTY_WEIGHT,
)
from app.kg.models import MasteryRecord, Graph
from app.kg.graph import load_graph


def test_correct_boost():
    m = update_mastery(0.5, is_correct=True, difficulty=3, proximity=1.0)
    assert m > 0.5


def test_wrong_decay():
    m = update_mastery(0.5, is_correct=False, difficulty=3, proximity=1.0)
    assert m < 0.5


def test_hard_wrong_bigger_decay():
    m_easy = update_mastery(0.5, is_correct=False, difficulty=1, proximity=1.0)
    m_hard = update_mastery(0.5, is_correct=False, difficulty=3, proximity=1.0)
    assert m_hard < m_easy


def test_bounds():
    # Can't go above 1.0
    m = update_mastery(0.99, is_correct=True, difficulty=3, proximity=1.0)
    assert m <= 1.0
    # Can't go below 0.0
    m = update_mastery(0.01, is_correct=False, difficulty=3, proximity=1.0)
    assert m >= 0.0


def test_initial_100_decay():
    """Starting at 1.0, wrong answer should decrease."""
    m = update_mastery(1.0, is_correct=False, difficulty=2, proximity=1.0)
    assert m < 1.0
    assert m > 0.0


def test_unit_proximity_same():
    g = load_graph()
    # L6-t1-B01 is grade 6, order 1
    p = unit_proximity("L6-t1-B01", (6, 1), g)
    assert p == 1.0


def test_unit_proximity_far():
    g = load_graph()
    # L8-t7-B03 is far from grade 6
    p = unit_proximity("L8-t7-B03", (6, 1), g)
    assert p < 1.0


def test_update_student_mastery():
    mmap: dict[str, MasteryRecord] = {}
    rec = update_student_mastery(mmap, "L6-t1-B01", False, 2, 1.0)
    assert rec.mastery_level < 1.0
    assert rec.answer_count == 1
    assert "L6-t1-B01" in mmap


def test_batch_update():
    g = load_graph()
    mmap: dict[str, MasteryRecord] = {}
    answers = [
        {"node_id": "L6-t1-B01", "is_correct": False, "difficulty": 2},
        {"node_id": "L6-t1-B02", "is_correct": True, "difficulty": 1},
    ]
    batch_update(mmap, answers, g, (6, 1))
    assert "L6-t1-B01" in mmap
    assert "L6-t1-B02" in mmap
    assert mmap["L6-t1-B01"].mastery_level < 1.0
    assert mmap["L6-t1-B02"].mastery_level >= 1.0  # correct on easy = slight boost or same


def test_get_weak_nodes():
    mmap = {
        "A": MasteryRecord("s1", "A", 0.3),
        "B": MasteryRecord("s1", "B", 0.8),
        "C": MasteryRecord("s1", "C", 0.5),
    }
    weak = get_weak_nodes(mmap, threshold=0.7)
    assert len(weak) == 2
    assert weak[0][1] < weak[1][1]  # sorted ASC
