from __future__ import annotations

import uuid
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.models.question import Difficulty, QuestionType
from app.models.user import UserRole
from app.repositories import question_repo, taxonomy_repo
from app.schemas.content import (
    ApproveRequest,
    ApproveResponse,
    ParsedQuestion,
    QuestionDetail,
    QuestionListResponse,
    QuestionOption,
    QuestionWriteRequest,
    TaxonomyNode,
    UploadCreateResponse,
    UploadStatusResponse,
)
from app.services.content_service import process_upload

router = APIRouter(tags=["content"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/taxonomy/nodes", response_model=list[TaxonomyNode])
async def list_taxonomy_nodes(current_user: CurrentUser) -> list[TaxonomyNode]:
    node_map = taxonomy_repo.load_node_map()
    return [
        TaxonomyNode(
            id=n["_id"],
            topic_name=n["topic_name"],
            grade=n["grade"],
            topic_id=n["topic_id"],
            mach=n["mach"],
            noi_dung_cu_the=n["noi_dung_cu_the"],
        )
        for n in node_map.values()
    ]


@router.get("/taxonomy/topics", response_model=list[TaxonomyNode])
async def list_taxonomy_topics(current_user: CurrentUser) -> list[TaxonomyNode]:
    return [TaxonomyNode(**t) for t in taxonomy_repo.load_topics()]


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


def _to_question_detail(question) -> QuestionDetail:
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


@router.get("/questions", response_model=QuestionListResponse)
async def list_questions(
    current_user: CurrentUser,
    db: DbSession,
    node_id: str | None = None,
    topic: str | None = None,
    difficulty: Difficulty | None = None,
    type: QuestionType | None = None,
    subject: str | None = None,
    grade: int | None = None,
    search: str | None = None,
    sort_by: Literal["text", "type", "difficulty", "created_at"] = "created_at",
    sort_dir: Literal["asc", "desc"] = "desc",
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> QuestionListResponse:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can view answer keys")

    topic_node_ids = taxonomy_repo.node_ids_for_topic(topic) if topic else None

    questions, total = await question_repo.list_questions(
        db,
        node_id=node_id,
        topic_node_ids=topic_node_ids,
        difficulty=difficulty,
        type=type,
        subject=subject,
        grade=grade,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )
    items = [_to_question_detail(q) for q in questions]
    return QuestionListResponse(items=items, total=total, limit=limit, offset=offset)


@router.post("/questions", response_model=QuestionDetail, status_code=201)
async def create_question(payload: QuestionWriteRequest, current_user: CurrentUser, db: DbSession) -> QuestionDetail:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can create questions")

    question = await question_repo.create_question(
        db,
        text=payload.text,
        type=payload.type,
        options=[o.model_dump() for o in payload.options] if payload.options else None,
        answer=payload.answer,
        explanation=payload.explanation,
        difficulty=payload.difficulty,
        node_id=payload.node_id,
    )
    return _to_question_detail(question)


@router.get("/questions/{question_id}", response_model=QuestionDetail)
async def get_question(question_id: str, current_user: CurrentUser, db: DbSession) -> QuestionDetail:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can view answer keys")

    question = await question_repo.get_question(db, question_id)
    if question is None:
        raise api_error(404, "not_found", "Question not found")

    return _to_question_detail(question)


@router.patch("/questions/{question_id}", response_model=QuestionDetail)
async def update_question(
    question_id: str, payload: QuestionWriteRequest, current_user: CurrentUser, db: DbSession
) -> QuestionDetail:
    if current_user.role != UserRole.TEACHER:
        raise api_error(403, "forbidden", "Only teachers can edit questions")

    question = await question_repo.get_question(db, question_id)
    if question is None:
        raise api_error(404, "not_found", "Question not found")

    question = await question_repo.update_question(
        db,
        question,
        text=payload.text,
        type=payload.type,
        options=[o.model_dump() for o in payload.options] if payload.options else None,
        answer=payload.answer,
        explanation=payload.explanation,
        difficulty=payload.difficulty,
        node_id=payload.node_id,
    )
    return _to_question_detail(question)
