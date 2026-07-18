"""Standalone seed + smoke run. Seeds sample questions, runs pipeline in mock
mode (no API), verifies draft output. Runs with or without DB.
"""

from __future__ import annotations

import os

from ingestion.models import QuestionDraft, AnswerOption, SourceType
from ingestion.bank_client import push_drafts

SAMPLE = [
    QuestionDraft(
        index=1,
        text=r"\frac{1}{2} + \frac{1}{3} = ?",
        options=[AnswerOption(key=k, text=t) for k, t in zip("ABCD", ["5/6", "1/6", "2/5", "1/5"])],
        correct_answer="A",
        knowledge_nodes=["L6-t4-B01", "L6-t4-B02"],
        difficulty=1,
        confidence=0.9,
        source_type=SourceType.PDF,
    ),
    QuestionDraft(
        index=2,
        text=r"So sánh \frac{2}{3} và \frac{3}{4}?",
        options=[AnswerOption(key=k, text=t) for k, t in zip("ABCD", ["2/3 > 3/4", "2/3 < 3/4", "bằng nhau", "không xác định"])],
        correct_answer="B",
        knowledge_nodes=["L6-t4-B02"],
        difficulty=2,
        confidence=0.85,
        source_type=SourceType.PHOTO,
    ),
]


def main() -> None:
    os.environ.setdefault("GAPLENS_LOCAL_BANK", "bank.local.json")
    pushed = push_drafts(SAMPLE)
    print(f"seeded {len(pushed)} questions -> {os.environ['GAPLENS_LOCAL_BANK']}")


if __name__ == "__main__":
    main()
