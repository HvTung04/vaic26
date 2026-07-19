export type TestCompletionStatus = 'not_started' | 'in_progress' | 'completed';

export type TestKind = 'weekly' | 'revision' | 'practice';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface TestListItem {
  id: string;
  title: string;
  type: TestKind;
  classId: string;
  createdAt: string;
  status: TestCompletionStatus;
  assignedCount: number;
  submittedCount: number;
}

export interface TestListResult {
  items: TestListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TestListParams {
  classId: string;
  page: number;
  pageSize?: number;
  search?: string;
  type?: TestKind;
}

export type StudentSubmissionStatus = 'submitted' | 'pending';

export interface StudentResultRow {
  studentId: string;
  fullName: string;
  score: number | null;
  status: StudentSubmissionStatus;
  submissionId: string | null;
}

export interface ScoreDistributionBucket {
  scoreRange: string;
  count: number;
}

export interface TestResults {
  testId: string;
  testTitle: string;
  classAvgScore: number;
  distribution: ScoreDistributionBucket[];
  students: StudentResultRow[];
}

export interface TestQuestionTeacherView {
  id: string;
  text: string;
  difficulty: QuestionDifficulty;
  nodeId: string;
  nodeName: string;
  answer: string;
}

export interface TestDetail {
  id: string;
  title: string;
  type: TestKind;
  classId: string;
  status: TestCompletionStatus;
  questions: TestQuestionTeacherView[];
}

export interface SubmissionQuestionResult {
  questionId: string;
  questionText: string;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  timeSpentSeconds: number;
  explanation: string | null;
  rootCauseNodeName: string | null;
}

export interface SubmissionDetail {
  submissionId: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  total: number;
  submittedAt: string;
  results: SubmissionQuestionResult[];
}
