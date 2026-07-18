"""Deterministic mastery update. Initial=1.0, decay on wrong answers.
NOT LLM — formula-based, testable, no hallucination risk.
"""

from __future__ import annotations

from .models import MasteryRecord, Graph

# Difficulty weights: harder questions = stronger signal
DIFFICULTY_WEIGHT = {1: 0.10, 2: 0.20, 3: 0.35}

# Minimum answers before trusting mastery (cold-start guard)
MIN_ANSWERS_TO_TRUST = 3


def update_mastery(
    current: float,
    is_correct: bool,
    difficulty: int,
    proximity: float,
) -> float:
    """Update mastery for one answer.

    Args:
        current: current mastery 0.0..1.0
        is_correct: student answer correctness
        difficulty: 1=easy, 2=medium, 3=hard
        proximity: 0.0..1.0, closeness to current teaching unit

    Returns:
        new mastery 0.0..1.0
    """
    if is_correct:
        # Slight boost — confirms mastery. Strongest when hard + close.
        boost = 0.05 * DIFFICULTY_WEIGHT.get(difficulty, 0.2) * proximity
        return min(1.0, current + boost)
    else:
        # Multiplicative decay — harder + closer = bigger drop
        weight = DIFFICULTY_WEIGHT.get(difficulty, 0.2) * proximity
        return max(0.0, current * (1 - weight))


def _parse_node_id(node_id: str) -> tuple[int, int, int] | None:
    """Parse 'L6-t1-B02' -> (grade=6, topic=1, block=2). Returns None on parse fail."""
    try:
        parts = node_id.split("-")
        grade = int(parts[0][1:])  # L6 -> 6
        topic = int(parts[1][1:])  # t1 -> 1
        block = int(parts[2][1:])  # B02 -> 2
        return (grade, topic, block)
    except (IndexError, ValueError):
        return None


def unit_proximity(
    node_id: str,
    current_unit: tuple[int, int],
    graph: Graph,
) -> float:
    """Compute proximity of node to current teaching unit.

    Proximity = grade/topic/block distance (not graph BFS).
    Same grade + close topic/block = high. Different grade = low.

    Args:
        node_id: knowledge node
        current_unit: (grade, topic_order) of current teaching unit
        graph: knowledge graph

    Returns:
        0.0..1.0 proximity score
    """
    node = graph.nodes.get(node_id)
    if not node:
        return 0.5  # unknown node, medium proximity

    parsed = _parse_node_id(node_id)
    if not parsed:
        return 0.5

    node_grade, node_topic, node_block = parsed
    current_grade, current_topic = current_unit

    grade_diff = abs(node_grade - current_grade)
    topic_diff = abs(node_topic - current_topic)
    block_diff = abs(node_block - 1)  # distance from first block of current topic

    if grade_diff == 0 and topic_diff == 0 and block_diff == 0:
        return 1.0  # exact match (first block of current topic)
    elif grade_diff == 0 and topic_diff == 0:
        # Same topic, different block: very close
        return max(0.8, 1.0 - block_diff * 0.1)
    elif grade_diff == 0:
        # Same grade, different topic: topic distance matters
        return max(0.5, 0.9 - topic_diff * 0.15)
    elif grade_diff == 1:
        # Adjacent grade: always lower than same-grade nodes
        return max(0.2, 0.45 - topic_diff * 0.05)
    else:
        # 2+ grades away: floor
        return 0.2


def update_student_mastery(
    mastery_map: dict[str, MasteryRecord],
    node_id: str,
    is_correct: bool,
    difficulty: int,
    proximity: float,
) -> MasteryRecord:
    """Update or create mastery record for a student on a node."""
    if node_id in mastery_map:
        rec = mastery_map[node_id]
        rec.mastery_level = update_mastery(
            rec.mastery_level, is_correct, difficulty, proximity
        )
        rec.answer_count += 1
        rec.weight = DIFFICULTY_WEIGHT.get(difficulty, 0.2) * proximity
    else:
        initial = 1.0
        rec = MasteryRecord(
            student_id="",
            node_id=node_id,
            mastery_level=update_mastery(initial, is_correct, difficulty, proximity),
            weight=DIFFICULTY_WEIGHT.get(difficulty, 0.2) * proximity,
            answer_count=1,
        )
        mastery_map[node_id] = rec
    return rec


def batch_update(
    mastery_map: dict[str, MasteryRecord],
    answers: list[dict],
    graph: Graph,
    current_unit: tuple[int, int],
) -> dict[str, MasteryRecord]:
    """Process a batch of answers and update mastery for all nodes.

    Each answer dict: {node_id, is_correct, difficulty}
    """
    for ans in answers:
        node_id = ans["node_id"]
        prox = unit_proximity(node_id, current_unit, graph)
        update_student_mastery(
            mastery_map,
            node_id,
            ans["is_correct"],
            ans["difficulty"],
            prox,
        )
    return mastery_map


def get_weak_nodes(
    mastery_map: dict[str, MasteryRecord],
    threshold: float = 0.7,
    current_unit: tuple[int, int] | None = None,
    graph: Graph | None = None,
) -> list[tuple[str, float]]:
    """Return nodes below threshold, sorted by mastery ASC then grade proximity.

    Within same mastery tier, current-grade nodes rank higher.
    """
    weak = [
        (nid, rec.mastery_level)
        for nid, rec in mastery_map.items()
        if rec.mastery_level < threshold
    ]

    def _sort_key(item: tuple[str, float]) -> tuple[float, int]:
        nid, mastery = item
        grade_penalty = 0
        if current_unit and graph:
            node = graph.nodes.get(nid)
            if node:
                grade_penalty = abs(node.grade - current_unit[0])
        return (mastery, grade_penalty)

    return sorted(weak, key=_sort_key)
