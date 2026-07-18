from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from kg.dashboard import gap_radar, need_groups, priority_queue

from app.api.deps import MongoDB
from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.repositories import class_repo, intervention_repo, question_repo, submission_repo, test_repo
from app.schemas.dashboard import (
    ApplyInterventionRequest,
    ApplyInterventionResponse,
    ClassProgressPoint,
    ClassProgressTimelineResponse,
    ClassResultsResponse,
    GapRadarItem,
    GapRadarResponse,
    GroupItem,
    GroupsResponse,
    InterventionItem,
    InterventionsResponse,
    NodeAccuracy,
    PriorityQueueItem,
    PriorityQueueResponse,
    ScoreDistributionBucket,
    StudentResultRow,
    StudentResultsResponse,
)
from app.services import kg_service, results_service

router = APIRouter(prefix="/teacher", tags=["teacher-dashboard"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def _students_and_mastery(db: DbSession, mongo_db: MongoDB, class_id: str):
    students = await class_repo.list_students(db, class_id)
    student_dicts = [{"id": str(s.id), "name": s.full_name} for s in students]
    mastery_data = await kg_service.get_mastery_maps(mongo_db, [s["id"] for s in student_dicts])
    return student_dicts, mastery_data


@router.get("/classes/{class_id}/priority-queue", response_model=PriorityQueueResponse)
async def get_priority_queue(
    class_id: str, current_user: CurrentUser, db: DbSession, mongo_db: MongoDB
) -> PriorityQueueResponse:
    student_dicts, mastery_data = await _students_and_mastery(db, mongo_db, class_id)
    prio = priority_queue(student_dicts, mastery_data)
    names = {s["id"]: s["name"] for s in student_dicts}
    return PriorityQueueResponse(
        items=[
            PriorityQueueItem(
                student_id=p.student_id,
                full_name=names.get(p.student_id, p.student_id),
                urgency=round(p.urgency, 3),
                reason=(
                    f"{len(p.weak_nodes)} node yếu"
                    if p.weak_nodes
                    else ("Chưa có dữ liệu" if not mastery_data.get(p.student_id) else "Ổn định")
                ),
                weak_node_ids=p.weak_nodes,
            )
            for p in prio
        ]
    )


@router.get("/classes/{class_id}/groups", response_model=GroupsResponse)
async def get_groups(class_id: str, current_user: CurrentUser, db: DbSession, mongo_db: MongoDB) -> GroupsResponse:
    student_dicts, mastery_data = await _students_and_mastery(db, mongo_db, class_id)
    groups = need_groups(student_dicts, mastery_data)
    graph = await kg_service.load_graph(mongo_db)
    return GroupsResponse(
        items=[
            GroupItem(
                group_id=f"group-{g.node_id}",
                node_ids=[g.node_id],
                node_names=[graph.nodes[g.node_id].topic_name] if g.node_id in graph.nodes else [g.node_id],
                student_ids=g.student_ids,
            )
            for g in groups
        ]
    )


@router.get("/classes/{class_id}/gap-radar", response_model=GapRadarResponse)
async def get_gap_radar(class_id: str, current_user: CurrentUser, db: DbSession, mongo_db: MongoDB) -> GapRadarResponse:
    student_dicts, mastery_data = await _students_and_mastery(db, mongo_db, class_id)
    gaps = gap_radar(student_dicts, mastery_data)
    graph = await kg_service.load_graph(mongo_db)

    def avg_mastery(node_id: str) -> float:
        levels = [m[node_id].mastery_level for m in mastery_data.values() if node_id in m]
        return sum(levels) / len(levels) if levels else 1.0

    return GapRadarResponse(
        items=[
            GapRadarItem(
                node_id=g.node_id,
                node_name=graph.nodes[g.node_id].topic_name if g.node_id in graph.nodes else g.node_id,
                weak_ratio=round(g.ratio, 3),
                avg_mastery=round(avg_mastery(g.node_id), 3),
            )
            for g in gaps
        ]
    )


@router.get("/classes/{class_id}/interventions", response_model=InterventionsResponse)
async def get_interventions(class_id: str, current_user: CurrentUser, db: DbSession) -> InterventionsResponse:
    rows = await intervention_repo.list_by_class(db, class_id)
    return InterventionsResponse(
        items=[
            InterventionItem(
                id=str(r.id),
                type=r.type,
                node_id=r.node_id,
                target_student_ids=r.target_student_ids,
                rationale=r.rationale,
                status=r.status,
            )
            for r in rows
        ]
    )


@router.post("/interventions/{intervention_id}/apply", response_model=ApplyInterventionResponse)
async def apply_intervention(
    intervention_id: str, payload: ApplyInterventionRequest, current_user: CurrentUser, db: DbSession
) -> ApplyInterventionResponse:
    row = await intervention_repo.get_by_id(db, intervention_id)
    if row is None:
        raise api_error(404, "not_found", "Intervention not found")
    row = await intervention_repo.apply(db, row, payload.note)
    return ApplyInterventionResponse(id=str(row.id), applied_at=row.applied_at)


@router.get("/classes/{class_id}/results", response_model=ClassResultsResponse)
async def get_class_results(
    class_id: str, current_user: CurrentUser, db: DbSession, test_id: Annotated[str, Query()]
) -> ClassResultsResponse:
    test = await test_repo.get_test(db, test_id)
    if test is None:
        raise api_error(404, "not_found", "Test not found")

    all_submissions = await submission_repo.list_submissions_for_test(db, test_id)
    # A student may retake a test (e.g. a revision loop); keep only their most
    # recent submission so results/averages reflect current standing, not history.
    latest_by_student: dict[str, object] = {}
    for s in sorted(all_submissions, key=lambda s: s.submitted_at):
        latest_by_student[str(s.student_id)] = s
    submissions = list(latest_by_student.values())
    graded = [s for s in submissions if s.status.value == "graded"]

    class_avg = sum((s.score or 0) / (s.total or 1) * 100 for s in graded) / len(graded) if graded else 0.0

    buckets = {"0-49": 0, "50-69": 0, "70-89": 0, "90-100": 0}
    for s in graded:
        pct = (s.score or 0) / (s.total or 1) * 100
        if pct < 50:
            buckets["0-49"] += 1
        elif pct < 70:
            buckets["50-69"] += 1
        elif pct < 90:
            buckets["70-89"] += 1
        else:
            buckets["90-100"] += 1

    node_stats: dict[str, list[int]] = {}
    questions = await question_repo.get_questions(db, [tq.question_id for tq in test.questions])
    node_by_question = {str(q.id): q.node_id for q in questions}
    for s in graded:
        for a in s.answers:
            node_id = node_by_question.get(str(a.question_id))
            if not node_id:
                continue
            node_stats.setdefault(node_id, []).append(int(bool(a.is_correct)))

    roster = await class_repo.list_students(db, test.class_id)
    rows = [
        StudentResultRow(
            student_id=str(student.id),
            full_name=student.full_name,
            score=(
                (latest_by_student[str(student.id)].score or 0) / (latest_by_student[str(student.id)].total or 1)
                * 100
                if str(student.id) in latest_by_student and latest_by_student[str(student.id)].status.value == "graded"
                else None
            ),
            status="submitted" if str(student.id) in latest_by_student else "pending",
            submission_id=(
                str(latest_by_student[str(student.id)].id) if str(student.id) in latest_by_student else None
            ),
        )
        for student in roster
    ]

    return ClassResultsResponse(
        test_id=test_id,
        test_title=test.title,
        class_avg_score=round(class_avg, 2),
        distribution=[ScoreDistributionBucket(score_range=k, count=v) for k, v in buckets.items()],
        per_node_accuracy=[
            NodeAccuracy(node_id=n, accuracy=round(sum(v) / len(v), 3)) for n, v in node_stats.items()
        ],
        students=rows,
    )


@router.get("/students/{student_id}/results", response_model=StudentResultsResponse)
async def get_student_results(student_id: str, current_user: CurrentUser, db: DbSession) -> StudentResultsResponse:
    return await results_service.get_student_results(db, student_id)


@router.get("/classes/{class_id}/progress-timeline", response_model=ClassProgressTimelineResponse)
async def get_class_progress_timeline(
    class_id: str,
    current_user: CurrentUser,
    db: DbSession,
    range: Annotated[str, Query()] = "weekly",  # noqa: A002 - matches API_SPEC.md query param name
) -> ClassProgressTimelineResponse:
    students = await class_repo.list_students(db, class_id)
    buckets: dict[str, dict] = {}
    for student in students:
        submissions = await submission_repo.list_submissions_for_student(db, student.id)
        for s in submissions:
            if s.status.value != "graded" or s.graded_at is None:
                continue
            period = s.graded_at.strftime("%Y-W%W") if range == "weekly" else s.graded_at.strftime("%Y-%m")
            bucket = buckets.setdefault(period, {"scores": [], "students": set(), "tests": 0})
            bucket["scores"].append((s.score or 0) / (s.total or 1))
            bucket["students"].add(str(student.id))
            bucket["tests"] += 1

    timeline = [
        ClassProgressPoint(
            period=period,
            avg_mastery=round(sum(b["scores"]) / len(b["scores"]), 3) if b["scores"] else 0.0,
            tests_completed=b["tests"],
            students_improved=len(b["students"]),
        )
        for period, b in sorted(buckets.items())
    ]
    return ClassProgressTimelineResponse(class_id=class_id, timeline=timeline)
