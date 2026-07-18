import { http } from '@/services/httpClient';
import type {
  Attempt,
  GraphUpdate,
  QuestionResult,
  StudentResultHistoryItem,
  StudentTestListItem,
  SubmissionResult,
  SubmitAnswerItem,
  SubmitResult,
} from '../types';

/*
 * Real API bindings for the student-facing Test-Taking domain.
 *
 * Notes on API vs. mock:
 *  - `GET /students/{id}/results` returns `score` as a percentage with no
 *    `total`; we normalize to score=<percent>, total=100 so the FE's
 *    score/total*100 rendering stays correct.
 *  - Request bodies must be snake_case (the httpClient only camelCases
 *    responses), so submit/revision payloads are built explicitly.
 *  - `POST /agents/revision-test` targets a whole learning path, not a single
 *    node — we resolve the student's current path id first; the CTA's nodeId is
 *    advisory only.
 */

// ---- Raw API shapes (post camelCase) ------------------------------------

interface ApiStudentResult {
  submissionId: string;
  testId: string;
  title: string;
  score: number; // percentage 0-100
  submittedAt: string;
  weakNodeIds: string[];
}

interface ApiSubmissionResult {
  submissionId: string;
  testId: string;
  testTitle: string | null;
  status: SubmissionResult['status'];
  score: number;
  total: number;
  results: {
    questionId: string;
    questionText: string | null;
    isCorrect: boolean;
    studentAnswer: string | null;
    correctAnswer: string;
    explanation: string | null;
    rootCauseNodeId: string | null;
    rootCauseNodeName: string | null;
  }[];
  graphUpdates: GraphUpdate[];
}

interface ApiRevisionTest {
  testId: string;
  studentId: string;
  questionIds: string[];
  targetNodeIds: string[];
}

// ---- Public API ---------------------------------------------------------

/** GET /students/{id}/tests?status= */
export async function fetchStudentTests(
  studentId: string,
  status?: string,
): Promise<StudentTestListItem[]> {
  return http.get<StudentTestListItem[]>(`/students/${studentId}/tests`, { status });
}

/** GET /tests/{id}/attempt — exam view, correct answers hidden. */
export async function fetchAttempt(testId: string): Promise<Attempt> {
  return http.get<Attempt>(`/tests/${testId}/attempt`);
}

/** POST /tests/{id}/submissions — returns immediately with status=grading. */
export async function submitAttempt(
  testId: string,
  studentId: string,
  answers: SubmitAnswerItem[],
): Promise<SubmitResult> {
  return http.post<SubmitResult>(`/tests/${testId}/submissions`, {
    student_id: studentId,
    answers: answers.map((a) => ({
      question_id: a.questionId,
      answer: a.answer,
      time_spent_seconds: a.timeSpentSeconds,
    })),
  });
}

/** GET /submissions/{id} — poll until status=graded (see useSubmissionResult). */
export async function fetchSubmissionResult(submissionId: string): Promise<SubmissionResult> {
  const d = await http.get<ApiSubmissionResult>(`/submissions/${submissionId}`);
  const results: QuestionResult[] = d.results.map((r) => ({
    questionId: r.questionId,
    questionText: r.questionText ?? '',
    isCorrect: r.isCorrect,
    studentAnswer: r.studentAnswer ?? '',
    correctAnswer: r.correctAnswer,
    explanation: r.explanation,
    rootCauseNodeId: r.rootCauseNodeId,
    rootCauseNodeName: r.rootCauseNodeName,
  }));
  return {
    submissionId: d.submissionId,
    testId: d.testId,
    testTitle: d.testTitle ?? '',
    status: d.status,
    score: d.score,
    total: d.total,
    results,
    graphUpdates: d.graphUpdates,
  };
}

/** GET /students/{id}/results — self-view score history (percent → /100). */
export async function fetchStudentResults(studentId: string): Promise<StudentResultHistoryItem[]> {
  const res = await http.get<{ tests: ApiStudentResult[] }>(`/students/${studentId}/results`);
  return res.tests
    .map((t) => ({
      submissionId: t.submissionId,
      testId: t.testId,
      title: t.title,
      score: Math.round(t.score),
      total: 100,
      submittedAt: t.submittedAt,
      weakNodeIds: t.weakNodeIds,
    }))
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

export interface RevisionTestResult {
  testId: string;
  targetNodeIds: string[];
  questionCount: number;
}

/**
 * POST /agents/revision-test, scoped to a single node — used when the student
 * picks a topic directly (e.g. from the learning-path practice picker). The
 * endpoint still requires a `learning_path_id`, so we resolve the student's
 * current path first; server-side, passing `node_id` skips the "weakest node"
 * auto-selection and pulls questions for exactly that node.
 */
export async function generateRevisionTest(
  studentId: string,
  nodeId: string,
  questionCount?: number,
): Promise<RevisionTestResult> {
  const path = await http.get<{ pathId: string }>(`/students/${studentId}/learning-path`);
  const res = await http.post<ApiRevisionTest>('/agents/revision-test', {
    student_id: studentId,
    learning_path_id: path.pathId,
    node_id: nodeId,
    question_count: questionCount,
  });
  return {
    testId: res.testId,
    targetNodeIds: res.targetNodeIds,
    questionCount: res.questionIds.length,
  };
}
