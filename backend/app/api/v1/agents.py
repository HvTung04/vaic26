from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import MongoDB
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.schemas.agents import (
    ChatRequest,
    ChatResponse,
    DashboardInsightResponse,
    LearningPathRequest,
    LearningPathResponse,
    RevisionTestRequest,
    RevisionTestResponse,
)
from app.services import agent_service, chat_service

router = APIRouter(prefix="/agents", tags=["agents"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("/learning-path", response_model=LearningPathResponse)
async def learning_path(
    payload: LearningPathRequest, current_user: CurrentUser, db: DbSession, mongo_db: MongoDB
) -> LearningPathResponse:
    result = await agent_service.generate_learning_path(
        db, mongo_db, student_id=payload.student_id, previous_path_id=payload.previous_path_id
    )
    return LearningPathResponse(**result)


@router.post("/revision-test", response_model=RevisionTestResponse)
async def revision_test(
    payload: RevisionTestRequest, current_user: CurrentUser, db: DbSession, mongo_db: MongoDB
) -> RevisionTestResponse:
    result = await agent_service.generate_revision_test(
        db,
        mongo_db,
        student_id=payload.student_id,
        learning_path_id=payload.learning_path_id,
        teacher_note=payload.teacher_note,
        question_count=payload.question_count,
        node_id=payload.node_id,
    )
    return RevisionTestResponse(**result)


@router.get("/dashboard-insights", response_model=DashboardInsightResponse)
async def dashboard_insights(
    class_id: Annotated[str, Query()], current_user: CurrentUser, db: DbSession, mongo_db: MongoDB
) -> DashboardInsightResponse:
    result = await agent_service.generate_dashboard_insights(db, mongo_db, class_id=class_id)
    return DashboardInsightResponse(**result)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest, current_user: CurrentUser, db: DbSession, mongo_db: MongoDB
) -> ChatResponse:
    history = [{"role": m.role, "content": m.content} for m in payload.history]
    reply = await chat_service.chat(
        db, mongo_db, class_id=payload.class_id, message=payload.message, history=history
    )
    return ChatResponse(reply=reply)
