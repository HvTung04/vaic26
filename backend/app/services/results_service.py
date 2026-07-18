from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import submission_repo, test_repo
from app.schemas.dashboard import StudentResultsResponse, StudentTestResult


async def get_student_results(db: AsyncSession, student_id: str) -> StudentResultsResponse:
    """Graded submission history for a single student, newest first."""
    submissions = await submission_repo.list_submissions_for_student(db, student_id)
    tests_out = []
    for s in submissions:
        if s.status.value != "graded":
            continue
        test = await test_repo.get_test(db, s.test_id)
        weak_nodes = [g["node_id"] for g in (s.graph_updates or []) if g["mastery_after"] < 0.5]
        tests_out.append(
            StudentTestResult(
                submission_id=str(s.id),
                test_id=str(s.test_id),
                title=test.title if test else str(s.test_id),
                score=(s.score or 0) / (s.total or 1) * 100,
                submitted_at=s.submitted_at,
                weak_node_ids=weak_nodes,
            )
        )
    return StudentResultsResponse(student_id=student_id, tests=tests_out)
