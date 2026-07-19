"""Rich school seed: 3 teachers, 6 classes (G6-8), 120 students, 24 questions,
~600 submissions with real grading pipeline -> MongoDB mastery data.

Run from backend/: `python -m scripts.seed_rich_school`

Idempotent — deletes previously-seeded school data before re-inserting.
"""

from __future__ import annotations

import asyncio
import random
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

# ── Constants ──────────────────────────────────────────────────────────────────

PASSWORD = "gaplens123"

TEACHERS = [
    {"username": "teacher1", "full_name": "Cô Lan Anh", "grade": 6},
    {"username": "teacher2", "full_name": "Thầy Minh Đức", "grade": 7},
    {"username": "teacher3", "full_name": "Cô Thu Hà", "grade": 8},
]

CLASS_SUFFIXES = ["A1", "A2"]

FIRST_NAMES = [
    "An", "Bảo", "Chi", "Dũng", "Em", "Giang", "Hà", "Hùng",
    "Khánh", "Linh", "Mai", "Nam", "Oanh", "Phúc", "Quân", "Rồng",
    "Sơn", "Thảo", "Uyên", "Vinh", "Xuân", "Yên", "Bích", "Cúc",
    "Đào", "Floral", "Gấm", "Hạnh", "Iris", "Khoa", "Lan", "Mỹ",
    "Nga", "Phượng", "Quỳnh", "Sương", "Trà", "Vân", "Zelda", "Ái",
]

MIDDLE_NAMES = [
    "Minh", "Thị", "Văn", "Ngọc", "Hồng", "Tiến", "Đức", "Hải",
    "Phương", "Thanh", "Xuân", "Nguyệt", "Bảo", "Công", "Duy", "Gia",
    "Hòa", "Kiên", "Mạnh", "Nghiêm", "Phong", "Quang", "Sun", "Tài",
    "Vũ", "Đình", "Hoàng", "Kim", "Lê", "Mai", "Phan", "Trịnh",
    "Bùi", "Châu", "Dương", "Lý", "Ngô", "Tô", "Vương", "Âu",
]

LAST_NAMES = [
    "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi",
    "Đỗ", "Ngô", "Dương", "Lý", "Trịnh", "Phan", "Vương", "Mai",
    "Tô", "Châu", "Lưu", "Đinh", "Tạ", "Lương", "Võ", "Hà",
    "Cao", "Lâm", "Mạc", "Tôn", "Đoàn", "Hồng", "Kiều", "Thái",
    "Cresden", "Fuse", "Greg", "Hansen", "Ivan", "Jack", "Ken", "Lee",
]

