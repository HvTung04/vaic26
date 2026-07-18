"""Mô phỏng 4 học sinh làm đề gk1_8 -> cập nhật graph -> xuất báo cáo cho giáo viên.

- Đề lấy từ gk1_8_result.json (output của splitter/tagger). Đề chưa có đáp án đúng
  nên test tự GÁN NGẪU NHIÊN correct_answer (seeded) — sẽ thay bằng đáp án thật sau.
- Mỗi học sinh có "năng lực thật" khác nhau; trả lời đúng/sai được random theo năng
  lực và độ khó (seeded => test tái lập được).
- Chạy engine deterministic trong diagnosis/mastery.py rồi kiểm tra graph cập nhật
  hợp lý + dump JSON báo cáo (mastery từng node, root-cause, class gap radar).

Test này KHÔNG gọi LLM -> chạy miễn phí, ổn định.
"""

from __future__ import annotations

import json
import os
import random
from pathlib import Path

from diagnosis.learning_path import format_learning_path, learning_path
from diagnosis.mastery import (
    MASTERY_THRESHOLD,
    StudentGraph,
    class_gap_radar,
    prerequisites,
)

SEED = 2026
OPTION_KEYS = ["A", "B", "C", "D"]

# Đề rút gọn từ gk1_8_result.json (node + độ khó là đủ để mô phỏng mastery).
# Dùng file thật nếu có, để bám sát output splitter/tagger.
_FALLBACK_EXAM = [
    {"index": 1, "knowledge_nodes": ["L7-t3-B01"], "difficulty": 2},
    {"index": 2, "knowledge_nodes": ["L7-t3-B01"], "difficulty": 2},
    {"index": 3, "knowledge_nodes": ["L7-t3-B01"], "difficulty": 2},
    {"index": 4, "knowledge_nodes": ["L8-t1-B02"], "difficulty": 2},
    {"index": 5, "knowledge_nodes": ["L8-t7-B01"], "difficulty": 2},
    {"index": 6, "knowledge_nodes": ["L6-t2-B02"], "difficulty": 1},
    {"index": 7, "knowledge_nodes": ["L8-t7-B01"], "difficulty": 2},
    {"index": 8, "knowledge_nodes": ["L8-t1-B02"], "difficulty": 3},
    {"index": 9, "knowledge_nodes": ["L8-t4-B01"], "difficulty": 1},
    {"index": 10, "knowledge_nodes": ["L8-t5-B01"], "difficulty": 2},
    {"index": 11, "knowledge_nodes": ["L8-t2-B01"], "difficulty": 2},
    {"index": 12, "knowledge_nodes": ["L8-t7-B01"], "difficulty": 2},
]

# Năng lực thật: xác suất nền làm đúng 1 câu (giỏi -> yếu).
STUDENTS = [
    {"name": "An (giỏi)", "ability": 0.92},
    {"name": "Bình (khá)", "ability": 0.72},
    {"name": "Chi (trung bình)", "ability": 0.52},
    {"name": "Dũng (yếu)", "ability": 0.30},
]


def _load_exam() -> list[dict]:
    path = Path(
        os.environ.get("GAPLENS_QUESTIONS_JSON", "/home/vunv/ai_annotation/gk1_8_result.json")
    )
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        return [
            {
                "index": q["index"],
                "knowledge_nodes": q.get("knowledge_nodes", []),
                "difficulty": q.get("difficulty") or 2,
            }
            for q in data["questions"]
            if q.get("knowledge_nodes")
        ]
    return _FALLBACK_EXAM


def _assign_answer_keys(exam: list[dict], rng: random.Random) -> None:
    """Đề chưa có đáp án -> gán ngẫu nhiên (kệ, thay sau)."""
    for q in exam:
        q["correct_answer"] = rng.choice(OPTION_KEYS)


