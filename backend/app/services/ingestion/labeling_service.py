from app.agents.labeling_graph import build_labeling_graph


def label_questions(raw_text: str) -> list[dict]:
    """
    Chạy labeling_graph (LangGraph) để gắn nhãn node kiến thức + độ khó cho từng câu,
    dùng structured output từ LLM, bắt chọn từ node list cố định.
    TODO: BE/AI 1 — xem app/agents/labeling_graph.py và spec.md § Luồng 1.
    """
    graph = build_labeling_graph()
    raise NotImplementedError
