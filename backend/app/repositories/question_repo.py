from __future__ import annotations

import uuid

from sqlalchemy import select
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
