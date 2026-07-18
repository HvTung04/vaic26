from __future__ import annotations

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.models.question import Difficulty
from app.models.user import UserRole
from app.repositories import question_repo
from app.schemas.content import (
    ApproveRequest,
    ApproveResponse,
    ParsedQuestion,
    QuestionDetail,
    QuestionListResponse,
    QuestionOption,
    UploadCreateResponse,
    UploadStatusResponse,
)
from app.services.content_service import process_upload

router = APIRouter(tags=["content"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("/content/uploads", response_model=UploadCreateResponse)
async def create_upload(
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: DbSession,
    file: Annotated[UploadFile, File()],
    subject: Annotated[str, Form()],
    grade: Annotated[int, Form()],
    class_id: Annotated[str | None, Form()] = None,
) -> UploadCreateResponse:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can upload content")

    settings = get_settings()
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / f"{uuid.uuid4()}_{file.filename}"
    dest.write_bytes(await file.read())

    upload = await question_repo.create_upload(
        db,
        teacher_id=current_user.id,
        class_id=class_id,
        subject=subject,
        grade=grade,
        file_name=file.filename or dest.name,
    )
    background_tasks.add_task(process_upload, str(upload.id), str(dest))
    return UploadCreateResponse(upload_id=str(upload.id), status=upload.status, created_at=upload.created_at)


@router.get("/content/uploads/{upload_id}", response_model=UploadStatusResponse)
async def get_upload_status(upload_id: str, current_user: CurrentUser, db: DbSession) -> UploadStatusResponse:
    upload = await question_repo.get_upload(db, upload_id)
    if upload is None:
        raise api_error(404, "not_found", "Upload not found")

    drafts = await question_repo.list_drafts(db, upload_id)
    parsed = [
        ParsedQuestion(
            draft_id=str(d.id),
            text=d.text,
            type=d.type,
            options=d.options,
            answer=d.answer,
            suggested_node_id=d.suggested_node_id,
            suggested_difficulty=d.suggested_difficulty,
            confidence=d.confidence,
        )
        for d in drafts
    ]
    return UploadStatusResponse(
        upload_id=str(upload.id), status=upload.status, parsed_questions=parsed, error=upload.error
    )


@router.post("/content/uploads/{upload_id}/approve", response_model=ApproveResponse)
async def approve_drafts(
    upload_id: str, payload: ApproveRequest, current_user: CurrentUser, db: DbSession
) -> ApproveResponse:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can approve drafts")

    created_ids: list[str] = []
    for item in payload.questions:
        draft = await question_repo.get_draft(db, item.draft_id)
        if draft is None or str(draft.upload_id) != upload_id:
            raise api_error(404, "not_found", f"Draft {item.draft_id} not found on this upload")

        text = item.text or draft.text
        options = None
        raw_options = item.options if item.options is not None else draft.options
        if raw_options:
            options = [
                {"key": chr(ord("A") + i), "text": opt} if isinstance(opt, str) else opt
                for i, opt in enumerate(raw_options)
            ]
        raw_answer = item.answer or draft.answer or ""
        # Students submit the literal option text (attempt view has no keys, per
        # API_SPEC.md #24), so the stored answer must be text too, not a letter.
        answer = raw_answer
        if options:
            by_key = {o["key"].lower(): o["text"] for o in options}
            answer = by_key.get(raw_answer.strip().lower(), raw_answer)

        question = await question_repo.create_question_from_draft(
            db,
            draft,
            text=text,
            options=options,
            answer=answer,
            node_id=item.node_id,
            difficulty=item.difficulty,
        )
        created_ids.append(str(question.id))

    return ApproveResponse(upload_id=upload_id, created_question_ids=created_ids, approved_count=len(created_ids))


@router.get("/questions", response_model=QuestionListResponse)
async def list_questions(
    current_user: CurrentUser,
    db: DbSession,
    node_id: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> QuestionListResponse:
    items, total = await question_repo.list_questions(
        db, node_id=node_id, difficulty=difficulty, search=search, limit=limit, offset=offset,
    )
    questions = [
        QuestionDetail(
            id=str(q.id),
            text=q.text,
            type=q.type,
            options=[QuestionOption(**o) for o in q.options] if q.options else None,
            answer=q.answer,
            explanation=q.explanation,
            difficulty=q.difficulty,
            node_id=q.node_id,
            source_upload_id=str(q.source_upload_id) if q.source_upload_id else None,
            created_at=q.created_at,
        )
        for q in items
    ]
    return QuestionListResponse(items=questions, total=total)


@router.get("/questions/{question_id}", response_model=QuestionDetail)
async def get_question(question_id: str, current_user: CurrentUser, db: DbSession) -> QuestionDetail:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can view answer keys")

    question = await question_repo.get_question(db, question_id)
    if question is None:
        raise api_error(404, "not_found", "Question not found")

    options = [QuestionOption(**o) for o in question.options] if question.options else None
    return QuestionDetail(
        id=str(question.id),
        text=question.text,
        type=question.type,
        options=options,
        answer=question.answer,
        explanation=question.explanation,
        difficulty=question.difficulty,
        node_id=question.node_id,
        source_upload_id=str(question.source_upload_id) if question.source_upload_id else None,
        created_at=question.created_at,
    )


class QuestionUpdateRequest(BaseModel):
    text: str | None = None
    options: list[QuestionOption] | None = None
    answer: str | None = None
    explanation: str | None = None
    difficulty: Difficulty | None = None
    node_id: str | None = None


@router.patch("/questions/{question_id}", response_model=QuestionDetail)
async def update_question(
    question_id: str,
    payload: QuestionUpdateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> QuestionDetail:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can edit questions")

    question = await question_repo.get_question(db, question_id)
    if question is None:
        raise api_error(404, "not_found", "Question not found")

    if payload.text is not None:
        question.text = payload.text
    if payload.options is not None:
        question.options = [o.model_dump() for o in payload.options]
    if payload.answer is not None:
        question.answer = payload.answer
    if payload.explanation is not None:
        question.explanation = payload.explanation
    if payload.difficulty is not None:
        question.difficulty = payload.difficulty
    if payload.node_id is not None:
        question.node_id = payload.node_id

    await db.commit()
    await db.refresh(question)

    options = [QuestionOption(**o) for o in question.options] if question.options else None
    return QuestionDetail(
        id=str(question.id),
        text=question.text,
        type=question.type,
        options=options,
        answer=question.answer,
        explanation=question.explanation,
        difficulty=question.difficulty,
        node_id=question.node_id,
        source_upload_id=str(question.source_upload_id) if question.source_upload_id else None,
        created_at=question.created_at,
    )
