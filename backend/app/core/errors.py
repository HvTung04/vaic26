from __future__ import annotations

from fastapi import HTTPException


def api_error(status_code: int, code: str, message: str, details: dict | None = None) -> HTTPException:
    body: dict = {"code": code, "message": message}
    if details is not None:
        body["details"] = details
    return HTTPException(status_code=status_code, detail={"error": body})
