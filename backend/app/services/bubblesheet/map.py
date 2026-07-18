"""Map detected bubble answers to bank question IDs by row order.
Works with both generated sheets and ad-hoc layouts."""

from __future__ import annotations

from .detect import detect_answers


def map_to_bank(
    image_path: str,
    question_ids: list[str],
    calibrate_first: bool = True,
) -> dict[str, str]:
    """Row N -> question_ids[N] -> detected option letter."""
    answers = detect_answers(image_path, calibrate_first=calibrate_first)
    return {
        qid: answers[i]
        for i, qid in enumerate(question_ids)
        if i < len(answers)
    }
