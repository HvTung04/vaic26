"""Photo OCR: phone photo of printed exam -> raw text via vision LLM.
Vietnamese math symbols / LaTeX preserved verbatim.
"""

from __future__ import annotations

import base64
from pathlib import Path

from openai import OpenAI

from app.schemas.ingestion import RawExam, SourceType
from .llm_client import get_client, get_model

_VISION_SYSTEM = (
    "You are an OCR engine for Vietnamese math exams. Transcribe ALL text exactly, "
    "preserving LaTeX and math symbols verbatim. Keep question numbering and option "
    "letters (A, B, C, D). Output only the transcribed text, no commentary."
)


def parse_photo(path: str | Path) -> RawExam:
    client = get_client()
    b64 = base64.b64encode(Path(path).read_bytes()).decode()
    resp = client.chat.completions.create(
        model=get_model(),
        messages=[
            {"role": "system", "content": _VISION_SYSTEM},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    }
                ],
            },
        ],
    )
    return RawExam(
        source_type=SourceType.PHOTO,
        text=resp.choices[0].message.content or "",
        file_name=Path(path).name,
    )
