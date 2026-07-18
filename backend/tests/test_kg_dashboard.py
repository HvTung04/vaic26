"""Tests for dashboard data functions."""

from app.kg.dashboard import priority_queue, gap_radar, need_groups, interventions
from app.kg.models import MasteryRecord


STUDENTS = [
    {"id": "s1", "name": "Minh"},
    {"id": "s2", "name": "Hà"},
    {"id": "s3", "name": "Lan"},
]

MASTERY = {
    "s1": {
        "L6-t1-B01": MasteryRecord("s1", "L6-t1-B01", 0.2),
        "L6-t1-B02": MasteryRecord("s1", "L6-t1-B02", 0.3),
    },
    "s2": {
        "L6-t1-B01": MasteryRecord("s2", "L6-t1-B01", 0.8),
        "L6-t1-B02": MasteryRecord("s2", "L6-t1-B02", 0.9),
    },
    "s3": {
        "L6-t1-B01": MasteryRecord("s3", "L6-t1-B01", 0.4),
        "L6-t1-B02": MasteryRecord("s3", "L6-t1-B02", 0.3),
    },
}


def test_priority_queue_order():
    pq = priority_queue(STUDENTS, MASTERY)
    assert pq[0].student_id == "s1"  # weakest first
    assert pq[-1].student_id == "s2"  # strongest last


def test_priority_queue_urgency():
    pq = priority_queue(STUDENTS, MASTERY)
    assert pq[0].urgency > pq[-1].urgency


def test_gap_radar():
    radar = gap_radar(STUDENTS, MASTERY)
    assert len(radar) >= 1
    # L6-t1-B01 should be in radar (s1 and s3 weak)
    nodes = [g.node_id for g in radar]
    assert "L6-t1-B01" in nodes


def test_need_groups():
    groups = need_groups(STUDENTS, MASTERY)
    # s1 and s3 are both weak on L6-t1-B01 and L6-t1-B02
    assert len(groups) >= 1
    for g in groups:
        assert len(g.student_ids) >= 2


def test_interventions():
    ints = interventions(STUDENTS, MASTERY)
    assert len(ints) >= 1
    types = {i.type for i in ints}
    assert "re-teach" in types or "mini-group" in types or "peer-support" in types


def test_empty_mastery():
    pq = priority_queue(STUDENTS, {})
    assert all(p.urgency == 1.0 for p in pq)  # no data = max urgency
