"""Dashboard data: priority queue, gap radar, need-based groups, interventions.
All deterministic — no LLM, no API calls. Pure data aggregation.
"""

from __future__ import annotations

from collections import defaultdict

from .models import (
    MasteryRecord,
    DashboardPriority,
    GapRadar,
    NeedGroup,
    Intervention,
)


def priority_queue(
    students: list[dict],
    mastery_data: dict[str, dict[str, MasteryRecord]],
) -> list[DashboardPriority]:
    """Students sorted by urgency = sum(1 - mastery) across all nodes.

    Args:
        students: [{"id": str, "name": str}]
        mastery_data: {student_id: {node_id: MasteryRecord}}
    """
    result = []
    for s in students:
        sid = s["id"]
        mastery = mastery_data.get(sid, {})
        if not mastery:
            urgency = 1.0  # no data = highest urgency
            weak = []
        else:
            total_weakness = sum(1.0 - rec.mastery_level for rec in mastery.values())
            urgency = total_weakness / max(len(mastery), 1)
            weak = [nid for nid, rec in mastery.items() if rec.mastery_level < 0.5]

        result.append(DashboardPriority(
            student_id=sid,
            student_name=s.get("name", sid),
            urgency=urgency,
            weak_nodes=weak,
        ))

    return sorted(result, key=lambda x: -x.urgency)


def gap_radar(
    students: list[dict],
    mastery_data: dict[str, dict[str, MasteryRecord]],
) -> list[GapRadar]:
    """Per node: how many students are weak (mastery < 0.5)."""
    node_counts: dict[str, int] = defaultdict(int)
    total = len(students)

    for s in students:
        sid = s["id"]
        mastery = mastery_data.get(sid, {})
        for nid, rec in mastery.items():
            if rec.mastery_level < 0.5:
                node_counts[nid] += 1

    return [
        GapRadar(node_id=n, weak_count=c, total=total, ratio=c / max(total, 1))
        for n, c in sorted(node_counts.items(), key=lambda x: -x[1])
    ]


def need_groups(
    students: list[dict],
    mastery_data: dict[str, dict[str, MasteryRecord]],
) -> list[NeedGroup]:
    """Cluster students by shared weak nodes (groups of 2+)."""
    node_to_students: dict[str, list[str]] = defaultdict(list)

    for s in students:
        sid = s["id"]
        mastery = mastery_data.get(sid, {})
        for nid, rec in mastery.items():
            if rec.mastery_level < 0.5:
                node_to_students[nid].append(sid)

    return [
        NeedGroup(node_id=n, student_ids=ids)
        for n, ids in node_to_students.items()
        if len(ids) >= 2
    ]


def interventions(
    students: list[dict],
    mastery_data: dict[str, dict[str, MasteryRecord]],
) -> list[Intervention]:
    """Suggest actions based on gap patterns."""
    gaps = gap_radar(students, mastery_data)
    total = len(students)
    suggestions: list[Intervention] = []

    for g in gaps:
        if g.ratio > 0.6:
            suggestions.append(Intervention(
                type="re-teach",
                node_id=g.node_id,
                reason=f"{g.weak_count}/{g.total} yếu — cần dạy lại cả lớp",
            ))
        elif g.ratio > 0.3:
            suggestions.append(Intervention(
                type="mini-group",
                node_id=g.node_id,
                reason=f"{g.weak_count} học sinh cần hỗ trợ — nhóm nhỏ",
            ))
        else:
            suggestions.append(Intervention(
                type="peer-support",
                node_id=g.node_id,
                reason=f"Ít học sinh yếu ({g.weak_count}) — hỗ trợ bạn bè",
            ))

    return suggestions
