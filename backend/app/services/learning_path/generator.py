import uuid

from app.agents.learning_path_graph import build_learning_path_graph


def generate_learning_path(student_id: uuid.UUID) -> dict:
    """
    Graph state hiện tại -> LangGraph flow -> LLM sinh lời giải thích + thứ tự ôn
    (foundation/bridge/application). TODO: BE/AI 2 — xem spec.md § Personalized practice path.
    """
    graph = build_learning_path_graph()
    raise NotImplementedError
