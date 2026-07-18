"""Root-cause diagnosis: trace prerequisites, score suspects, identify weakest ancestor.
Wrong answer on node X → find the weakest prerequisite in the chain.
"""

from __future__ import annotations

from dataclasses import dataclass

from .models import Graph, MasteryRecord, RootCause
from .graph import get_all_chains


def diagnose_root_cause(
    question_node: str,
    mastery_map: dict[str, MasteryRecord],
    graph: Graph,
    confidence_threshold: float = 0.4,
) -> RootCause:
    """Trace prerequisites to find root cause of wrong answer.

    Algorithm:
    1. Get all prerequisite chains from question_node back to root
    2. For each ancestor, compute suspect_score = (1 - mastery) × chain_weight
    3. chain_weight decays by distance: parent=1.0, grandparent=0.7, great=0.5
    4. Highest suspect_score = root cause node
    5. Confidence = suspect_score / max_possible (normalized 0..1)
    """
    chains = get_all_chains(graph, question_node)
    if not chains:
        return RootCause(
            question_node=question_node,
            root_cause_node=None,
            confidence=0.0,
        )

    # Collect all ancestors with their scores
    suspect_scores: dict[str, float] = {}
    suspect_chains: dict[str, list[str]] = {}

    for chain in chains:
        for i, node_id in enumerate(chain):
            if node_id == question_node:
                continue  # skip the question node itself
            rec = mastery_map.get(node_id)
            mastery = rec.mastery_level if rec else 1.0
            # Chain weight decays by distance from question node
            distance = i  # chain is [question, parent, grandparent, ...]
            chain_weight = {0: 1.0, 1: 0.7, 2: 0.5, 3: 0.3}.get(distance, 0.2)
            score = (1 - mastery) * chain_weight

            if node_id not in suspect_scores or score > suspect_scores[node_id]:
                suspect_scores[node_id] = score
                suspect_chains[node_id] = chain[: i + 1]

    if not suspect_scores:
        return RootCause(
            question_node=question_node,
            root_cause_node=None,
            confidence=0.0,
        )

    # Find the strongest suspect
    sorted_suspects = sorted(suspect_scores.items(), key=lambda x: -x[1])
    best_node, best_score = sorted_suspects[0]

    # Normalize confidence: max possible score = 1.0 × 1.0 = 1.0
    confidence = min(1.0, best_score)

    # Build chain from best suspect to question node
    chain = suspect_chains.get(best_node, [best_node, question_node])

    return RootCause(
        question_node=question_node,
        root_cause_node=best_node if confidence >= confidence_threshold else None,
        confidence=confidence,
        chain=chain,
        all_suspects=sorted_suspects,
    )


def diagnose_all_wrong(
    wrong_answers: list[dict],
    mastery_map: dict[str, MasteryRecord],
    graph: Graph,
    confidence_threshold: float = 0.4,
) -> list[RootCause]:
    """Diagnose root causes for all wrong answers in an exam.

    Each wrong_answer: {node_id: str}
    """
    results = []
    seen_nodes: set[str] = set()
    for ans in wrong_answers:
        node_id = ans["node_id"]
        if node_id in seen_nodes:
            continue  # don't re-diagnose same node
        seen_nodes.add(node_id)
        rc = diagnose_root_cause(node_id, mastery_map, graph, confidence_threshold)
        results.append(rc)
    return results