def _simulate_student(exam: list[dict], ability: float, rng: random.Random) -> tuple[StudentGraph, list[dict]]:
    """Random đáp án của học sinh + random câu sai theo năng lực & độ khó."""
    g = StudentGraph(student_id="s")
    answers = []
    for q in exam:
        d = q["difficulty"]
        p_correct = max(0.05, min(0.98, ability - 0.12 * (d - 1)))  # câu khó -> khó đúng hơn
        correct = rng.random() < p_correct
        if correct:
            chosen = q["correct_answer"]
        else:
            wrong = [k for k in OPTION_KEYS if k != q["correct_answer"]]
            chosen = rng.choice(wrong)
        time_sec = round(rng.uniform(2.0, 20.0), 1)  # thời gian làm mỗi câu: 2-20s
        g.record_answer(q["knowledge_nodes"], d, correct, time_sec=time_sec)
        answers.append(
            {"index": q["index"], "chosen": chosen, "correct": correct, "time_sec": time_sec}
        )
    return g, answers


def _build_report():
    exam = _load_exam()
    rng = random.Random(SEED)
    _assign_answer_keys(exam, rng)

    graphs: list[StudentGraph] = []
    students_out = []
    for i, s in enumerate(STUDENTS):
        srng = random.Random(SEED + 1 + i)
        g, answers = _simulate_student(exam, s["ability"], srng)
        graphs.append(g)
        n_correct = sum(a["correct"] for a in answers)
        total_time = round(sum(a["time_sec"] for a in answers), 1)
        students_out.append({
            "name": s["name"],
            "true_ability": s["ability"],
            "summary": {
                "answered": len(answers),
                "correct": n_correct,
                "accuracy": round(n_correct / len(answers), 3),
                "total_time_sec": total_time,
                "avg_time_sec": round(total_time / len(answers), 1),
            },
            "mastery": g.snapshot(),
            "root_cause_suspects": g.root_causes(),
            "recommended_review": g.recommended_review(),
            "learning_path": learning_path(g),
            "answers": answers,
        })

    report = {
        "source": "gk1_8_result.json (đáp án đúng: random tạm thời)",
        "num_questions": len(exam),
        "num_students": len(STUDENTS),
        "class_gap_radar": class_gap_radar(graphs),
        "students": students_out,
    }
    return report, graphs


def test_simulation_and_graph_update():
    report, graphs = _build_report()

    # 1) mastery luôn hợp lệ trong (0,1); BẤT BIẾN: chỉ node ĐƯỢC LÀM TRỰC TIẾP mới có
    #    bằng chứng (update không đụng cạnh) -> evidence>0  <=>  attempts>0
    for g in graphs:
        for st in g.states.values():
            assert 0.0 < st.mastery < 1.0
            assert (st.evidence > 0) == (st.attempts > 0)
    # node học sinh làm trực tiếp phải có thời gian trung bình trong khoảng 2-20s/câu
    for stu in report["students"]:
        for row in stu["mastery"]:
            if row["attempts"] > 0 and row["avg_time_sec"] is not None:
                assert 2.0 <= row["avg_time_sec"] <= 20.0

    # 2) học sinh giỏi có mastery trung bình cao hơn học sinh yếu (công thức phân biệt được)
    def avg_mastery(g):
        vals = [st.mastery for st in g.states.values() if st.attempts > 0]
        return sum(vals) / len(vals)

    assert avg_mastery(graphs[0]) > avg_mastery(graphs[-1])

    # 3) học sinh yếu có nhiều node 'gap' hơn (hoặc bằng) học sinh giỏi
    def n_gap(g):
        return sum(1 for st in g.states.values() if st.attempts > 0 and st.status == "gap")

    assert n_gap(graphs[-1]) >= n_gap(graphs[0])

    # 4) root-cause phải trỏ tới node TIÊN QUYẾT hợp lệ của node bị sai
    for stu in report["students"]:
        for rc in stu["root_cause_suspects"]:
            preqs = {p for p, _ in prerequisites(rc["failed_node"])}
            assert rc["suspect_prereq"] in preqs
            assert 0.0 < rc["confidence"] <= 1.0

    # 5) class gap radar: không rỗng và sắp xếp tăng dần theo class_mastery
    radar = report["class_gap_radar"]
    assert radar
    assert all(radar[i]["class_mastery"] <= radar[i + 1]["class_mastery"] for i in range(len(radar) - 1))

    # 6) học sinh yếu nên có ít nhất một nghi vấn root-cause
    assert report["students"][-1]["root_cause_suspects"]


