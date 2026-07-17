from langgraph.graph import END, StateGraph

from app.agents.state import LabelingState
from app.services.llm.provider import get_llm


def split_questions(state: LabelingState) -> LabelingState:
    """TODO: BE/AI 1 — tách raw_text thành list câu hỏi."""
    raise NotImplementedError


def label_question(state: LabelingState) -> LabelingState:
    """TODO: BE/AI 1 — gọi LLM label vùng kiến thức + độ khó (structured output, bắt chọn từ node list cố định)."""
    llm = get_llm()
    raise NotImplementedError


def has_more_questions(state: LabelingState) -> str:
    if state["current_index"] < len(state["questions"]):
        return "label_question"
    return END


def build_labeling_graph():
    """Skeleton: split -> label từng câu (lặp) -> kết thúc. Xem spec.md § Luồng 1."""
    graph = StateGraph(LabelingState)
    graph.add_node("split_questions", split_questions)
    graph.add_node("label_question", label_question)
    graph.set_entry_point("split_questions")
    graph.add_edge("split_questions", "label_question")
    graph.add_conditional_edges(
        "label_question", has_more_questions, {"label_question": "label_question", END: END}
    )
    return graph.compile()
