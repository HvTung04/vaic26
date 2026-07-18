"""Submission grading pipeline (API_SPEC.md #25/#26): score -> root-cause
diagnosis for wrong answers -> deterministic mastery update, all inside one
background job so the submit endpoint can return `status=grading` immediately.
"""

from __future__ import annotations

from kg.root_cause import diagnose_root_cause

from app.db.mongodb import get_database
from app.db.postgres import async_session_factory
from app.models.test import AssignmentStatus
from app.repositories import class_repo, question_repo, submission_repo, test_repo
from app.services import kg_service


async def grade_submission(submission_id: str) -> None:
    mongo_db = get_database()

    async with async_session_factory() as db:
        submission = await submission_repo.get_submission(db, submission_id)
        if submission is None:
            return

        test = await test_repo.get_test(db, submission.test_id)
        class_group = await class_repo.get_by_id(db, test.class_id)
        question_ids = [a.question_id for a in submission.answers]
        questions = {str(q.id): q for q in await question_repo.get_questions(db, question_ids)}

        graph = await kg_service.load_graph(mongo_db)
        student_id = str(submission.student_id)
        mastery_map = await kg_service.get_mastery_map(mongo_db, student_id)

        graded_answers: list[dict] = []
        graph_updates: dict[str, dict] = {}
        correct_count = 0

        for answer in submission.answers:
            question = questions.get(str(answer.question_id))
            if question is None:
                continue

            is_correct = answer.answer.strip().lower() == question.answer.strip().lower()
            correct_count += int(is_correct)

            root_cause_node_id = None
            root_cause_chain: list[str] = []
            confidence = None
            if not is_correct:
                rc = diagnose_root_cause(question.node_id, mastery_map, graph)
                root_cause_node_id = rc.root_cause_node
                root_cause_chain = rc.chain
                confidence = rc.confidence

            current_unit = kg_service.current_unit_for(graph, question.node_id, class_group.grade)
            difficulty_int = {"easy": 1, "medium": 2, "hard": 3}[question.difficulty.value]
            mastery_before, updated_record = await kg_service.apply_answer(
                mongo_db,
                student_id=student_id,
                node_id=question.node_id,
                is_correct=is_correct,
                difficulty=difficulty_int,
                graph=graph,
                current_unit=current_unit,
                reason="submission_scoring",
                source_submission_id=str(submission.id),
                existing_record=mastery_map.get(question.node_id),
            )
            # keep mastery_map in sync so later wrong answers in this same
            # submission diagnose against up-to-date state
            mastery_map[question.node_id] = updated_record
            graph_updates[question.node_id] = {
                "node_id": question.node_id,
                "mastery_before": mastery_before,
                "mastery_after": updated_record.mastery_level,
            }

            graded_answers.append(
                {
                    "question_id": str(answer.question_id),
                    "is_correct": is_correct,
                    "root_cause_node_id": root_cause_node_id,
                    "root_cause_chain": root_cause_chain,
                    "confidence": confidence,
                }
            )

        await submission_repo.mark_graded(
            db,
            submission,
            score=correct_count,
            total=len(submission.answers),
            graded_answers=graded_answers,
            graph_updates=list(graph_updates.values()),
        )

        assignment = await test_repo.get_assignment(db, submission.test_id, submission.student_id)
        if assignment is not None:
            await test_repo.set_assignment_status(db, assignment, AssignmentStatus.SUBMITTED)
