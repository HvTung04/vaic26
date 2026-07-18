from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Difficulty, Question, QuestionDraft, QuestionType, Upload, UploadStatus


async def create_upload(
    db: AsyncSession,
    *,
    teacher_id: str | uuid.UUID,
    class_id: str | uuid.UUID | None,
    subject: str,
    grade: int,
    file_name: str,
) -> Upload:
    upload = Upload(
        teacher_id=teacher_id,
        class_id=class_id,
        subject=subject,
        grade=grade,
        file_name=file_name,
        status=UploadStatus.QUEUED,
    )
    db.add(upload)
    await db.commit()
    await db.refresh(upload)
    return upload


async def get_upload(db: AsyncSession, upload_id: str | uuid.UUID) -> Upload | None:
    return await db.get(Upload, upload_id)


async def set_upload_status(
    db: AsyncSession, upload: Upload, status: UploadStatus, error: str | None = None
) -> Upload:
    upload.status = status
    upload.error = error
    await db.commit()
    await db.refresh(upload)
    return upload


async def add_drafts(db: AsyncSession, upload_id: str | uuid.UUID, drafts: list[dict]) -> list[QuestionDraft]:
    rows = [
        QuestionDraft(
            upload_id=upload_id,
            text=d["text"],
            type=d.get("type", QuestionType.MCQ),
            options=d.get("options"),
            answer=d.get("answer"),
            suggested_node_id=d.get("suggested_node_id"),
            suggested_difficulty=d.get("suggested_difficulty"),
            confidence=d.get("confidence", 0.0),
        )
        for d in drafts
    ]
    db.add_all(rows)
    await db.commit()
    for row in rows:
        await db.refresh(row)
    return rows


async def list_drafts(db: AsyncSession, upload_id: str | uuid.UUID) -> list[QuestionDraft]:
    result = await db.execute(select(QuestionDraft).where(QuestionDraft.upload_id == upload_id))
    return list(result.scalars().all())


async def get_draft(db: AsyncSession, draft_id: str | uuid.UUID) -> QuestionDraft | None:
    return await db.get(QuestionDraft, draft_id)


async def create_question_from_draft(
    db: AsyncSession,
    draft: QuestionDraft,
    *,
    text: str,
    options: list | None,
    answer: str,
    node_id: str,
    difficulty: Difficulty,
) -> Question:
    question = Question(
        text=text,
        type=draft.type,
        options=options,
        answer=answer,
        difficulty=difficulty,
        node_id=node_id,
        source_upload_id=draft.upload_id,
    )
    db.add(question)
    await db.flush()
    draft.approved_question_id = question.id
    await db.commit()
    await db.refresh(question)
    return question


async def get_question(db: AsyncSession, question_id: str | uuid.UUID) -> Question | None:
    return await db.get(Question, question_id)


_SORTABLE_COLUMNS = {
    "text": Question.text,
    "type": Question.type,
    "difficulty": Question.difficulty,
    "created_at": Question.created_at,
}


def _filtered_questions_query(
    *,
    node_id: str | None,
    topic_node_ids: list[str] | None,
    difficulty: Difficulty | None,
    type: QuestionType | None,
    subject: str | None,
    grade: int | None,
    search: str | None,
):
    query = select(Question)
    if subject is not None or grade is not None:
        query = query.join(Upload, Question.source_upload_id == Upload.id)
        if subject is not None:
            query = query.where(Upload.subject == subject)
        if grade is not None:
            query = query.where(Upload.grade == grade)
    if node_id is not None:
        query = query.where(Question.node_id == node_id)
    if topic_node_ids is not None:
        query = query.where(Question.node_id.in_(topic_node_ids))
    if difficulty is not None:
        query = query.where(Question.difficulty == difficulty)
    if type is not None:
        query = query.where(Question.type == type)
    if search:
        query = query.where(Question.text.ilike(f"%{search}%"))
    return query


async def list_questions(
    db: AsyncSession,
    *,
    node_id: str | None = None,
    topic_node_ids: list[str] | None = None,
    difficulty: Difficulty | None = None,
    type: QuestionType | None = None,
    subject: str | None = None,
    grade: int | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Question], int]:
    base_query = _filtered_questions_query(
        node_id=node_id,
        topic_node_ids=topic_node_ids,
        difficulty=difficulty,
        type=type,
        subject=subject,
        grade=grade,
        search=search,
    )

    count_result = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_result.scalar_one()

    sort_column = _SORTABLE_COLUMNS.get(sort_by, Question.created_at)
    order = sort_column.asc() if sort_dir == "asc" else sort_column.desc()
    page_result = await db.execute(base_query.order_by(order).limit(limit).offset(offset))
    return list(page_result.scalars().all()), total


async def create_question(
    db: AsyncSession,
    *,
    text: str,
    type: QuestionType,
    options: list | None,
    answer: str,
    explanation: str | None,
    difficulty: Difficulty,
    node_id: str,
) -> Question:
    question = Question(
        text=text,
        type=type,
        options=options,
        answer=answer,
        explanation=explanation,
        difficulty=difficulty,
        node_id=node_id,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def update_question(
    db: AsyncSession,
    question: Question,
    *,
    text: str,
    type: QuestionType,
    options: list | None,
    answer: str,
    explanation: str | None,
    difficulty: Difficulty,
    node_id: str,
) -> Question:
    question.text = text
    question.type = type
    question.options = options
    question.answer = answer
    question.explanation = explanation
    question.difficulty = difficulty
    question.node_id = node_id
    await db.commit()
    await db.refresh(question)
    return question


async def get_questions(db: AsyncSession, question_ids: list[str | uuid.UUID]) -> list[Question]:
    if not question_ids:
        return []
    result = await db.execute(select(Question).where(Question.id.in_(question_ids)))
    return list(result.scalars().all())


async def find_for_auto_compose(
    db: AsyncSession,
    *,
    node_ids: list[str],
    count: int,
    difficulty_mix: dict[str, int] | None = None,
) -> list[Question]:
    """Pick up to `count` questions tagged to any of node_ids (empty = any node),
    respecting an optional easy/medium/hard split. Best-effort: pads with any
    matching question if a bucket runs short.
    """
    query = select(Question)
    if node_ids:
        query = query.where(Question.node_id.in_(node_ids))
    result = await db.execute(query)
    pool = list(result.scalars().all())

    if not difficulty_mix:
        return pool[:count]

    by_diff: dict[str, list[Question]] = {"easy": [], "medium": [], "hard": []}
    for q in pool:
        by_diff.setdefault(q.difficulty.value, []).append(q)

    selected: list[Question] = []
    for level, n in difficulty_mix.items():
        selected.extend(by_diff.get(level, [])[:n])

    if len(selected) < count:
        remaining = [q for q in pool if q not in selected]
        selected.extend(remaining[: count - len(selected)])

    return selected[:count]
