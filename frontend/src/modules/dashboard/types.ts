export type AlertCategory = "ability" | "engagement";

export interface PriorityAlertStudent {
  id: string;
  name: string;
  avatarUrl?: string;
  category: AlertCategory;
  reason: string;
  severity: "critical" | "watch";
}

export interface PriorityAlerts {
  urgentCount: number;
  ability: PriorityAlertStudent[];
  engagement: PriorityAlertStudent[];
}

export type GapSeverity = "critical" | "watch" | "onTrack";

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

/** Một chủ đề (cột) trong bản đồ thành thạo. grade < 8 = kiến thức nền lớp dưới. */
export interface HeatmapTopic {
  key: string;
  label: string;
  grade: number;
  isCurrentLesson?: boolean;
}

/** Một học sinh (hàng) trong bản đồ thành thạo. */
export interface HeatmapStudentRow {
  id: string;
  name: string;
  band: string;
  avgMastery: number;
  /** Có lỗ hổng ở chủ đề nền (lớp dưới). */
  foundationGap: boolean;
  /** topicKey -> mastery 0..1, hoặc null nếu chưa test. */
  cells: Record<string, number | null>;
}

/** Thanh thành thạo 1 chủ đề (dùng cho Stacked Bar visualization). */
export interface TopicMasteryBar {
  key: string;
  label: string;
  grade: number;
  isCurrentLesson?: boolean;
  total: number;
  counts: {
    mastered: number;
    developing: number;
    gap: number;
    untested: number;
  };
  passRate: number;
}

/** Nhóm dạy bù: các học sinh cùng yếu một chủ đề. */
export interface NeedGroup {
  topicKey: string;
  topicLabel: string;
  students: { id: string; name: string }[];
}

export interface TeacherOverview {
  teacherName: string;
  term: string;
  studentsNeedingSupport: number;
  alerts: PriorityAlerts;
  knowledgeGaps: KnowledgeGapTopic[];
  moreGapTopicsCount: number;
  roster: ClassStudentRow[];
  heatmapTopics: HeatmapTopic[];
  heatmap: HeatmapStudentRow[];
  topicBars: TopicMasteryBar[];
  needGroups: NeedGroup[];
}

export interface PerformancePoint {
  month: string;
  score: number;
  classAverage: number;
}

export type PathStatus = "draft" | "ai_suggested" | "verified";

export interface LearningPathStep {
  id: string;
  label: string;
  sublabel: string;
  status: "completed" | "active" | "locked" | "target";
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