# 24 questions: 8 per grade mapped to real block-level curriculum node IDs
QUESTIONS_BY_GRADE: dict[int, list[dict]] = {
    6: [
        {"text": "Tính 15 + 27 = ?", "options": ["42", "32", "52", "38"], "answer": "42", "difficulty": "easy", "node_id": "L6-t1-B01"},
        {"text": "So sánh: 25 và 30", "options": ["25 < 30", "25 > 30", "25 = 30", "Không so sánh được"], "answer": "25 < 30", "difficulty": "easy", "node_id": "L6-t1-B02"},
        {"text": "Tính -8 + 5 = ?", "options": ["-3", "3", "-13", "13"], "answer": "-3", "difficulty": "easy", "node_id": "L6-t2-B01"},
        {"text": "Tính 1/2 + 1/3 = ?", "options": ["5/6", "2/5", "1/5", "2/6"], "answer": "5/6", "difficulty": "medium", "node_id": "L6-t3-B01"},
        {"text": "Đổi 3/4 thành số thập phân:", "options": ["0.75", "0.85", "0.34", "0.43"], "answer": "0.75", "difficulty": "medium", "node_id": "L6-t3-B02"},
        {"text": "Hình nào là hình tam giác?", "options": ["Hình có 3 cạnh", "Hình có 4 cạnh", "Hình tròn", "Hình chữ nhật"], "answer": "Hình có 3 cạnh", "difficulty": "easy", "node_id": "L6-t4-B01"},
        {"text": "Diện tích tam giác có đáy 6cm, cao 4cm là:", "options": ["12 cm²", "24 cm²", "10 cm²", "20 cm²"], "answer": "12 cm²", "difficulty": "hard", "node_id": "L6-t5-B01"},
        {"text": "Trung bình cộng của 3 số 8, 6, 10 là:", "options": ["8", "7", "9", "6"], "answer": "8", "difficulty": "medium", "node_id": "L6-t6-B01"},
    ],
    7: [
        {"text": "Tính 2/3 × 3/4 = ?", "options": ["1/2", "6/12", "5/7", "1/4"], "answer": "1/2", "difficulty": "easy", "node_id": "L7-t1-B01"},
        {"text": "Căn bậc hai của 49 là:", "options": ["7", "8", "6", "9"], "answer": "7", "difficulty": "easy", "node_id": "L7-t2-B01"},
        {"text": "Rút gọn 3x + 2x = ?", "options": ["5x", "6x", "5x²", "x"], "answer": "5x", "difficulty": "easy", "node_id": "L7-t3-B01"},
        {"text": "Nếu a/b = 2/3 và b = 12 thì a = ?", "options": ["8", "6", "18", "24"], "answer": "8", "difficulty": "medium", "node_id": "L7-t4-B01"},
        {"text": "Góc đối đỉnh bằng bao nhiêu độ?", "options": ["Bằng nhau", "Bù nhau", "Song song", "Vuông góc"], "answer": "Bằng nhau", "difficulty": "easy", "node_id": "L7-t5-B01"},
        {"text": "Tam giác có 3 cạnh 3, 4, 5 là tam giác:", "options": ["Vuông", "Cân", "Đều", "Thường"], "answer": "Vuông", "difficulty": "medium", "node_id": "L7-t6-B01"},
        {"text": "Thể tích hình hộp chữ nhật có dài 5, rộng 3, cao 4 là:", "options": ["60", "45", "30", "12"], "answer": "60", "difficulty": "easy", "node_id": "L7-t7-B01"},
        {"text": "Trung bình cộng của 4 số 7, 8, 9, 10 là:", "options": ["8.5", "8", "9", "7.5"], "answer": "8.5", "difficulty": "medium", "node_id": "L7-t8-B01"},
    ],
    8: [
        {"text": "Tính (x + 2)(x + 3) = ?", "options": ["x² + 5x + 6", "x² + 6x + 5", "x² + 5x + 5", "x² + 6x + 6"], "answer": "x² + 5x + 6", "difficulty": "easy", "node_id": "L8-t1-B01"},
        {"text": "Áp dụng hằng đẳng thức: (a + b)² = ?", "options": ["a² + 2ab + b²", "a² + ab + b²", "a² - 2ab + b²", "2a + 2b"], "answer": "a² + 2ab + b²", "difficulty": "easy", "node_id": "L8-t1-B02"},
        {"text": "Rút gọn (x² - 9)/(x - 3) = ?", "options": ["x + 3", "x - 3", "x² + 3", "9"], "answer": "x + 3", "difficulty": "hard", "node_id": "L8-t2-B01"},
        {"text": "Đồ thị hàm số y = 2x đi qua điểm:", "options": ["(1, 2)", "(2, 1)", "(1, 3)", "(0, 1)"], "answer": "(1, 2)", "difficulty": "medium", "node_id": "L8-t3-B01"},
        {"text": "Giải phương trình 3x - 6 = 0", "options": ["x = 2", "x = 3", "x = -2", "x = 6"], "answer": "x = 2", "difficulty": "easy", "node_id": "L8-t4-B01"},
        {"text": "Trong tam giác vuông, cạnh huyền bằng:", "options": ["√(a² + b²)", "a + b", "a² + b²", "√(a + b)"], "answer": "√(a² + b²)", "difficulty": "medium", "node_id": "L8-t5-B01"},
        {"text": "Hai tam giác đồng dạng khi:", "options": ["3 góc tương ứng bằng nhau", "3 cạnh tương ứng bằng nhau", "2 cạnh bằng nhau", "1 góc bằng nhau"], "answer": "3 góc tương ứng bằng nhau", "difficulty": "medium", "node_id": "L8-t6-B01"},
        {"text": "Biểu đồ cột dùng để:", "options": ["So sánh số liệu", "Tính trung bình", "Tìm median", "Tính tỉ lệ"], "answer": "So sánh số liệu", "difficulty": "easy", "node_id": "L8-t8-B01"},
    ],
}

