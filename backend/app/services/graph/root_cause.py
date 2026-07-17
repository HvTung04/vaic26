import uuid

from app.services.graph.graph_service import GraphService

MASTERY_THRESHOLD = 0.5  # ngưỡng nghi hổng — chốt lại khi có dữ liệu thật, xem contract.md


def diagnose(graph_service: GraphService, student_id: uuid.UUID, wrong_node_id: uuid.UUID) -> dict:
    """
    Sai node X + mastery node cha < MASTERY_THRESHOLD -> nghi hổng node cha, kèm confidence.
    TODO: BE/AI 2 — xem spec.md § Chẩn đoán lỗi theo root-cause.
    """
    raise NotImplementedError
