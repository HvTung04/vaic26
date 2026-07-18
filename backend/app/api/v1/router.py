from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    agents,
    auth,
    classes,
    content,
    dashboard,
    graph,
    learning_path,
    ocr,
    practice,
    test_taking,
    tests,
    users,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(classes.router)
api_router.include_router(graph.router)
api_router.include_router(content.router)
api_router.include_router(tests.router)
api_router.include_router(agents.router)
api_router.include_router(ocr.router)
api_router.include_router(test_taking.router)
api_router.include_router(learning_path.router)
api_router.include_router(dashboard.router)
api_router.include_router(practice.router)