# Ability profiles: (low_pct, high_pct)
ABILITY_PROFILES = {
    "high":       (0.70, 1.00),
    "medium":     (0.40, 0.70),
    "low":        (0.15, 0.40),
    "struggling": (0.00, 0.20),
}

# Distribution per class of 20 students
PROFILE_DIST = ["high"] * 4 + ["medium"] * 9 + ["low"] * 5 + ["struggling"] * 2

# Weekly test history: (days_ago, week_num)
WEEKLY_HISTORY = [
    (35, 1),
    (28, 2),
    (21, 3),
    (14, 4),
    (7, 5),
]


# ── Helpers ────────────────────────────────────────────────────────────────────


def _generate_student_names(count: int) -> list[str]:
    """Generate unique Vietnamese full names."""
    names: set[str] = set()
    result: list[str] = []
    rng = random.Random(42)
    while len(result) < count:
        last = rng.choice(LAST_NAMES)
        middle = rng.choice(MIDDLE_NAMES)
        first = rng.choice(FIRST_NAMES)
        full = f"{last} {middle} {first}"
        if full not in names:
            names.add(full)
            result.append(full)
    return result


STUDENT_NAMES = _generate_student_names(120)


def _usernames_for_teachers() -> list[str]:
    return [t["username"] for t in TEACHERS]


def _usernames_for_students(n: int) -> list[str]:
    return [f"student{i + 1}" for i in range(n)]


def _class_name(grade: int, suffix: str) -> str:
    return f"Lớp {grade}{suffix}"


async def reset_school_data(db) -> None:
    """Delete all seeded school data (teachers, students, classes, tests, etc.)."""
    all_usernames = _usernames_for_teachers() + _usernames_for_students(120)

    def stmt(sql: str, *expanding: str):
        s = text(sql)
        if expanding:
            s = s.bindparams(*(bindparam(name, expanding=True) for name in expanding))
        return s

    params = {"usernames": all_usernames}

    # FK children first — match exact order from seed_db.py
    await db.execute(
        stmt(
            "DELETE FROM ocr_scans WHERE student_id IN "
            "(SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM ocr_scans WHERE detected_student_id IN "
            "(SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM submission_answers WHERE submission_id IN "
            "(SELECT id FROM submissions WHERE student_id IN "
            "(SELECT id FROM users WHERE username IN :usernames))",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM submissions WHERE student_id IN "
            "(SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM test_assignments WHERE student_id IN "
            "(SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM test_questions WHERE test_id IN "
            "(SELECT id FROM tests WHERE created_by IN "
            "(SELECT id FROM users WHERE username IN :usernames))",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM tests WHERE created_by IN "
            "(SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM learning_paths WHERE student_id IN "
            "(SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM interventions WHERE class_id IN "
            "(SELECT id FROM classes WHERE teacher_id IN "
            "(SELECT id FROM users WHERE username IN :usernames))",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM class_students WHERE student_id IN "
            "(SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM class_students WHERE class_id IN "
            "(SELECT id FROM classes WHERE teacher_id IN "
            "(SELECT id FROM users WHERE username IN :usernames))",
            "usernames",
        ),
        params,
    )
    await db.execute(
        stmt(
            "DELETE FROM classes WHERE teacher_id IN "
            "(SELECT id FROM users WHERE username IN :usernames)",
            "usernames",
        ),
        params,
    )
    # Delete seed questions (identified by their unique text)
    seed_q_texts = [q["text"] for qs in QUESTIONS_BY_GRADE.values() for q in qs]
    params_q = {"texts": seed_q_texts}
    await db.execute(
        stmt("DELETE FROM questions WHERE text IN :texts", "texts"),
        params_q,
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
        password_hash=hash_password(PASSWORD),
        full_name=full_name,
        role=role,
    )


