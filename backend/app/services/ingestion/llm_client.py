"""Thin OpenAI-compatible client. Works with any OpenAI-compatible endpoint
(vision + structured JSON output). Base URL / key from env.
"""

from __future__ import annotations

from openai import OpenAI

from app.core.config import get_settings


def get_client() -> OpenAI:
    s = get_settings()
    return OpenAI(
        api_key=s.openai_api_key or "sk-placeholder",
        base_url=s.openai_base_url,
    )


def get_model() -> str:
    return get_settings().gary_llm_model


def structured_completion(
    *,
    system: str,
    user: str,
    json_schema: dict,
    schema_name: str = "response",
) -> dict:
    """Call chat completion with strict JSON-schema structured output."""
    client = get_client()
    resp = client.chat.completions.create(
        model=get_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": schema_name, "schema": json_schema},
        },
    )
    import json as _json

    return _json.loads(resp.choices[0].message.content or "{}")
