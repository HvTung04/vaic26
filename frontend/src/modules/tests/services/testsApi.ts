import { ApiError, http } from '@/services/httpClient';
import type {
  StudentResultRow,
  SubmissionDetail,
  SubmissionQuestionResult,
  TestCompletionStatus,
  TestDetail,
  TestListItem,
  TestListParams,
  TestListResult,
  TestQuestionTeacherView,
  TestResults,
} from '../types';

/*
 * Real API bindings for the teacher-facing Tests domain.
 *
 * Notes on API vs. mock differences (see also fetch* docs below):
 *  - `GET /tests` returns only base fields (no submitted/assigned counts, no
 *    completion status). We enrich each row from the class-results endpoint.
 *  - There is NO endpoint to edit a test's questions — {@link updateTestQuestions}
 *    intentionally rejects (documented gap).
 *  - Teacher `GET /tests/{id}` gives question `node_id` but no `node_name`
 *    (there is no node-catalog endpoint) — we surface the id as the label.
 */

// ---- Raw API response shapes (post camelCase) ---------------------------

interface ApiTestListItem {
  id: string;
  title: string;
  type: TestListItem['type'];
  classId: string;
  createdAt: string;
}

interface ApiClassResultsStudent {
  studentId: string;
  fullName: string;
  score: number | null;
  status: StudentResultRow['status'];
  submissionId: string | null;
}

interface ApiClassResults {
  testId: string;
  testTitle: string;
  classAvgScore: number;
  distribution: { scoreRange: string; count: number }[];
  perNodeAccuracy: { nodeId: string; accuracy: number }[];
  students: ApiClassResultsStudent[];
}

interface ApiTestQuestion {
  id: string;
  text: string;
  difficulty: TestQuestionTeacherView['difficulty'];
  nodeId: string;
  answer: string;
}

interface ApiTestDetail {
  id: string;
  title: string;
  type: TestDetail['type'];
  classId: string;
  questions: ApiTestQuestion[];
  assignedStudentIds: string[];
}

interface ApiSubmission {
  submissionId: string;
  testId: string;
  testTitle: string | null;
  studentId: string;
  studentName: string | null;
  submittedAt: string;
  score: number;
  total: number;
  results: {
    questionId: string;
    questionText: string | null;
    isCorrect: boolean;
    studentAnswer: string | null;
    correctAnswer: string;
    timeSpentSeconds: number;
    explanation: string | null;
    rootCauseNodeName: string | null;
  }[];
}

// ---- Helpers ------------------------------------------------------------

function completionFromResults(students: ApiClassResultsStudent[]): {
  status: TestCompletionStatus;
  assignedCount: number;
  submittedCount: number;
} {
  const assignedCount = students.length;
  const submittedCount = students.filter((s) => s.status === 'submitted').length;
  const status: TestCompletionStatus =
    submittedCount === 0 ? 'not_started' : submittedCount < assignedCount ? 'in_progress' : 'completed';
  return { status, assignedCount, submittedCount };
}

function fetchClassResults(classId: string, testId: string): Promise<ApiClassResults> {
  return http.get<ApiClassResults>(`/teacher/classes/${classId}/results`, { test_id: testId });
}

// ---- Public API ---------------------------------------------------------

/**
 * GET /tests?class_id — enriched per test with completion status + submitted
 * counts (which the list endpoint itself does not return) from the
 * class-results endpoint.
 */
export async function fetchClassTests(classId: string): Promise<TestListItem[]> {
  const tests = await http.get<ApiTestListItem[]>('/tests', { class_id: classId });
  const enriched = await Promise.all(
    tests.map(async (t) => {
      const results = await fetchClassResults(classId, t.id);
      const { status, assignedCount, submittedCount } = completionFromResults(results.students);
      return {
        id: t.id,
        title: t.title,
        type: t.type,
        classId: t.classId,
        createdAt: t.createdAt,
        status,
        assignedCount,
        submittedCount,
      } satisfies TestListItem;
    }),
  );
  return enriched.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Paginated test list with search/type filter. Uses server-computed status. */
export async function fetchClassTestsPaginated(params: TestListParams): Promise<TestListResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('class_id', params.classId);
  searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('page_size', String(params.pageSize));
  if (params.search) searchParams.set('search', params.search);
  if (params.type) searchParams.set('type', params.type);
  return http.get<TestListResult>(`/tests?${searchParams.toString()}`);
}

