from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import MongoDB
from app.core.errors import api_error
from app.core.security import CurrentUser
from app.db.postgres import get_db
from app.repositories import class_repo, question_repo
from app.schemas.practice import (
    PracticeCheckRequest,
    PracticeCheckResponse,
    PracticeQuestionsResponse,
)
from app.schemas.test_taking import AttemptQuestion, GraphUpdate, QuestionResult
from app.services import grading_service, kg_service

router = APIRouter(prefix="/practice", tags=["practice"])

DbSession = Annotated[AsyncSession, Depends(get_db)]

DEFAULT_QUESTION_COUNT = 5


@router.get("/questions", response_model=PracticeQuestionsResponse)
async def get_practice_questions(
    current_user: CurrentUser,
    db: DbSession,
    node_id: Annotated[str, Query()],
    count: Annotated[int, Query()] = DEFAULT_QUESTION_COUNT,
) -> PracticeQuestionsResponse:
    """Just the questions for one node — no Test/Submission/assignment is
    created (unlike /agents/revision-test). Pair with POST /practice/check to
    grade answers instantly, for lightweight ad-hoc practice."""
    questions = await question_repo.find_for_auto_compose(db, node_ids=[node_id], count=count)
    if not questions:
        raise api_error(404, "no_questions", "No questions available for this node")

    return PracticeQuestionsResponse(
        node_id=node_id,
        questions=[
            AttemptQuestion(
                id=str(q.id),
                text=q.text,
                type=q.type.value,
                options=[o["text"] for o in q.options] if q.options else None,
            )
            for q in questions
        ],
    )


@router.post("/check", response_model=PracticeCheckResponse)
async def check_practice_answers(
    payload: PracticeCheckRequest, current_user: CurrentUser, db: DbSession, mongo_db: MongoDB
) -> PracticeCheckResponse:
    """Grade a batch of practice answers synchronously — right/wrong,
    explanation, root-cause and mastery updates all come back immediately, no
    polling. Still updates the student's knowledge-graph mastery (reason=
    revision_result) so ad-hoc practice keeps informing the learning path,
    just without a persisted Test/Submission."""
    if not payload.answers:
        raise api_error(400, "empty_answers", "No answers submitted")

    student_id = str(current_user.id)
    class_ids = await class_repo.list_class_ids_for_student(db, student_id)
    class_group = await class_repo.get_by_id(db, class_ids[0]) if class_ids else None
    grade = class_group.grade if class_group else 0

    graded_answers, graph_updates = await grading_service.grade_answers(
        db,
        mongo_db,
        student_id=student_id,
        answers=[(a.question_id, a.answer) for a in payload.answers],
        grade=grade,
        reason="revision_result",
    )

    graph = await kg_service.load_graph(mongo_db)
    node_names = {nid: node.topic_name for nid, node in graph.nodes.items()}

    def root_cause_name(a: dict) -> str | None:
        node_id = a["root_cause_node_id"] or (a["root_cause_chain"][0] if a["root_cause_chain"] else None)
        return node_names.get(node_id) if node_id else None

    results = [
        QuestionResult(
            question_id=a["question_id"],
            question_text=a["question_text"],
            options=a["options"],
            is_correct=a["is_correct"],
            student_answer=a["student_answer"],
            correct_answer=a["correct_answer"],
            explanation=a["explanation"],
            root_cause_node_id=a["root_cause_node_id"],
            root_cause_node_name=root_cause_name(a),
            root_cause_chain=a["root_cause_chain"],
            confidence=a["confidence"],
        )
        for a in graded_answers
    ]
    graph_updates_out = [
        GraphUpdate(
            node_id=g["node_id"],
            node_name=node_names.get(g["node_id"]),
            mastery_before=g["mastery_before"],
            mastery_after=g["mastery_after"],
        )
        for g in graph_updates
    ]

    return PracticeCheckResponse(results=results, graph_updates=graph_updates_out)
