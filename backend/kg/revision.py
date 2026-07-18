"""Revision test selector: rule-based, 2-3 weakest nodes, easy→hard progression.
NOT LLM — deterministic selection from question bank.
"""

from __future__ import annotations

import random

from .models import MasteryRecord, RevisionTest
from .mastery import get_weak_nodes


def select_revision_questions(
    mastery_map: dict[str, MasteryRecord],
    question_bank: list[dict],
    answered_ids: set[str] | None = None,
    max_nodes: int = 3,
    questions_per_node: int = 3,
    max_total: int = 10,
) -> RevisionTest:
    """Select questions for a revision test based on weakest nodes.

    Algorithm:
    1. Find 2-3 weakest nodes (mastery < 0.7)
    2. For each node, pick questions starting easy, escalating to hard
    3. Prefer unanswered questions (avoid repetition)
    4. Shuffle within difficulty tiers
    """
    if answered_ids is None:
        answered_ids = set()

    weak = get_weak_nodes(mastery_map, threshold=0.7)

    # If fewer than 2 weak nodes, still create a focused test
    target_nodes = [nid for nid, _ in weak[:max_nodes]]

    # If no weak nodes at all, return empty
    if not target_nodes:
        return RevisionTest(
            questions=[],
            target_nodes=[],
            difficulty_distribution={"easy": 0, "medium": 0, "hard": 0},
        )

    selected: list[dict] = []
    diff_counts = {"easy": 0, "medium": 0, "hard": 0}

    for node_id in target_nodes:
        # Get questions for this node
        node_questions = [
            q for q in question_bank
            if node_id in q.get("knowledge_nodes", [])
        ]

        # Separate by difficulty
        by_diff = {1: [], 2: [], 3: []}
        for q in node_questions:
            d = q.get("difficulty", 2)
            if d in by_diff:
                by_diff[d].append(q)

        # Prefer unanswered questions
        def priority_sort(questions: list[dict]) -> list[dict]:
            unanswered = [q for q in questions if q.get("id", "") not in answered_ids]
            answered = [q for q in questions if q.get("id", "") in answered_ids]
            random.shuffle(unanswered)
            random.shuffle(answered)
            return unanswered + answered

        # Select: easy first, then medium, then hard
        node_selected: list[dict] = []
        for diff_level in [1, 2, 3]:
            pool = priority_sort(by_diff[diff_level])
            needed = questions_per_node - len(node_selected)
            if needed <= 0:
                break
            take = pool[:needed]
            node_selected.extend(take)
            diff_label = {1: "easy", 2: "medium", 3: "hard"}[diff_level]
            diff_counts[diff_label] += len(take)

        # Shuffle within this node's questions
        random.shuffle(node_selected)
        selected.extend(node_selected)

    # Shuffle across nodes and cap at max_total
    random.shuffle(selected)
    selected = selected[:max_total]

    return RevisionTest(
        questions=selected,
        target_nodes=target_nodes,
        difficulty_distribution=diff_counts,
    )


def get_answered_question_ids(
    answers: list[dict],
) -> set[str]:
    """Extract question IDs that student has already answered."""
    return {a.get("question_id", "") for a in answers if a.get("question_id")}
