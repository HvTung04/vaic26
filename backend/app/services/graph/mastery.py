def update_mastery(
    current_score: float,
    is_correct: bool,
    difficulty: str,
    time_taken_seconds: int | None,
) -> float:
    """
    Công thức mastery update deterministic (không dùng LLM) — xem spec.md § Cách cập nhật graph.
    Input: độ chính xác, độ khó câu hỏi, thời gian làm bài, mức ổn định qua nhiều lần lặp.
    TODO: BE/AI 2 — xem plan.md § 1.
    """
    raise NotImplementedError
