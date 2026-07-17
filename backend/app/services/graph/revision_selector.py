import uuid

WEAK_NODE_COUNT = 3  # 2-3 node yếu nhất, theo plan.md § 1 (BE/AI 2)


def select_revision_questions(student_id: uuid.UUID) -> list[dict]:
    """
    Rule-based: chọn WEAK_NODE_COUNT node yếu nhất, sắp câu hỏi theo thang dễ->khó.
    TODO: BE/AI 2 — xem spec.md § Luồng 3.
    """
    raise NotImplementedError
