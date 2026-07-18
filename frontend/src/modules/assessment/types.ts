export type QuestionOptionKey = 'A' | 'B' | 'C' | 'D';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionOption {
  key: QuestionOptionKey;
  text: string;
}

export type QuestionSource = 'manual' | 'ai' | 'import';

export interface Question {
  id: string;
  order: number;
  prompt: string;
  options: QuestionOption[];
  correctOption: QuestionOptionKey;
  topicTag: string;
  /** Knowledge-graph node this question is auto-labeled against, when parsed/generated. */
  knowledgeNodeId?: string;
  difficulty: QuestionDifficulty;
  points: number;
  explanation?: string;
  referenceImageUrl?: string;
  source?: QuestionSource;
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

