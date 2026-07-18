from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import MongoDB
from app.core.security import CurrentUser, ensure_self_or_teacher
from app.schemas.graph import GraphStateResponse, MasteryHistoryItem, NodeHistoryResponse, NodeState
from app.services import kg_service

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/students/{student_id}/state", response_model=GraphStateResponse)
async def get_student_state(student_id: str, current_user: CurrentUser, mongo_db: MongoDB) -> GraphStateResponse:
    ensure_self_or_teacher(current_user, student_id)
    graph = await kg_service.load_graph(mongo_db)
    mastery_docs = await kg_service.get_mastery_docs(mongo_db, student_id)

    nodes = []
    for node_id, node in graph.nodes.items():
        doc = mastery_docs.get(node_id)
        if doc is None:
            continue  # only report nodes the student has actually attempted
        record = kg_service.record_from_doc(doc)
        nodes.append(
            NodeState(
                node_id=node_id,
                node_name=node.topic_name,
                mastery=record.mastery_level,
                confidence=kg_service.node_confidence(record.answer_count),
                attempts=record.answer_count,
                last_updated=doc["last_updated"],
                needs_review=kg_service.needs_review(record),
            )
        )
    return GraphStateResponse(student_id=student_id, nodes=nodes)


@router.get("/students/{student_id}/nodes/{node_id}/history", response_model=NodeHistoryResponse)
async def get_node_history(
    student_id: str, node_id: str, current_user: CurrentUser, mongo_db: MongoDB
) -> NodeHistoryResponse:
    ensure_self_or_teacher(current_user, student_id)
    history = await kg_service.get_node_history(mongo_db, student_id, node_id)
    items = [
        MasteryHistoryItem(
            mastery=h["mastery"],
            confidence=h["confidence"],
            reason=h["reason"],
            source_submission_id=h.get("source_submission_id"),
            changed_at=h["changed_at"],
        )
        for h in history
    ]
    return NodeHistoryResponse(node_id=node_id, items=items)