def _wrong_answer(question: Question) -> str:
    """Return first option that is not the correct answer."""
    for opt in question.options or []:
        if opt["text"] != question.answer:
            return opt["text"]
    return "N/A"


async def _submit_and_grade(
    db, test, student: User, questions: list[Question], correct_count: int, *, days_ago: int = 0
) -> None:
    """Submit + grade via real pipeline, then backdate timestamps."""
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


# ── Seed functions ─────────────────────────────────────────────────────────────


async def seed_teachers(db) -> list[User]:
    """Create 3 teacher accounts."""
    teachers = []
    for t in TEACHERS:
        user = await _get_or_create_user(
            db, username=t["username"], full_name=t["full_name"], role=UserRole.TEACHER
        )
        teachers.append(user)
    return teachers


async def seed_classes_and_students(
    db, teachers: list[User]
) -> tuple[list[ClassGroup], list[User]]:
    """Create 6 classes (2 per grade) and 120 students distributed across them.

    Each class gets 20 students (round-robin from 120 pool).
    """
    all_students: list[User] = []

    # Create all student users
    for i, name in enumerate(STUDENT_NAMES):
        username = f"student{i + 1}"
        user = await _get_or_create_user(
            db, username=username, full_name=name, role=UserRole.STUDENT
        )
        all_students.append(user)

    # Create classes and enroll students
    all_classes: list[ClassGroup] = []
    student_idx = 0

    for grade in [6, 7, 8]:
        teacher = teachers[grade - 6]  # teacher1=G6, teacher2=G7, teacher3=G8
        for suffix in CLASS_SUFFIXES:
            class_group = ClassGroup(
                name=_class_name(grade, suffix),
                subject="math",
                grade=grade,
                teacher_id=teacher.id,
            )
            db.add(class_group)
            await db.flush()

            # Enroll 20 students (round-robin from the 120 pool)
            for _ in range(20):
                student = all_students[student_idx % 120]
                db.add(ClassStudent(class_id=class_group.id, student_id=student.id))
                student_idx += 1

            all_classes.append(class_group)

    await db.commit()
    return all_classes, all_students


async def seed_questions(db, graph) -> dict[int, list[Question]]:
    """Create 8 questions per grade, mapped to real curriculum node IDs."""
    questions_by_grade: dict[int, list[Question]] = {}

    for grade, q_list in QUESTIONS_BY_GRADE.items():
        rows = []
        for q in q_list:
            row = Question(
                text=q["text"],
                options=[{"key": k, "text": t} for k, t in zip("ABCD", q["options"])],
                answer=q["answer"],
                difficulty=q["difficulty"],
                node_id=q["node_id"],
            )
            rows.append(row)
        db.add_all(rows)
        await db.flush()
        for row in rows:
            await db.refresh(row)
        questions_by_grade[grade] = rows

    await db.commit()
    return questions_by_grade


