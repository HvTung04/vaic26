from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.kg.dashboard import gap_radar, need_groups, priority_queue

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
    HeatmapCell,
    HeatmapResponse,
    HeatmapStudentRowBE,
    HeatmapTopicBE,
    InterventionItem,
    InterventionsResponse,
    NodeAccuracy,
    PriorityQueueItem,
    PriorityQueueResponse,
    ScoreDistributionBucket,
    ScheduleDatesResponse,
    ScheduleEvent,
    ScheduleResponse,
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


@router.get("/classes/{class_id}/heatmap", response_model=HeatmapResponse)
async def get_heatmap(
    class_id: str, current_user: CurrentUser, db: DbSession, mongo_db: MongoDB
) -> HeatmapResponse:
    """Per-student per-node mastery heatmap for the class."""
    student_dicts, mastery_data = await _students_and_mastery(db, mongo_db, class_id)
    graph = await kg_service.load_graph(mongo_db)

    # Collect all node IDs that appear in any student's mastery data
    all_node_ids: set[str] = set()
    for mastery in mastery_data.values():
        all_node_ids.update(mastery.keys())

    # Build topic list sorted by grade then topic
    topics: list[HeatmapTopicBE] = []
    for nid in sorted(all_node_ids):
        node = graph.nodes.get(nid)
        topics.append(HeatmapTopicBE(
            key=nid,
            label=node.topic_name if node else nid,
            grade=node.grade if node else 0,
        ))

    # Build student rows
    students: list[HeatmapStudentRowBE] = []
    for s in student_dicts:
        sid = s["id"]
        mastery = mastery_data.get(sid, {})
        cells: list[HeatmapCell] = []
        tested_levels: list[float] = []
        foundation_gap = False

        for t in topics:
            rec = mastery.get(t.key)
            if rec:
                cells.append(HeatmapCell(node_id=t.key, mastery=round(rec.mastery_level, 3)))
                tested_levels.append(rec.mastery_level)
                if t.grade < 8 and rec.mastery_level < 0.4:
                    foundation_gap = True
            else:
                cells.append(HeatmapCell(node_id=t.key, mastery=None))

        avg = sum(tested_levels) / len(tested_levels) if tested_levels else 0.0
        students.append(HeatmapStudentRowBE(
            student_id=sid,
            full_name=s["name"],
            avg_mastery=round(avg, 3),
            foundation_gap=foundation_gap,
            cells=cells,
        ))

    # Sort by avgMastery descending (best first)
    students.sort(key=lambda s: -s.avg_mastery)

    return HeatmapResponse(topics=topics, students=students)


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


# ── Schedule endpoints (tests as calendar events) ──────────────────────────────

from datetime import date, datetime, timezone
from sqlalchemy import and_

from app.models.test import Test
from app.repositories import test_repo


def _period_label(idx: int) -> str:
    """Map 0-based index to Vietnamese period label."""
    labels = ["Tiết 1", "Tiết 2", "Tiết 3", "Tiết 4", "Tiết 5", "Tiết 6"]
    return labels[idx] if idx < len(labels) else f"Tiết {idx + 1}"


def _time_label(idx: int) -> str:
    """Map 0-based index to time range."""
    times = [
        "07:00 - 07:45",
        "07:50 - 08:35",
        "08:45 - 09:30",
        "09:40 - 10:25",
        "13:00 - 13:45",
        "13:55 - 14:40",
    ]
    return times[idx] if idx < len(times) else f"Tiết {idx + 1}"


@router.get("/classes/{class_id}/schedule", response_model=ScheduleResponse)
async def get_schedule(
    class_id: str,
    current_user: CurrentUser,
    db: DbSession,
    target_date: Annotated[str, Query(alias="date")],
) -> ScheduleResponse:
    """Tests scheduled on a specific date for a class."""
    # Parse the date string
    try:
        dt = datetime.fromisoformat(target_date)
        day_start = dt.replace(hour=0, minute=0, second=0, tzinfo=timezone.utc)
        day_end = dt.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    except ValueError:
        raise api_error(400, "invalid_date", f"Invalid date format: {target_date}")

    # Query tests scheduled on this date for this class
    result = await db.execute(
        select(Test).where(
            and_(
                Test.class_id == class_id,
                Test.scheduled_at >= day_start,
                Test.scheduled_at <= day_end,
            )
        ).options(
            selectinload(Test.questions),
            selectinload(Test.assignments),
        )
    )
    tests = list(result.scalars().all())

    # Get student count for the class
    student_count = await class_repo.student_count(db, class_id)

    # Get class name
    cls = await class_repo.get_by_id(db, class_id)
    class_label = cls.name if cls else "Lớp"

    events = []
    for idx, t in enumerate(tests):
        events.append(ScheduleEvent(
            id=str(t.id),
            class_label=class_label,
            subject="Toán",
            topic=t.title,
            period=_period_label(idx),
            time=_time_label(idx),
            student_count=student_count,
            kind="exam",
        ))

    return ScheduleResponse(events=events)


@router.get("/classes/{class_id}/schedule/dates", response_model=ScheduleDatesResponse)
async def get_schedule_dates(
    class_id: str,
    current_user: CurrentUser,
    db: DbSession,
    month: Annotated[str, Query()],
) -> ScheduleDatesResponse:
    """Dates that have scheduled tests in a given month (YYYY-MM)."""
    try:
        year, mon = map(int, month.split("-"))
        month_start = datetime(year, mon, 1, tzinfo=timezone.utc)
        if mon == 12:
            month_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            month_end = datetime(year, mon + 1, 1, tzinfo=timezone.utc)
    except (ValueError, IndexError):
        raise api_error(400, "invalid_month", f"Invalid month format: {month}")

    result = await db.execute(
        select(Test.scheduled_at).where(
            and_(
                Test.class_id == class_id,
                Test.scheduled_at >= month_start,
                Test.scheduled_at < month_end,
                Test.scheduled_at.isnot(None),
            )
        )
    )
    dates = sorted(set(
        row[0].strftime("%Y-%m-%d")
        for row in result.all()
        if row[0] is not None
    ))

    return ScheduleDatesResponse(dates=dates)
