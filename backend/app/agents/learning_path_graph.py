"""LangGraph wrapper around kg.learning_path.generate_learning_path.

A single-node graph today (fetch state is done by the caller; this node just
runs the grounded LLM-or-template generation). Kept as an explicit graph
rather than a bare function call so retrieval/critique nodes can be inserted
later without changing the call site in app.services.agent_service.
"""

from __future__ import annotations

import asyncio
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.kg.learning_path import generate_learning_path
from app.kg.models import Graph, LearningPath, MasteryRecord


class LearningPathState(TypedDict):
    student_id: str
    grade: int
    mastery_map: dict[str, MasteryRecord]
    graph: Graph
    recent_wrong: list[str]
    result: LearningPath | None


def _generate(state: LearningPathState) -> LearningPathState:
    result = generate_learning_path(
        state["student_id"],
        state["mastery_map"],
        state["graph"],
        grade=state["grade"],
        recent_wrong=state["recent_wrong"],
    )
    return {**state, "result": result}


def _build_graph():
    builder = StateGraph(LearningPathState)
    builder.add_node("generate", _generate)
    builder.set_entry_point("generate")
    builder.add_edge("generate", END)
    return builder.compile()


_compiled = _build_graph()


async def run(
    *,
    student_id: str,
    grade: int,
    mastery_map: dict[str, MasteryRecord],
    graph: Graph,
    recent_wrong: list[str],
) -> LearningPath:
    initial: LearningPathState = {
        "student_id": student_id,
        "grade": grade,
        "mastery_map": mastery_map,
        "graph": graph,
        "recent_wrong": recent_wrong,
        "result": None,
    }
    # generate_learning_path makes a blocking OpenAI call; keep the event loop free.
    final_state = await asyncio.to_thread(_compiled.invoke, initial)
    return final_state["result"]
