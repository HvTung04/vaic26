"""Tests for root-cause diagnosis."""

from app.services.kg.root_cause import diagnose_root_cause, diagnose_all_wrong
from app.schemas.kg import MasteryRecord, RootCause
from app.repositories.graph_repo import load_graph


def test_diagnose_weak_parent():
    g = load_graph()
    # Student weak on L6-t1-B01 (parent of L6-t1-B02)
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.2),  # very weak
        "L6-t1-B02": MasteryRecord("s1", "L6-t1-B02", 0.9),  # strong
    }
    rc = diagnose_root_cause("L6-t1-B02", mmap, g)
    assert rc.root_cause_node == "L6-t1-B01"
    assert rc.confidence > 0.4


def test_diagnose_all_strong():
    g = load_graph()
    # Student strong everywhere — no root cause
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.95),
        "L6-t1-B02": MasteryRecord("s1", "L6-t1-B02", 0.95),
    }
    rc = diagnose_root_cause("L6-t1-B02", mmap, g)
    # Either root_cause is None or confidence is low
    assert rc.confidence < 0.5 or rc.root_cause_node is None


def test_diagnose_no_data():
    g = load_graph()
    # No mastery data — should return low confidence
    rc = diagnose_root_cause("L6-t1-B02", {}, g)
    assert rc.confidence == 0.0


def test_diagnose_chain_length():
    g = load_graph()
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.1),
    }
    rc = diagnose_root_cause("L6-t1-B02", mmap, g)
    assert len(rc.chain) >= 2  # at least question -> parent


def test_diagnose_all_wrong():
    g = load_graph()
    mmap = {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.2),
    }
    wrong = [{"node_id": "L6-t1-B02"}, {"node_id": "L6-t1-B03"}]
    results = diagnose_all_wrong(wrong, mmap, g)
    assert len(results) >= 1  # may deduplicate
