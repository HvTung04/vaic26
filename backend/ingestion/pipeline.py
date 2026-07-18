"""Pipeline orchestrator: upload -> parse/ocr -> LLM split -> LLM tag -> bank draft.
Teacher reviews drafted questions on platform before approval (see contract.md).
"""

from __future__ import annotations

from pathlib import Path

from .image_ocr import parse_photo
from .models import QuestionDraft, AnswerOption, RawExam, SourceType
from .pdf_parser import parse_pdf
from .splitter import split_exam
from .tagger import tag_question
from .bank_client import push_drafts


def intake_file(path: str | Path) -> list[QuestionDraft]:
    p = Path(path)
    raw: RawExam = parse_pdf(p) if p.suffix.lower() == ".pdf" else parse_photo(p)

    splits = split_exam(raw)
    drafts: list[QuestionDraft] = []
    for s in splits:
        tag = tag_question(s)
        drafts.append(
            QuestionDraft(
                index=s.index,
                text=s.text,
                options=[AnswerOption(key=_k(i), text=t) for i, t in enumerate(s.options)],
                correct_answer=s.correct_answer,
                knowledge_node=tag.knowledge_node,
                difficulty=tag.difficulty,
                confidence=tag.confidence,
                source_type=raw.source_type,
            )
        )
    push_drafts(drafts)
    return drafts


def _k(i: int) -> str:
    return chr(ord("A") + i)
