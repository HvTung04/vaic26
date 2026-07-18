"""Seed Postgres (2 demo accounts + a class of fake students + sample
approved questions) and MongoDB (curriculum knowledge graph). Drops any
previously-seeded demo rows (matched by fixed username/class-name) before
re-inserting, so re-running always produces a fresh, consistent demo dataset
instead of silently skipping past stale data.

Run from backend/: `python -m scripts.seed_db`
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import bindparam, text

from app.core.security import hash_password
from app.db.mongodb import get_database
from app.db.postgres import async_session_factory, init_models
from app.models.class_group import ClassGroup, ClassStudent
from app.models.question import Difficulty, Question
from app.models.test import TestType
from app.models.user import User, UserRole
from app.repositories import submission_repo, test_repo, user_repo
from app.services import agent_service, kg_service
from app.services.grading_service import grade_submission

CLASS_NAME = "Lớp 6A1"

STUDENT_NAMES = [
    "Nguyễn An Khang", "Trần Bảo Ngọc", "Lê Minh Tuấn", "Phạm Gia Huy", "Hoàng Phương Linh",
    "Vũ Thị Mai", "Đặng Quốc Việt", "Bùi Thu Hà", "Đỗ Đức Anh", "Ngô Khánh Vy",
    "Dương Hải Đăng", "Lý Ngọc Diệp", "Trịnh Xuân Bách", "Phan Thảo Vy", "Đinh Công Sơn",
    "Tô Yến Nhi", "Mai Anh Tuấn", "Lâm Bảo Trân", "Chu Nhật Minh", "Vương Kim Chi",
]
DEMO_USERNAMES = ["teacher1"] + [f"student{i}" for i in range(1, len(STUDENT_NAMES) + 1)]

QUESTION_SAMPLES = [
    (r"\\frac{1}{2} + \\frac{1}{3} = ?", ["5/6", "1/6", "2/5", "1/5"], "A", Difficulty.EASY),
    (
        r"So sánh \\frac{2}{3} và \\frac{3}{4}",
        ["2/3 > 3/4", "2/3 < 3/4", "Bằng nhau", "Không xác định"],
        "B",
        Difficulty.MEDIUM,
    ),
    ("Tính 12 + 8 × 3", ["36", "60", "24", "44"], "A", Difficulty.EASY),
    ("Tìm x biết 2x - 5 = 11", ["x=8", "x=3", "x=6", "x=16"], "A", Difficulty.MEDIUM),
    ("Rút gọn phân số 18/24", ["3/4", "9/12", "6/8", "2/3"], "A", Difficulty.HARD),
]


async def reset_demo_data(db) -> None:
    """Delete previously-seeded demo rows before re-inserting fresh ones.

    Scoped to the fixed demo usernames / class name / sample question texts
    below, so it never touches real teacher-created data.
    """

    def stmt(sql: str, *expanding: str):
        s = text(sql)
        if expanding:
            s = s.bindparams(*(bindparam(name, expanding=True) for name in expanding))
        return s

    sample_texts = [q[0] for q in QUESTION_SAMPLES]
    params = {"usernames": DEMO_USERNAMES, "class_name": CLASS_NAME, "sample_texts": sample_texts}

    await db.execute(
        stmt(
            """
            DELETE FROM ocr_scans
            WHERE test_id IN (SELECT id FROM tests WHERE class_id IN (
                    SELECT id FROM classes WHERE name = :class_name))
               OR student_id IN (SELECT id FROM users WHERE username IN :usernames)
               OR detected_student_id IN (SELECT id FROM users WHERE username IN :usernames)
            """,
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            """
            DELETE FROM submission_answers
            WHERE submission_id IN (
                SELECT id FROM submissions WHERE student_id IN (
                    SELECT id FROM users WHERE username IN :usernames))
            """,
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM submissions WHERE student_id IN (SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt("DELETE FROM test_assignments WHERE test_id IN ("
             "SELECT id FROM tests WHERE class_id IN (SELECT id FROM classes WHERE name = :class_name))"),
        params,
    )
    await db.execute(
        stmt("DELETE FROM test_questions WHERE test_id IN ("
             "SELECT id FROM tests WHERE class_id IN (SELECT id FROM classes WHERE name = :class_name))"),
        params,
    )
    await db.execute(
        stmt("DELETE FROM tests WHERE class_id IN (SELECT id FROM classes WHERE name = :class_name)"),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM learning_paths WHERE student_id IN (SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt("DELETE FROM interventions WHERE class_id IN (SELECT id FROM classes WHERE name = :class_name)"),
        params,
    )
    await db.execute(
        stmt("DELETE FROM class_students WHERE class_id IN (SELECT id FROM classes WHERE name = :class_name)"),
        params,
    )
    await db.execute(stmt("DELETE FROM classes WHERE name = :class_name"), params)
    await db.execute(
        stmt(
            "DELETE FROM question_drafts WHERE approved_question_id IN "
            "(SELECT id FROM questions WHERE text IN :sample_texts)",
            "sample_texts",
        ),
        params,
    )
    await db.execute(
        stmt("DELETE FROM questions WHERE text IN :sample_texts", "sample_texts"),
        params,
    )
    await db.execute(
        stmt("DELETE FROM users WHERE username IN :usernames", "usernames"),
        params,
    )
    await db.commit()


async def _get_or_create_user(db, *, username: str, full_name: str, role: UserRole) -> User:
    existing = await user_repo.get_by_username(db, username)
    if existing:
        return existing
    return await user_repo.create_user(
        db,
        username=username,
        password_hash=hash_password("gaplens123"),
        full_name=full_name,
        role=role,
    )


async def seed_questions(db, node_ids: list[str]) -> list[Question]:
    rows = []
    for i, (question_text, options, answer_key, difficulty) in enumerate(QUESTION_SAMPLES):
        node_id = node_ids[i % len(node_ids)]
        answer_text = options[ord(answer_key) - ord("A")]
        rows.append(
            Question(
                text=question_text,
                # Students submit literal option text (attempt view has no keys), so
                # the stored answer must match that, not the "A"/"B" key above.
                options=[{"key": k, "text": t} for k, t in zip("ABCD", options)],
                answer=answer_text,
                difficulty=difficulty,
                node_id=node_id,
            )
        )
    db.add_all(rows)
    await db.commit()
    for row in rows:
        await db.refresh(row)
    return rows


def _wrong_answer(question: Question) -> str:
    for opt in question.options or []:
        if opt["text"] != question.answer:
            return opt["text"]
    return "N/A"


async def _submit_and_grade(
    db, test, student: User, questions: list[Question], correct_count: int, *, days_ago: int = 0
) -> None:
    """Submit+grade via the real pipeline, then backdate submitted_at/graded_at
    so `?range=weekly|monthly|all` filters (#28, #29) have distinct buckets to
    return instead of everything landing in "now".
    """
    answers = [
        {
            "question_id": q.id,
            "answer": q.answer if i < correct_count else _wrong_answer(q),
            "time_spent_seconds": 30 + i * 5,
        }
        for i, q in enumerate(questions)
    ]
    submission = await submission_repo.create_submission(
        db, test_id=test.id, student_id=student.id, answers=answers
    )
    await grade_submission(str(submission.id))

    if days_ago:
        submission = await submission_repo.get_submission(db, submission.id)
        backdated = datetime.now(timezone.utc) - timedelta(days=days_ago)
        submission.submitted_at = backdated
        submission.graded_at = backdated
        await db.commit()


# (days_ago, correct_out_of_len(questions)) per student, oldest first: one point
# >30d ago (only in range=all), one ~3w ago and one ~10d ago (both only in
# range=monthly), one ~2d ago (in range=weekly too) — plus a same-day revision
# test. Correct counts trend upward to give the progress timeline (#28) a
# visible improvement curve.
WEEKLY_HISTORY = [
    [(35, 1), (21, 2), (10, 3), (2, 4)],
    [(35, 0), (21, 1), (10, 2), (2, 3)],
    [(35, 1), (21, 1), (10, 2), (2, 2)],
]
REVISION_CORRECT = [5, 3, 1]


async def seed_student_activity(
    db, mongo_db, teacher: User, class_group: ClassGroup, students: list[User], questions: list[Question]
) -> None:
    """Give the first 3 students a spread of weekly submissions across the past
    ~5 weeks plus a same-day revision submission (graded via the real pipeline,
    so mastery/root-cause land in Mongo) and an active learning path, so the
    student dashboard APIs (#7, #8, #17, #27, #28, #29) return real data —
    including multiple time buckets for the #28/#29 range filters — out of the
    box.
    """
    for i, student in enumerate(students[:3]):
        for week_num, (days_ago, correct) in enumerate(WEEKLY_HISTORY[i], start=1):
            weekly_test = await test_repo.create_test(
                db,
                title=f"Kiểm tra tuần {week_num} — Phân số",
                class_id=class_group.id,
                type_=TestType.WEEKLY,
                created_by=teacher.id,
                question_ids=[q.id for q in questions],
            )
            await test_repo.create_assignments(db, test_id=weekly_test.id, student_ids=[student.id], due_at=None)
            await _submit_and_grade(db, weekly_test, student, questions, correct, days_ago=days_ago)

        revision_test = await test_repo.create_test(
            db,
            title="Ôn tập — Phân số",
            class_id=class_group.id,
            type_=TestType.REVISION,
            created_by=teacher.id,
            question_ids=[q.id for q in questions],
        )
        await test_repo.create_assignments(db, test_id=revision_test.id, student_ids=[student.id], due_at=None)
        await _submit_and_grade(db, revision_test, student, questions, REVISION_CORRECT[i])

        await agent_service.generate_learning_path(db, mongo_db, student_id=str(student.id), previous_path_id=None)


async def main() -> None:
    await init_models()

    mongo_db = get_database()
    meta = await kg_service.seed_graph(mongo_db)
    print(f"seeded knowledge graph: {meta['node_count']} nodes, {meta['edge_count']} edges")

    async with async_session_factory() as db:
        await reset_demo_data(db)

        graph = await kg_service.load_graph(mongo_db, refresh=True)
        grade6_nodes = [n.id for n in graph.nodes.values() if n.grade == 6][:5] or list(graph.nodes)[:5]

        teacher = await _get_or_create_user(db, username="teacher1", full_name="Cô Lan Anh", role=UserRole.TEACHER)

        class_group = ClassGroup(name=CLASS_NAME, subject="math", grade=6, teacher_id=teacher.id)
        db.add(class_group)
        await db.commit()
        await db.refresh(class_group)

        students = []
        for i, name in enumerate(STUDENT_NAMES, start=1):
            username = f"student{i}"
            student = await _get_or_create_user(db, username=username, full_name=name, role=UserRole.STUDENT)
            students.append(student)
            db.add(ClassStudent(class_id=class_group.id, student_id=student.id))
        await db.commit()

        questions = await seed_questions(db, grade6_nodes)
        await seed_student_activity(db, mongo_db, teacher, class_group, students, questions)

        print(f"teacher: teacher1 / gaplens123 (id={teacher.id})")
        print(f"student demo: {students[0].username} / gaplens123 (id={students[0].id})")
        print(f"class: {class_group.name} (id={class_group.id}), {len(students)} students")
        print(f"questions seeded: {len(questions)}")
        print("seeded weekly+revision submissions & learning path for student1-3 (dashboard test data)")


if __name__ == "__main__":
    asyncio.run(main())
