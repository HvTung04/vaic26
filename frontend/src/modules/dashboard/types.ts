export type AlertCategory = 'ability' | 'engagement';

export interface PriorityAlertStudent {
  id: string;
  name: string;
  avatarUrl?: string;
  category: AlertCategory;
  reason: string;
  severity: 'critical' | 'watch';
}

export interface PriorityAlerts {
  urgentCount: number;
  ability: PriorityAlertStudent[];
  engagement: PriorityAlertStudent[];
}

export type GapSeverity = 'critical' | 'watch' | 'onTrack';

export interface KnowledgeGapTopic {
  id: string;
  label: string;
  passRate: number;
  severity: GapSeverity;
  studentsAffected: number;
}

export interface ClassStudentRow {
  id: string;
  name: string;
  avatarUrl?: string;
  grade: string;
  overallAccuracy: number;
  flagged: boolean;
}

export interface TeacherOverview {
  teacherName: string;
  term: string;
  studentsNeedingSupport: number;
  alerts: PriorityAlerts;
  knowledgeGaps: KnowledgeGapTopic[];
  moreGapTopicsCount: number;
  roster: ClassStudentRow[];
}

export interface PerformancePoint {
  month: string;
  score: number;
  classAverage: number;
}

export type PathStatus = 'draft' | 'ai_suggested' | 'verified';

export interface LearningPathStep {
  id: string;
  label: string;
  sublabel: string;
  status: 'completed' | 'active' | 'locked' | 'target';
}

export interface LearningPath {
  goal: string;
  status: PathStatus;
  steps: LearningPathStep[];
}

export interface StudentInsight {
  studentId: string;
  name: string;
  avatarUrl?: string;
  className: string;
  performanceHistory: PerformancePoint[];
  aiInsightSummary: string;
  weakTopics: string[];
  strongTopics: string[];
  learningPath: LearningPath;
  tasks: StudentTask[];
  quizHistory: QuizAttempt[];
}

export interface StudentTask {
  id: string;
  subject: string;
  title: string;
  dueLabel: string;
  urgency: 'high' | 'normal';
  assessmentId: string;
}

export interface QuizAttempt {
  id: string;
  subject: string;
  title: string;
  date: string;
  score: number;
  maxScore: number;
}

export interface StudentHubData {
  studentId: string;
  name: string;
  className: string;
  avatarUrl?: string;
  points: number;
  dailyStreak: number;
  performanceHistory: PerformancePoint[];
  tasks: StudentTask[];
  quizHistory: QuizAttempt[];
  learningPath: LearningPath;
}
