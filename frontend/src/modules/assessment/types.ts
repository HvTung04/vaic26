export type QuestionOptionKey = 'A' | 'B' | 'C' | 'D';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionOption {
  key: QuestionOptionKey;
  text: string;
}

export interface Question {
  id: string;
  order: number;
  prompt: string;
  options: QuestionOption[];
  correctOption: QuestionOptionKey;
  topicTag: string;
  difficulty: QuestionDifficulty;
  points: number;
  explanation?: string;
  referenceImageUrl?: string;
}

export type DifficultyLevel = 'conceptual' | 'applied' | 'advanced' | 'adaptive';

export interface AssessmentContext {
  difficulty: DifficultyLevel;
  subject: string;
  gradeTag: string;
  extraTags: string[];
  estimatedMinutes: number;
  totalPoints: number;
}

export interface AssessmentDraft {
  id: string;
  title: string;
  status: 'draft' | 'published';
  questions: Question[];
  context: AssessmentContext;
}

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  questions: Question[];
  durationMinutes: number;
  sessionCode: string;
}

/** A single select -> change-to-another-option event, used to flag wavered answers. */
export interface AnswerChangeEvent {
  from: QuestionOptionKey | null;
  to: QuestionOptionKey;
  atSeconds: number;
}

export interface QuestionTelemetry {
  questionId: string;
  timeSpentSeconds: number;
  selectedOption: QuestionOptionKey | null;
  visits: number;
  answerChanges: AnswerChangeEvent[];
}

export interface WaveredAnswer {
  questionId: string;
  questionOrder: number;
  changes: AnswerChangeEvent[];
}

export interface TestAttemptSubmission {
  assessmentId: string;
  answers: Record<string, QuestionOptionKey | null>;
  telemetry: QuestionTelemetry[];
  totalDurationSeconds: number;
  waveredAnswers: WaveredAnswer[];
}

export interface QuestionResult {
  question: Question;
  selectedOption: QuestionOptionKey | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  pointsEarned: number;
  reviewNeeded: boolean;
  waverCount: number;
}

export interface ScoreReportData {
  assessmentId: string;
  assessmentTitle: string;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds: number;
  classRank: number;
  classSize: number;
  pointsEarned: number;
  totalPossiblePoints: number;
  finalScorePercent: number;
  questionResults: QuestionResult[];
}
