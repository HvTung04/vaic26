"""Map detected bubble answers to bank question IDs by row order."""

from __future__ import annotations

from .detect import detect_answers


def map_to_bank(image_path: str, question_ids: list[str]) -> dict[str, str]:
    """row N -> question_ids[N] -> detected option."""
    answers = detect_answers(image_path)
    return {
        qid: answers[i]
        for i, qid in enumerate(question_ids)
        if i < len(answers)
    }
