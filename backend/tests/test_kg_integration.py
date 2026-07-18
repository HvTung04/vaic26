"""End-to-end integration test: full Role 2 pipeline with real curriculum graph.

Simulates: student answers exam → mastery update → root-cause → revision → dashboard.
"""

import os
import json

from app.kg.graph import load_graph
from app.kg.mastery import batch_update, get_weak_nodes
from app.kg.root_cause import diagnose_all_wrong
from app.kg.revision import select_revision_questions
from app.kg.learning_path import _template_path
from app.kg.dashboard import priority_queue, gap_radar, interventions
from app.kg.client import save_mastery, load_mastery
from app.kg.models import MasteryRecord


# --- Setup ---
GRAPH = load_graph()

STUDENTS = [
    {"id": "s1", "name": "Minh"},
    {"id": "s2", "name": "Hà"},
    {"id": "s3", "name": "Lan"},
]

# Simulated exam answers: some correct, some wrong
# Multiple wrong answers per node to drive mastery down (realistic)
EXAM_ANSWERS = {
    "s1": [
        {"node_id": "L6-t1-B01", "is_correct": False, "difficulty": 2},
        {"node_id": "L6-t1-B01", "is_correct": False, "difficulty": 3},
        {"node_id": "L6-t1-B01", "is_correct": False, "difficulty": 2},
        {"node_id": "L6-t1-B02", "is_correct": False, "difficulty": 1},
        {"node_id": "L6-t1-B02", "is_correct": False, "difficulty": 2},
        {"node_id": "L6-t3-B01", "is_correct": True, "difficulty": 2},
        {"node_id": "L6-t3-B01", "is_correct": True, "difficulty": 1},
        {"node_id": "L7-t5-B02", "is_correct": False, "difficulty": 2},
        {"node_id": "L7-t5-B02", "is_correct": False, "difficulty": 2},
    ],
    "s2": [
        {"node_id": "L6-t1-B01", "is_correct": True, "difficulty": 2},
        {"node_id": "L6-t1-B02", "is_correct": True, "difficulty": 1},
        {"node_id": "L6-t3-B01", "is_correct": True, "difficulty": 2},
        {"node_id": "L7-t5-B02", "is_correct": True, "difficulty": 2},
    ],
    "s3": [
        {"node_id": "L6-t1-B01", "is_correct": False, "difficulty": 3},
        {"node_id": "L6-t1-B01", "is_correct": False, "difficulty": 2},
        {"node_id": "L6-t1-B01", "is_correct": False, "difficulty": 3},
        {"node_id": "L6-t1-B02", "is_correct": False, "difficulty": 2},
        {"node_id": "L6-t1-B02", "is_correct": False, "difficulty": 2},
        {"node_id": "L6-t3-B01", "is_correct": False, "difficulty": 1},
        {"node_id": "L6-t3-B01", "is_correct": False, "difficulty": 2},
        {"node_id": "L7-t5-B02", "is_correct": True, "difficulty": 2},
    ],
}


def test_full_pipeline(tmp_path):
    """Simulate full exam → mastery → diagnose → revision → dashboard flow."""

    # 1. Update mastery for all students
    all_mastery: dict[str, dict[str, MasteryRecord]] = {}
    for sid, answers in EXAM_ANSWERS.items():
        mmap: dict[str, MasteryRecord] = {}
        batch_update(mmap, answers, GRAPH, current_unit=(6, 1))
        all_mastery[sid] = mmap

    # 2. Verify mastery decreased for wrong answers
    s1_m = all_mastery["s1"]
    assert s1_m["L6-t1-B01"].mastery_level < 1.0  # wrong on this
    assert s1_m["L6-t3-B01"].mastery_level >= 1.0  # correct

    # 3. Root-cause diagnosis for weakest student (s3)
    s3_wrong = [
        {"node_id": a["node_id"]}
        for a in EXAM_ANSWERS["s3"]
        if not a["is_correct"]
    ]
    diagnoses = diagnose_all_wrong(s3_wrong, all_mastery["s3"], GRAPH)
    assert len(diagnoses) >= 1
    # Should identify a root cause with reasonable confidence
    assert any(rc.confidence > 0.3 for rc in diagnoses)

    # 4. Revision test for weakest student
    bank = [
        {"id": f"q{i}", "knowledge_nodes": [nid], "difficulty": d}
        for nid in ["L6-t1-B01", "L6-t1-B02", "L6-t3-B01", "L7-t5-B02"]
        for i, d in enumerate([1, 2, 3], start=1)
    ]
    rt = select_revision_questions(all_mastery["s3"], bank, max_nodes=2)
    assert len(rt.target_nodes) >= 1
    assert len(rt.questions) >= 1

    # 5. Learning path (template) for weakest student
    lp = _template_path("s3", all_mastery["s3"], GRAPH)
    assert len(lp.tiers) >= 1
    assert lp.tiers[0].name == "Bù nền tảng"

    # 6. Dashboard: priority queue
    pq = priority_queue(STUDENTS, all_mastery)
    assert pq[0].student_id == "s3"  # weakest first
    assert pq[-1].student_id == "s2"  # strongest last

    # 7. Dashboard: gap radar
    radar = gap_radar(STUDENTS, all_mastery)
    assert len(radar) >= 1
    assert radar[0].weak_count >= 1

    # 8. Dashboard: interventions
    ints = interventions(STUDENTS, all_mastery)
    assert len(ints) >= 1

    # 9. Save/load mastery roundtrip
    save_mastery("s3", all_mastery["s3"])
    loaded = load_mastery("s3")
    assert len(loaded) > 0
    for nid in all_mastery["s3"]:
        assert nid in loaded
        assert abs(loaded[nid].mastery_level - all_mastery["s3"][nid].mastery_level) < 0.01

    print("\n=== END-TO-END INTEGRATION PASSED ===")
    print(f"Students: {len(STUDENTS)}")
    print(f"Graph nodes: {len(GRAPH.nodes)}")
    print(f"Mastery records per student: {len(all_mastery['s3'])}")
    print(f"Root causes found: {len(diagnoses)}")
    print(f"Revision questions: {len(rt.questions)}")
    print(f"Learning path tiers: {len(lp.tiers)}")
    print(f"Priority queue: {[p.student_name for p in pq]}")
    print(f"Gap radar entries: {len(radar)}")
    print(f"Interventions: {[i.type for i in ints]}")