/**
 * Class-wide results for one test. The teacher endpoint is nested under the
 * class, so we first resolve the test's class via `GET /tests/{id}`.
 */
export async function fetchTestResults(testId: string): Promise<TestResults> {
  const detail = await http.get<ApiTestDetail>(`/tests/${testId}`);
  const results = await fetchClassResults(detail.classId, testId);
  const students: StudentResultRow[] = results.students.map((s) => ({
    studentId: s.studentId,
    fullName: s.fullName,
    score: s.score === null ? null : Math.round(s.score),
    status: s.status,
    submissionId: s.submissionId,
  }));
  return {
    testId,
    testTitle: results.testTitle,
    classAvgScore: Math.round(results.classAvgScore),
    distribution: results.distribution,
    students,
  };
}

/**
 * Teacher test detail. `status` is derived from class results (the detail
 * endpoint has no status field); question `nodeName` falls back to `nodeId`
 * since there is no node-name catalog endpoint.
 */
export async function fetchTestDetail(testId: string): Promise<TestDetail> {
  const detail = await http.get<ApiTestDetail>(`/tests/${testId}`);
  const results = await fetchClassResults(detail.classId, testId);
  const { status } = completionFromResults(results.students);
  return {
    id: detail.id,
    title: detail.title,
    type: detail.type,
    classId: detail.classId,
    status,
    questions: detail.questions.map((q) => ({
      id: q.id,
      text: q.text,
      difficulty: q.difficulty,
      nodeId: q.nodeId,
      nodeName: q.nodeId, // no node-catalog endpoint; show the id as label
      answer: q.answer,
    })),
  };
}

/**
 * Documented gap: the backend has no endpoint to edit a test's questions.
 * Kept as an explicit rejection so the UI surfaces a clear message instead of
 * silently "saving" to nothing.
 */
export async function updateTestQuestions(): Promise<never> {
  throw new ApiError(
    501,
    'not_supported',
    'Chỉnh sửa nội dung bài test chưa được hỗ trợ ở phía máy chủ.',
  );
}

/** Teacher submission drill-down — a single enriched `GET /submissions/{id}`. */
export async function fetchSubmissionDetail(submissionId: string): Promise<SubmissionDetail> {
  const d = await http.get<ApiSubmission>(`/submissions/${submissionId}`);
  const results: SubmissionQuestionResult[] = d.results.map((r) => ({
    questionId: r.questionId,
    questionText: r.questionText ?? '',
    isCorrect: r.isCorrect,
    studentAnswer: r.studentAnswer ?? '—',
    correctAnswer: r.correctAnswer,
    timeSpentSeconds: r.timeSpentSeconds,
    explanation: r.explanation,
    rootCauseNodeName: r.isCorrect ? null : r.rootCauseNodeName,
  }));
  return {
    submissionId: d.submissionId,
    testId: d.testId,
    testTitle: d.testTitle ?? '',
    studentId: d.studentId,
    studentName: d.studentName ?? d.studentId,
    score: Math.round(d.score),
    total: d.total,
    submittedAt: d.submittedAt,
    results,
  };
}

// =============================================================================
// Test creation + assignment (Phase 4)
// =============================================================================

export interface CreateTestPayload {
  title: string;
  classId: string;
  type: TestListItem['type'];
  nodeIds: string[];
  count: number;
  difficultyMix?: { easy: number; medium: number; hard: number };
}

export interface CreateTestResult {
  id: string;
  title: string;
  type: string;
  classId: string;
  questionIds: string[];
  createdAt: string;
}

/** POST /tests — auto-compose from question bank. */
export async function createTest(payload: CreateTestPayload): Promise<CreateTestResult> {
  return http.post<CreateTestResult>('/tests', {
    title: payload.title,
    class_id: payload.classId,
    type: payload.type,
    auto_compose: {
      node_ids: payload.nodeIds,
      count: payload.count,
      difficulty_mix: payload.difficultyMix ?? null,
    },
  });
}

/** POST /tests/{testId}/assign — assign test to class or specific students. */
export async function assignTest(
  testId: string,
  classId: string,
  studentIds?: string[],
): Promise<{ testId: string; assignedStudentIds: string[] }> {
  return http.post(`/tests/${testId}/assign`, {
    class_id: classId,
    student_ids: studentIds ?? null,
  });
}