async def seed_student_activity(
    db,
    mongo_db,
    teachers: list[User],
    classes: list[ClassGroup],
    students: list[User],
    questions_by_grade: dict[int, list[Question]],
) -> None:
    """For each student in each class: create 5 tests + submissions + grading.

    Correct count varies by ability profile to create realistic mastery distribution.
    """
    now = datetime.now(timezone.utc)

    # Build map: class_id -> list of enrolled student IDs
    class_students_map: dict[str, list[str]] = {}
    for cls in classes:
        result = await db.execute(
            text("SELECT student_id FROM class_students WHERE class_id = :cid"),
            {"cid": cls.id},
        )
        class_students_map[str(cls.id)] = [str(row[0]) for row in result]

    # Assign ability profiles to students per class
    rng = random.Random(42)
    student_class_profile: dict[str, dict[str, str]] = {}

    for cls in classes:
        profiles = list(PROFILE_DIST)
        rng.shuffle(profiles)
        enrolled = class_students_map.get(str(cls.id), [])
        for i, sid in enumerate(enrolled):
            profile = profiles[i % len(profiles)]
            if sid not in student_class_profile:
                student_class_profile[sid] = {}
            student_class_profile[sid][str(cls.id)] = profile

    # Create tests + submissions for each student in each class
    test_count = 0
    submission_count = 0

    for cls in classes:
        grade = cls.grade
        questions = questions_by_grade.get(grade, [])
        if not questions:
            continue

        teacher = next(t for t in teachers if t.id == cls.teacher_id)
        enrolled = class_students_map.get(str(cls.id), [])

        for sid in enrolled:
            profile = student_class_profile.get(sid, {}).get(str(cls.id), "medium")
            low_pct, high_pct = ABILITY_PROFILES[profile]

            for week_idx, (days_ago, week_num) in enumerate(WEEKLY_HISTORY):
                # Vary correctness by profile + slight improvement over weeks
                pct = rng.uniform(low_pct, high_pct)
                pct = min(1.0, pct + week_idx * 0.05)
                correct_count = max(0, min(len(questions), round(pct * len(questions))))

                scheduled = now - timedelta(days=days_ago)
                is_revision = week_idx == 4
                test_type = TestType.REVISION if is_revision else TestType.WEEKLY
                title = (
                    f"Ôn tập cuối kỳ — G{grade}"
                    if is_revision
                    else f"Kiểm tra tuần {week_num} — G{grade}"
                )

                test = await test_repo.create_test(
                    db,
                    title=title,
                    class_id=cls.id,
                    type_=test_type,
                    created_by=teacher.id,
                    question_ids=[q.id for q in questions],
                    scheduled_at=scheduled,
                )
                test_count += 1

                student_user = next((s for s in students if str(s.id) == sid), None)
                if not student_user:
                    continue

                await test_repo.create_assignments(
                    db, test_id=test.id, student_ids=[student_user.id], due_at=None
                )
                await _submit_and_grade(
                    db, test, student_user, questions, correct_count, days_ago=days_ago
                )
                submission_count += 1

    print(f"  tests created: {test_count}")
    print(f"  submissions graded: {submission_count}")


async def seed_learning_paths(db, mongo_db, students: list[User]) -> None:
    """Generate learning paths for a subset of students."""
    count = 0
    for student in students[:30]:
        try:
            await agent_service.generate_learning_path(
                db, mongo_db, student_id=str(student.id), previous_path_id=None
            )
            count += 1
        except Exception:
            pass
    print(f"  learning paths generated: {count}")


# ── Main ───────────────────────────────────────────────────────────────────────


async def main() -> None:
    print("=== Rich School Seed ===")
    await init_models()

    # Ensure scheduled_at column exists (for existing DBs)
    async with async_session_factory() as db:
        await db.execute(text(
            "ALTER TABLE tests ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ"
        ))
        await db.commit()

    mongo_db = get_database()
    meta = await kg_service.seed_graph(mongo_db)
    print(f"knowledge graph: {meta['node_count']} nodes, {meta['edge_count']} edges")

    async with async_session_factory() as db:
        print("\nResetting existing school data...")
        await reset_school_data(db)

        print("Creating teachers...")
        teachers = await seed_teachers(db)
        print(f"  teachers: {len(teachers)}")

        print("Creating classes and students...")
        classes, students = await seed_classes_and_students(db, teachers)
        print(f"  classes: {len(classes)}")
        print(f"  students: {len(students)}")

        print("Creating questions...")
        graph = await kg_service.load_graph(mongo_db, refresh=True)
        questions_by_grade = await seed_questions(db, graph)
        total_q = sum(len(qs) for qs in questions_by_grade.values())
        print(f"  questions: {total_q}")

        print("Seeding student activity (tests + submissions + mastery)...")
        await seed_student_activity(
            db, mongo_db, teachers, classes, students, questions_by_grade
        )

        print("Generating learning paths...")
        await seed_learning_paths(db, mongo_db, students)

        # Summary
        print("\n=== Seed Complete ===")
        for t in TEACHERS:
            print(f"  {t['username']} / {PASSWORD} — {t['full_name']} (Grade {t['grade']})")
        print(f"  {len(students)} students (student1..student{len(students)}) / {PASSWORD}")
        print(f"  {len(classes)} classes")
        print(f"  {total_q} questions across grades 6-8")


if __name__ == "__main__":
    asyncio.run(main())
