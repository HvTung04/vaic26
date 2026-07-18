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


def unit_proximity(
    node_id: str,
    current_unit: tuple[int, int],
    graph: Graph,
) -> float:
    """Compute proximity of node to current teaching unit.

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

    # Find the current unit node
    target_id = None
    for nid, n in graph.nodes.items():
        if n.grade == current_unit[0] and n.order == current_unit[1]:
            target_id = nid
            break

    if target_id is None:
        return 0.5

    if node_id == target_id:
        return 1.0

    from .graph import graph_distance

    dist = graph_distance(graph, node_id, target_id)
    if dist < 0:
        return 0.2  # unreachable, low proximity
    return max(0.2, 1.0 - dist * 0.25)


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
) -> list[tuple[str, float]]:
    """Return nodes below threshold, sorted by mastery ASC (weakest first)."""
    weak = [
        (nid, rec.mastery_level)
        for nid, rec in mastery_map.items()
        if rec.mastery_level < threshold
    ]
    return sorted(weak, key=lambda x: x[1])
