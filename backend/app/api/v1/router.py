from fastapi import APIRouter

from app.api.v1 import (
    auth,
    bubble_sheet,
    diagnosis,
    graph,
    ingestion,
    learning_path,
    revision_test,
    students,
    teachers,
    tests,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ingestion.router, prefix="/ingestion", tags=["ingestion"])  # BE/AI 1
api_router.include_router(bubble_sheet.router, prefix="/bubble-sheet", tags=["bubble-sheet"])  # BE/AI 1
api_router.include_router(graph.router, prefix="/graph", tags=["graph"])  # BE/AI 2
api_router.include_router(diagnosis.router, prefix="/diagnosis", tags=["diagnosis"])  # BE/AI 2
api_router.include_router(learning_path.router, prefix="/learning-path", tags=["learning-path"])  # BE/AI 2
api_router.include_router(revision_test.router, prefix="/revision-test", tags=["revision-test"])  # BE/AI 2
api_router.include_router(students.router, prefix="/students", tags=["students"])  # BE/AI 3
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])  # BE/AI 3
api_router.include_router(tests.router, prefix="/tests", tags=["tests"])  # BE/AI 3
