import { http } from '@/services/httpClient';
import type { AttemptQuestion, GraphUpdate, QuestionResult } from '@/modules/testTaking/types';

/**
 * Ad-hoc topic practice — deliberately separate from the test-taking domain
 * (`/tests/{id}/attempt`, `/tests/{id}/submissions`): no Test/Submission/
 * assignment is created and grading is synchronous (no `status=grading`
 * polling), so a student can pick a topic and get instant right/wrong
 * feedback without cluttering their assigned-tests list.
 */

export interface PracticeQuestionSet {
  nodeId: string;
  questions: AttemptQuestion[];
}

export interface PracticeCheckResult {
  results: QuestionResult[];
  graphUpdates: GraphUpdate[];
}

/** GET /practice/questions — just the questions for one node. */
export async function fetchPracticeQuestions(nodeId: string, count = 5): Promise<PracticeQuestionSet> {
  return http.get<PracticeQuestionSet>('/practice/questions', { node_id: nodeId, count });
}

/** POST /practice/check — grades synchronously; still updates KG mastery. */
export async function checkPracticeAnswers(
  answers: { questionId: string; answer: string }[],
): Promise<PracticeCheckResult> {
  return http.post<PracticeCheckResult>('/practice/check', {
    answers: answers.map((a) => ({ question_id: a.questionId, answer: a.answer })),
  });
}
