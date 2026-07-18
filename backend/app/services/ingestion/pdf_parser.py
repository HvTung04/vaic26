"""PDF parser: digital PDF -> raw text (no OCR needed)."""

from __future__ import annotations

from pathlib import Path

import pdfplumber

from app.schemas.ingestion import RawExam, SourceType


def parse_pdf(path: str | Path) -> RawExam:
    text_parts: list[str] = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    return RawExam(
        source_type=SourceType.PDF,
        text="\n".join(text_parts).strip(),
        file_name=Path(path).name,
    )
