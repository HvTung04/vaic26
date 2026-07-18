"""Thin OpenAI-compatible client. Works with any OpenAI-compatible endpoint
(vision + structured JSON output). Base URL / key from env.
"""

from __future__ import annotations

import os

from openai import OpenAI


def get_client() -> OpenAI:
    return OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY", "sk-placeholder"),
        base_url=os.environ.get("OPENAI_BASE_URL"),  # None -> official OpenAI
    )


def get_model() -> str:
    return os.environ.get("GAPLENS_LLM_MODEL", "gpt-4o")


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
