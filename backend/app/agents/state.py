from typing import TypedDict


class LabelingState(TypedDict):
    """State cho labeling_graph — xem spec.md § Luồng 1."""

    raw_text: str
    questions: list[str]
    current_index: int
    labeled_questions: list[dict]


class LearningPathState(TypedDict):
    """State cho learning_path_graph — xem spec.md § Personalized practice path."""

    student_id: str
    graph_snapshot: dict
    weak_nodes: list[str]
    explanation: str
    path: list[dict]
