from langgraph.graph import END, StateGraph

from app.agents.state import LearningPathState
from app.services.llm.provider import get_llm


def analyze_graph_state(state: LearningPathState) -> LearningPathState:
    """TODO: BE/AI 2 — đọc graph state hiện tại, xác định node yếu / cần ôn."""
    raise NotImplementedError


def generate_explanation(state: LearningPathState) -> LearningPathState:
    """TODO: BE/AI 2 — LLM sinh lời giải thích ngắn cho từng node trong path (grounding theo graph)."""
    llm = get_llm()
    raise NotImplementedError


def order_path(state: LearningPathState) -> LearningPathState:
    """TODO: BE/AI 2 — sắp thứ tự foundation -> bridge -> application."""
    raise NotImplementedError


def build_learning_path_graph():
    """Skeleton: analyze -> explain -> order. Xem spec.md § Personalized practice path."""
    graph = StateGraph(LearningPathState)
    graph.add_node("analyze_graph_state", analyze_graph_state)
    graph.add_node("generate_explanation", generate_explanation)
    graph.add_node("order_path", order_path)
    graph.set_entry_point("analyze_graph_state")
    graph.add_edge("analyze_graph_state", "generate_explanation")
    graph.add_edge("generate_explanation", "order_path")
    graph.add_edge("order_path", END)
    return graph.compile()
