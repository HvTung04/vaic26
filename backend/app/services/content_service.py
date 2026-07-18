"""Upload processing pipeline (API_SPEC.md #9/#10): parse -> LLM split -> LLM
tag, staged as QuestionDraft rows for teacher review. Reuses the ingestion/*
modules (Role 1's OCR/tagging logic) instead of ingestion.pipeline.intake_file,
since drafts need to land in Postgres, not the local-JSON bank fallback.
"""

from __future__ import annotations

import asyncio
from pathlib import Path

from ingestion.image_ocr import parse_photo
from ingestion.models import Difficulty as IngestDifficulty
from ingestion.pdf_parser import parse_pdf
from ingestion.splitter import split_exam
from ingestion.tagger import tag_question

from app.db.postgres import async_session_factory
from app.models.question import Difficulty, QuestionType, UploadStatus
from app.repositories import question_repo

_DIFFICULTY_MAP = {
    IngestDifficulty.EASY: Difficulty.EASY,
    IngestDifficulty.MEDIUM: Difficulty.MEDIUM,
    IngestDifficulty.HARD: Difficulty.HARD,
}


async def process_upload(upload_id: str, file_path: str) -> None:
    async with async_session_factory() as db:
        upload = await question_repo.get_upload(db, upload_id)
        if upload is None:
            return
        await question_repo.set_upload_status(db, upload, UploadStatus.PROCESSING)

        try:
            path = Path(file_path)
            raw = await asyncio.to_thread(parse_pdf if path.suffix.lower() == ".pdf" else parse_photo, path)
            splits = await asyncio.to_thread(split_exam, raw)

            drafts = []
            for split in splits:
                tag = await asyncio.to_thread(tag_question, split)
                drafts.append(
                    {
                        "text": split.text,
                        "type": QuestionType.MCQ,
                        "options": split.options,
                        "answer": split.correct_answer,
                        "suggested_node_id": tag.knowledge_nodes[0] if tag.knowledge_nodes else None,
                        "suggested_difficulty": _DIFFICULTY_MAP.get(tag.difficulty),
                        "confidence": tag.confidence,
                    }
                )

            await question_repo.add_drafts(db, upload.id, drafts)
            await question_repo.set_upload_status(db, upload, UploadStatus.DONE)
        except Exception as exc:  # noqa: BLE001 - surface any pipeline failure on the upload record
            await question_repo.set_upload_status(db, upload, UploadStatus.FAILED, error=str(exc))