def test_learning_path_offline():
    """Trace learning path 3 tầng cho từng học sinh (offline) và kiểm tra tính hợp lệ."""
    report, graphs = _build_report()
    for g, stu in zip(graphs, report["students"]):
        path = learning_path(g)
        rows = {r["node"]: r for t in path["tiers"] for r in t["nodes"]}
        tier_of = {r["node"]: t["tier"] for t in path["tiers"] for r in t["nodes"]}

        # node observed = đã test & yếu; node inferred = chưa test (cần kiểm tra), không có bằng chứng
        for node, r in rows.items():
            if r["basis"] == "observed":
                assert g.states[node].evidence > 0 and g.states[node].mastery < MASTERY_THRESHOLD
                assert r["mastery"] is not None
            else:
                assert r["basis"] == "inferred" and r["needs_check"] is True
                assert r["mastery"] is None
                st = g.states.get(node)
                assert st is None or st.evidence == 0  # KHÔNG bị update đụng vào

        # ordered_sequence = đúng tập node của 3 tầng, và nền tảng (tầng 1) đứng trước ứng dụng (tầng 3)
        seq = path["ordered_sequence"]
        assert set(seq) == set(tier_of)
        pos = {n: i for i, n in enumerate(seq)}
        for n, t in tier_of.items():
            for m, t2 in tier_of.items():
                if t < t2:
                    assert pos[n] < pos[m]  # tầng thấp luôn nằm trước tầng cao

        # mỗi 'blocked_by' phải là node tiên quyết yếu, ở tầng <= node (được vá trước/cùng lúc)
        for t in path["tiers"]:
            for r in t["nodes"]:
                for b in r["blocked_by"]:
                    assert b in tier_of and tier_of[b] <= t["tier"]

    # học sinh yếu nhất phải có lộ trình không rỗng
    assert learning_path(graphs[-1])["ordered_sequence"]


def test_export_report_json():
    report, _ = _build_report()
    out = Path(os.environ.get("GAPLENS_MASTERY_OUT", "/home/vunv/ai_annotation/gk1_8_mastery_result.json"))
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    assert out.exists()
    # in tóm tắt cho giáo viên khi chạy -s
    print(f"\n[report] -> {out}")
    print("Class Gap Radar (yếu nhất trước):")
    for r in report["class_gap_radar"][:5]:
        print(f"  {r['node']} (lớp {r['grade']}, {r['topic']}): "
              f"lớp {r['class_mastery']:.0%}, {r['students_struggling']}/{r['students_assessed']} em yếu")
    print("\n" + "=" * 70)
    print("LEARNING PATH TỪNG HỌC SINH (offline, không mạng/không LLM)")
    print("=" * 70)
    for stu in report["students"]:
        print(f"\n{stu['name']}: đúng {stu['summary']['correct']}/{stu['summary']['answered']} "
              f"({stu['summary']['accuracy']:.0%}), TB {stu['summary']['avg_time_sec']}s/câu")
        for rc in stu["root_cause_suspects"][:3]:
            print(f"  ROOT-CAUSE: {rc['suspect_prereq']} (lớp {rc['suspect_grade']}) "
                  f"conf={rc['confidence']} — {rc['reason']}")
        print(format_learning_path(stu["learning_path"], name=stu["name"]))
