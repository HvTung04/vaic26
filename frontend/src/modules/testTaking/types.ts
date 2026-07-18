export type TestKind = 'weekly' | 'revision' | 'practice';

export type AssignmentStatus = 'pending' | 'in_progress' | 'submitted';

export interface StudentTestListItem {
  testId: string;
  title: string;
  type: TestKind;
  dueAt: string | null;
  status: AssignmentStatus;
}

export type QuestionKind = 'mcq' | 'short_answer';

export interface AttemptQuestion {
  id: string;
  text: string;
  type: QuestionKind;
  /** null for short_answer questions */
  options: string[] | null;
}

export interface Attempt {
  testId: string;
  title: string;
  questions: AttemptQuestion[];
}

export interface SubmitAnswerItem {
  questionId: string;
  answer: string;
  timeSpentSeconds: number;
}

export type SubmissionStatus = 'grading' | 'graded';

export interface SubmitResult {
  submissionId: string;
  testId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt: string;
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  /** MCQ options, so a review UI can show all choices with the student's pick + correct one highlighted. Null for short_answer. */
  options: string[] | null;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  timeSpentSeconds: number;
  explanation: string | null;
  rootCauseNodeId: string | null;
  rootCauseNodeName: string | null;
}

export interface GraphUpdate {
  nodeId: string;
  nodeName: string;
  masteryBefore: number;
  masteryAfter: number;
}

export interface SubmissionResult {
  submissionId: string;
  testId: string;
  testTitle: string;
  status: SubmissionStatus;
  score: number;
  total: number;
  results: QuestionResult[];
  graphUpdates: GraphUpdate[];
}

export interface StudentResultHistoryItem {
  submissionId: string;
  testId: string;
  title: string;
  score: number;
  total: number;
  submittedAt: string;
  weakNodeIds: string[];
}
