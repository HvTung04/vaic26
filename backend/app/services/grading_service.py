"""Grading pipeline (API_SPEC.md #25/#26): score -> root-cause diagnosis for
wrong answers -> deterministic mastery update. `grade_answers` is the reusable
core (also used by the practice/check endpoint for instant, un-persisted
feedback); `grade_submission` wraps it for the real Test/Submission flow and
runs as a background job so the submit endpoint can return `status=grading`
immediately.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.kg.root_cause import diagnose_root_cause

from app.db.mongodb import get_database
from app.db.postgres import async_session_factory
from app.models.test import AssignmentStatus
from app.repositories import class_repo, question_repo, submission_repo, test_repo
from app.services import kg_service


async def grade_answers(
    db: AsyncSession,
    mongo_db: AsyncIOMotorDatabase,
    *,
    student_id: str,
    answers: list[tuple[str, str]],
    grade: int,
    reason: str,
    source_submission_id: str | None = None,
) -> tuple[list[dict], list[dict]]:
    """Grade a batch of (question_id, submitted_answer) pairs: score each,
    diagnose root-cause for wrong ones, and apply the deterministic mastery
    update to the student's graph. Returns (graded_answers, graph_updates) as
    plain dicts — carries enough detail (question text, correct answer,
    explanation) for a synchronous caller to build a full result response
    without a second DB round-trip.
    """
    question_ids = [qid for qid, _ in answers]
    questions = {str(q.id): q for q in await question_repo.get_questions(db, question_ids)}

    graph = await kg_service.load_graph(mongo_db)
    mastery_map = await kg_service.get_mastery_map(mongo_db, student_id)

    graded_answers: list[dict] = []
    graph_updates: dict[str, dict] = {}

    for question_id, submitted_answer in answers:
        question = questions.get(question_id)
        if question is None:
            continue

        is_correct = submitted_answer.strip().lower() == question.answer.strip().lower()

        root_cause_node_id = None
        root_cause_chain: list[str] = []
        confidence = None
        if not is_correct:
            rc = diagnose_root_cause(question.node_id, mastery_map, graph)
            root_cause_node_id = rc.root_cause_node
            root_cause_chain = rc.chain
            confidence = rc.confidence

        current_unit = kg_service.current_unit_for(graph, question.node_id, grade)
        difficulty_int = {"easy": 1, "medium": 2, "hard": 3}[question.difficulty.value]
        mastery_before, updated_record = await kg_service.apply_answer(
            mongo_db,
            student_id=student_id,
            node_id=question.node_id,
            is_correct=is_correct,
            difficulty=difficulty_int,
            graph=graph,
            current_unit=current_unit,
            reason=reason,
            source_submission_id=source_submission_id,
            existing_record=mastery_map.get(question.node_id),
        )
        # keep mastery_map in sync so later wrong answers in this same batch
        # diagnose against up-to-date state
        mastery_map[question.node_id] = updated_record
        graph_updates[question.node_id] = {
            "node_id": question.node_id,
            "mastery_before": mastery_before,
            "mastery_after": updated_record.mastery_level,
        }

        graded_answers.append(
            {
                "question_id": question_id,
                "question_text": question.text,
                "student_answer": submitted_answer,
                "is_correct": is_correct,
                "correct_answer": question.answer,
                "explanation": question.explanation,
                "root_cause_node_id": root_cause_node_id,
                "root_cause_chain": root_cause_chain,
                "confidence": confidence,
            }
        )

    return graded_answers, list(graph_updates.values())


async def grade_submission(submission_id: str) -> None:
    mongo_db = get_database()

    async with async_session_factory() as db:
        submission = await submission_repo.get_submission(db, submission_id)
        if submission is None:
            return

        test = await test_repo.get_test(db, submission.test_id)
        class_group = await class_repo.get_by_id(db, test.class_id)
        student_id = str(submission.student_id)

        graded_answers, graph_updates = await grade_answers(
            db,
            mongo_db,
            student_id=student_id,
            answers=[(str(a.question_id), a.answer) for a in submission.answers],
            grade=class_group.grade,
            reason="submission_scoring",
            source_submission_id=str(submission.id),
        )
        correct_count = sum(1 for a in graded_answers if a["is_correct"])

        await submission_repo.mark_graded(
            db,
            submission,
            score=correct_count,
            total=len(submission.answers),
            graded_answers=graded_answers,
            graph_updates=graph_updates,
        )

        assignment = await test_repo.get_assignment(db, submission.test_id, submission.student_id)
        if assignment is not None:
            await test_repo.set_assignment_status(db, assignment, AssignmentStatus.SUBMITTED)
