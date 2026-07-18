"""Orchestrates the 3 "content-generating" agents in API_SPEC.md §E on top of
kg_service (Mongo graph/mastery) + the Postgres repositories. Tagging and
diagnosis are not here — they run inline in content_service / grading_service.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.kg.dashboard import gap_radar, interventions, need_groups, priority_queue
from app.schemas.kg import Graph
from app.services.kg.revision import get_answered_question_ids, select_revision_questions

from app.agents.learning_path_graph import run as run_learning_path_agent
from app.models.test import TestType
from app.repositories import (
    class_repo,
    intervention_repo,
    learning_path_repo,
    question_repo,
    submission_repo,
    test_repo,
)
from app.services import kg_service

_TIER_ORDER = ["foundation", "bridge", "application"]

# kg.learning_path tier names (Vietnamese, LLM- or template-generated) mapped to
# the API's fixed 3-tier enum. Falls back to positional order for names an LLM
# might phrase differently (e.g. it wrote its own tier titles).
_TIER_NAME_TO_API = {
    "bù nền tảng": "foundation",
    "củng cố trung gian": "bridge",
    "luyện ứng dụng": "application",
    "duy trì": "application",
}

_KG_TO_API_INTERVENTION_TYPE = {
    "re-teach": "re_teach",
    "mini-group": "mini_group",
    "peer-support": "peer_support",
}


async def _recent_wrong_nodes(db: AsyncSession, student_id: str, questions_cache: dict) -> list[str]:
    submissions = await submission_repo.list_submissions_for_student(db, student_id)
    if not submissions:
        return []
    latest = submissions[0]
    wrong_ids = [a.question_id for a in latest.answers if a.is_correct is False]
    questions = await question_repo.get_questions(db, wrong_ids)
    return [q.node_id for q in questions]


async def generate_learning_path(
    db: AsyncSession,
    mongo_db: AsyncIOMotorDatabase,
    *,
    student_id: str,
    previous_path_id: str | None,
) -> dict:
    graph = await kg_service.load_graph(mongo_db)
    mastery_map = await kg_service.get_mastery_map(mongo_db, student_id)
    class_ids = await class_repo.list_class_ids_for_student(db, student_id)
    grade = 6
    if class_ids:
        class_group = await class_repo.get_by_id(db, class_ids[0])
        if class_group:
            grade = class_group.grade

    recent_wrong = await _recent_wrong_nodes(db, student_id, {})

    lp = await run_learning_path_agent(
        student_id=student_id,
        grade=grade,
        mastery_map=mastery_map,
        graph=graph,
        recent_wrong=recent_wrong,
    )

    tiers_out = []
    for i, tier in enumerate(lp.tiers):
        recommended = await question_repo.find_for_auto_compose(
            db, node_ids=tier.nodes, count=3, difficulty_mix=None
        )
        api_tier = _TIER_NAME_TO_API.get(tier.name.strip().lower(), _TIER_ORDER[min(i, len(_TIER_ORDER) - 1)])
        tiers_out.append(
            {
                "tier": api_tier,
                "node_ids": tier.nodes,
                "recommended_question_ids": [str(q.id) for q in recommended],
                "rationale": tier.explanation,
            }
        )

    snapshot_id = await kg_service.get_graph_snapshot_id(mongo_db)
    path = await learning_path_repo.create(
        db,
        student_id=student_id,
        tiers=tiers_out,
        graph_snapshot_id=snapshot_id,
        previous_path_id=previous_path_id,
    )
    return {
        "path_id": str(path.id),
        "student_id": student_id,
        "tiers": tiers_out,
        "generated_at": path.generated_at,
        "grounded_on": {"graph_snapshot_id": snapshot_id},
    }


async def generate_revision_test(
    db: AsyncSession,
    mongo_db: AsyncIOMotorDatabase,
    *,
    student_id: str,
    learning_path_id: str,
    teacher_note: str | None,
    question_count: int | None,
) -> dict:
    path = await learning_path_repo.get_by_id(db, learning_path_id)
    mastery_map = await kg_service.get_mastery_map(mongo_db, student_id)

    class_ids = await class_repo.list_class_ids_for_student(db, student_id)
    class_id = class_ids[0] if class_ids else None

    all_questions = await question_repo.find_for_auto_compose(db, node_ids=[], count=10_000)
    # find_for_auto_compose filters by node_id.in_(node_ids); empty list means "any node" here
    bank = [
        {
            "id": str(q.id),
            "knowledge_nodes": [q.node_id],
            "difficulty": {"easy": 1, "medium": 2, "hard": 3}[q.difficulty.value],
        }
        for q in all_questions
    ]

    submissions = await submission_repo.list_submissions_for_student(db, student_id)
    answered_ids = get_answered_question_ids(
        [{"question_id": str(a.question_id)} for s in submissions for a in s.answers]
    )

    max_total = question_count or 10
    revision = select_revision_questions(mastery_map, bank, answered_ids, max_total=max_total)

    test = await test_repo.create_test(
        db,
        title=f"Revision test — {datetime.now(timezone.utc):%Y-%m-%d}",
        class_id=class_id,
        type_=TestType.REVISION,
        created_by=student_id,
        question_ids=[q["id"] for q in revision.questions],
    )
    await test_repo.create_assignments(db, test_id=test.id, student_ids=[student_id], due_at=None)

    return {
        "test_id": str(test.id),
        "student_id": student_id,
        "question_ids": [q["id"] for q in revision.questions],
        "difficulty_mix": revision.difficulty_distribution,
        "target_node_ids": revision.target_nodes,
    }


async def generate_dashboard_insights(db: AsyncSession, mongo_db: AsyncIOMotorDatabase, *, class_id: str) -> dict:
    graph = await kg_service.load_graph(mongo_db)
    students = await class_repo.list_students(db, class_id)
    student_dicts = [{"id": str(s.id), "name": s.full_name} for s in students]
    mastery_data = await kg_service.get_mastery_maps(mongo_db, [s["id"] for s in student_dicts])

    prio = priority_queue(student_dicts, mastery_data)
    groups = need_groups(student_dicts, mastery_data)
    gaps = gap_radar(student_dicts, mastery_data)
    suggested = interventions(student_dicts, mastery_data)

    persisted = await intervention_repo.upsert_suggestions(
        db,
        class_id,
        [
            {
                "type": _KG_TO_API_INTERVENTION_TYPE.get(s.type, "extra_practice"),
                "node_id": s.node_id,
                "target_student_ids": [
                    sid
                    for sid in {sid for g in groups if g.node_id == s.node_id for sid in g.student_ids}
                ],
                "rationale": s.reason,
            }
            for s in suggested
        ],
    )

    return {
        "class_id": class_id,
        "priority_students": [
            {
                "student_id": p.student_id,
                "urgency": round(p.urgency, 3),
                "reason": _priority_reason(p, graph, has_data=bool(mastery_data.get(p.student_id))),
            }
            for p in prio
        ],
        "groups": [
            {"group_id": f"group-{g.node_id}", "node_ids": [g.node_id], "student_ids": g.student_ids}
            for g in groups
        ],
        "class_gap_nodes": [{"node_id": g.node_id, "weak_ratio": round(g.ratio, 3)} for g in gaps],
        "interventions": [
            {
                "id": str(row.id),
                "type": row.type.value,
                "node_id": row.node_id,
                "target_student_ids": row.target_student_ids,
                "rationale": row.rationale,
            }
            for row in persisted
        ],
        "generated_at": datetime.now(timezone.utc),
    }


def _priority_reason(priority, graph: Graph, *, has_data: bool) -> str:
    if not priority.weak_nodes:
        return "Chưa có dữ liệu làm bài" if not has_data else "Ổn định, chưa có node nào yếu"
    names = [graph.nodes[n].topic_name for n in priority.weak_nodes[:2] if n in graph.nodes]
    return f"Yếu ở: {', '.join(names) or ', '.join(priority.weak_nodes[:2])}"
