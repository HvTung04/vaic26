"""Learning path generation: graph state → LLM → explanation + review order.
LLM from start (per user choice). Template fallback on error.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass

from .models import MasteryRecord, LearningPath, LearningTier, Graph
from .mastery import get_weak_nodes
from ingestion.llm_client import structured_completion


_LEARNING_PATH_SYSTEM = (
    "You are a Vietnamese math tutor for a student in grade {grade}.\n"
    "Given the student's knowledge graph state, generate a personalized learning path.\n\n"
    "Rules:\n"
    "- Every recommendation must point to a specific graph node ID.\n"
    "- Never invent knowledge outside the 2018 curriculum.\n"
    "- Low mastery = needs immediate attention.\n"
    "- Output strict JSON with 3 tiers.\n"
    "- Write explanations in Vietnamese.\n"
)

_LEARNING_PATH_SCHEMA = {
    "type": "object",
    "properties": {
        "tiers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "nodes": {"type": "array", "items": {"type": "string"}},
                    "explanation": {"type": "string"},
                },
                "required": ["name", "nodes", "explanation"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["tiers"],
    "additionalProperties": False,
}


def _build_mastery_summary(
    mastery_map: dict[str, MasteryRecord],
    graph: Graph,
) -> str:
    """Build a compact text summary of mastery state for the LLM prompt."""
    lines: list[str] = []
    for nid, rec in sorted(mastery_map.items(), key=lambda x: x[1].mastery_level):
        node = graph.nodes.get(nid)
        if not node:
            continue
        status = "YẾU" if rec.mastery_level < 0.5 else "OK" if rec.mastery_level >= 0.8 else "TRUNG BÌNH"
        lines.append(
            f"- {nid} ({node.topic_name}): {rec.mastery_level:.2f} [{status}] "
            f"| đã trả lời {rec.answer_count} câu"
        )
    return "\n".join(lines)


def generate_learning_path(
    student_id: str,
    mastery_map: dict[str, MasteryRecord],
    graph: Graph,
    grade: int = 7,
    recent_wrong: list[str] | None = None,
) -> LearningPath:
    """Generate learning path via LLM. Falls back to template on error."""
    try:
        return _llm_path(student_id, mastery_map, graph, grade, recent_wrong)
    except Exception:
        return _template_path(student_id, mastery_map, graph)


def _llm_path(
    student_id: str,
    mastery_map: dict[str, MasteryRecord],
    graph: Graph,
    grade: int,
    recent_wrong: list[str] | None,
) -> LearningPath:
    """LLM-generated learning path."""
    mastery_text = _build_mastery_summary(mastery_map, graph)
    weak = get_weak_nodes(mastery_map, threshold=0.7)
    weak_text = ", ".join(f"{nid} ({m:.2f})" for nid, m in weak[:5]) or "không có"

    wrong_text = ""
    if recent_wrong:
        wrong_text = f"\nSai trong bài gần nhất: {', '.join(recent_wrong[:5])}"

    user_msg = (
        f"Học sinh: {student_id}, lớp {grade}\n\n"
        f"TRẠNG THÁI MASTERY:\n{mastery_text}\n\n"
        f"NODE YẾU (mastery < 0.7): {weak_text}{wrong_text}\n\n"
        f"Sinh lộ trình học 3 tầng:\n"
        f"1. Bù nền tảng: node gốc cần vá trước\n"
        f"2. Củng cố trung gian: node cầu nối\n"
        f"3. Luyện ứng dụng: bài tập mục tiêu"
    )

    system = _LEARNING_PATH_SYSTEM.format(grade=grade)
    data = structured_completion(
        system=system,
        user=user_msg,
        json_schema=_LEARNING_PATH_SCHEMA,
        schema_name="LearningPath",
    )

    tiers = []
    for t in data.get("tiers", []):
        tiers.append(LearningTier(
            name=t["name"],
            nodes=t["nodes"],
            explanation=t["explanation"],
        ))

    return LearningPath(
        student_id=student_id,
        tiers=tiers,
        raw_text=json.dumps(data, ensure_ascii=False),
    )


def _template_path(
    student_id: str,
    mastery_map: dict[str, MasteryRecord],
    graph: Graph,
) -> LearningPath:
    """Template fallback: rule-based, no LLM."""
    weak = get_weak_nodes(mastery_map, threshold=0.7)
    very_weak = [(n, m) for n, m in weak if m < 0.5]
    medium_weak = [(n, m) for n, m in weak if 0.5 <= m < 0.7]

    tiers = []

    # Tier 1: fix foundations
    if very_weak:
        nodes = [n for n, _ in very_weak[:3]]
        explanations = []
        for n, m in very_weak[:3]:
            node = graph.nodes.get(n)
            name = node.topic_name if node else n
            explanations.append(f"{n} ({name}): mastery {m:.2f} — cần ôn lại ngay")
        tiers.append(LearningTier(
            name="Bù nền tảng",
            nodes=nodes,
            explanation="; ".join(explanations),
        ))

    # Tier 2: bridge
    if medium_weak:
        nodes = [n for n, _ in medium_weak[:3]]
        tiers.append(LearningTier(
            name="Củng cố trung gian",
            nodes=nodes,
            explanation=f"Các node trung bình: {', '.join(nodes)}",
        ))

    # Tier 3: practice
    ok_nodes = [nid for nid, rec in mastery_map.items() if rec.mastery_level >= 0.8]
    if ok_nodes:
        tiers.append(LearningTier(
            name="Luyện ứng dụng",
            nodes=ok_nodes[:5],
            explanation="Ôn tập nâng cao các node đã nắm vững",
        ))

    if not tiers:
        tiers.append(LearningTier(
            name="Duy trì",
            nodes=[],
            explanation="Học sinh đang ổn, tiếp tục duy trì",
        ))

    return LearningPath(student_id=student_id, tiers=tiers)
