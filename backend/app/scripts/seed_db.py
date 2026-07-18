"""Seed Postgres (2 demo accounts + a class of fake students + sample
approved questions) and MongoDB (curriculum knowledge graph). Idempotent:
re-running skips users/classes that already exist by username/name.

Run from backend/: `python -m scripts.seed_db`
"""

from __future__ import annotations

import asyncio

from app.core.security import hash_password
from app.db.mongodb import get_database
from app.db.postgres import async_session_factory, init_models
from app.models.class_group import ClassGroup, ClassStudent
from app.models.question import Difficulty, Question
from app.models.user import User, UserRole
from app.repositories import user_repo
from app.services import kg_service

STUDENT_NAMES = [
    "Nguyễn An Khang", "Trần Bảo Ngọc", "Lê Minh Tuấn", "Phạm Gia Huy", "Hoàng Phương Linh",
    "Vũ Thị Mai", "Đặng Quốc Việt", "Bùi Thu Hà", "Đỗ Đức Anh", "Ngô Khánh Vy",
    "Dương Hải Đăng", "Lý Ngọc Diệp", "Trịnh Xuân Bách", "Phan Thảo Vy", "Đinh Công Sơn",
    "Tô Yến Nhi", "Mai Anh Tuấn", "Lâm Bảo Trân", "Chu Nhật Minh", "Vương Kim Chi",
]


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
    from sqlalchemy import select

    existing = (await db.execute(select(Question))).scalars().all()
    if existing:
        return list(existing)

    samples = [
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
    rows = []
    for i, (text, options, answer_key, difficulty) in enumerate(samples):
        node_id = node_ids[i % len(node_ids)]
        answer_text = options[ord(answer_key) - ord("A")]
        rows.append(
            Question(
                text=text,
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


async def main() -> None:
    await init_models()

    mongo_db = get_database()
    meta = await kg_service.seed_graph(mongo_db)
    print(f"seeded knowledge graph: {meta['node_count']} nodes, {meta['edge_count']} edges")

    async with async_session_factory() as db:
        graph = await kg_service.load_graph(mongo_db, refresh=True)
        grade6_nodes = [n.id for n in graph.nodes.values() if n.grade == 6][:5] or list(graph.nodes)[:5]

        teacher = await _get_or_create_user(db, username="teacher1", full_name="Cô Lan Anh", role=UserRole.TEACHER)

        from sqlalchemy import select

        class_group = (
            await db.execute(select(ClassGroup).where(ClassGroup.name == "Lớp 6A1"))
        ).scalar_one_or_none()
        if class_group is None:
            class_group = ClassGroup(name="Lớp 6A1", subject="math", grade=6, teacher_id=teacher.id)
            db.add(class_group)
            await db.commit()
            await db.refresh(class_group)

        students = []
        for i, name in enumerate(STUDENT_NAMES, start=1):
            username = f"student{i}"
            student = await _get_or_create_user(db, username=username, full_name=name, role=UserRole.STUDENT)
            students.append(student)

            membership = (
                await db.execute(
                    select(ClassStudent).where(
                        ClassStudent.class_id == class_group.id, ClassStudent.student_id == student.id
                    )
                )
            ).scalar_one_or_none()
            if membership is None:
                db.add(ClassStudent(class_id=class_group.id, student_id=student.id))
        await db.commit()

        questions = await seed_questions(db, grade6_nodes)

        print(f"teacher: teacher1 / gaplens123 (id={teacher.id})")
        print(f"student demo: {students[0].username} / gaplens123 (id={students[0].id})")
        print(f"class: {class_group.name} (id={class_group.id}), {len(students)} students")
        print(f"questions seeded: {len(questions)}")


if __name__ == "__main__":
    asyncio.run(main())
