import { withMockDelay } from "@/services/mockClient";
import { http } from "@/services/httpClient";
import type {
  TeacherOverview,
  StudentInsight,
  LearningPath,
} from "../types";

const TEACHER_OVERVIEW: TeacherOverview = {
  teacherName: "Cô Lan Anh",
  term: "Học kỳ I - 2024",
  studentsNeedingSupport: 4,
  alerts: {
    urgentCount: 4,
    ability: [
      {
        id: "minh-tuan",
        name: "Minh Tuấn",
        category: "ability",
        reason: "-15% Performance",
        severity: "critical",
      },
      {
        id: "bao-ngoc",
        name: "Bảo Ngọc",
        category: "ability",
        reason: "Gap: Hình học",
        severity: "watch",
      },
    ],
    engagement: [
      {
        id: "gia-huy",
        name: "Gia Huy",
        category: "engagement",
        reason: "Nghỉ 3 buổi",
        severity: "critical",
      },
      {
        id: "phuong-linh",
        name: "Phương Linh",
        category: "engagement",
        reason: "Low Time-on-task",
        severity: "watch",
      },
    ],
  },
  knowledgeGaps: [
    {
      id: "topic-a",
      label: "Topic A: Phân số",
      passRate: 42,
      severity: "critical",
      studentsAffected: 10,
    },
    {
      id: "topic-b",
      label: "Topic B: Số thập phân",
      passRate: 88,
      severity: "onTrack",
      studentsAffected: 3,
    },
    {
      id: "topic-c",
      label: "Topic C: Hình học",
      passRate: 56,
      severity: "watch",
      studentsAffected: 8,
    },
    {
      id: "topic-d",
      label: "Topic D",
      passRate: 92,
      severity: "onTrack",
      studentsAffected: 2,
    },
  ],
  moreGapTopicsCount: 3,
  roster: [
    {
      id: "minh-tuan",
      name: "Minh Tuấn",
      grade: "Khối 8",
      overallAccuracy: 58,
      flagged: true,
    },
    {
      id: "bao-ngoc",
      name: "Bảo Ngọc",
      grade: "Khối 8",
      overallAccuracy: 64,
      flagged: true,
    },
    {
      id: "gia-huy",
      name: "Gia Huy",
      grade: "Khối 8",
      overallAccuracy: 71,
      flagged: true,
    },
    {
      id: "phuong-linh",
      name: "Phương Linh",
      grade: "Khối 8",
      overallAccuracy: 69,
      flagged: true,
    },
  ],
};

const STUDENT_INSIGHTS: Record<string, StudentInsight> = {
  "minh-tuan": {
    studentId: "minh-tuan",
    name: "Minh Tuấn",
    className: "Toán - Khối 8",
    performanceHistory: [
      { month: "T11", score: 78, classAverage: 70 },
      { month: "T12", score: 74, classAverage: 71 },
      { month: "T1", score: 69, classAverage: 72 },
      { month: "T2", score: 61, classAverage: 72 },
      { month: "T3", score: 58, classAverage: 73 },
      { month: "T4", score: 55, classAverage: 74 },
      { month: "T5", score: 52, classAverage: 74 },
      { month: "T6", score: 58, classAverage: 75 },
    ],
    aiInsightSummary:
      "Minh Tuấn cho thấy xu hướng giảm hiệu suất liên tục kể từ tháng 12, tập trung chủ yếu ở chủ đề Phân số và Số thập phân. Thời gian hoàn thành bài tập cũng tăng 40%, cho thấy dấu hiệu mất tự tin hơn là thiếu năng lực. Đề xuất ôn tập lại nền tảng Phân số trước khi tiếp tục lộ trình Vận dụng cao.",
    weakTopics: ["Phân số", "Số thập phân", "Tỷ lệ thức"],
    strongTopics: ["Đại số cơ bản", "Hình học phẳng"],
    tasks: [
      {
        id: "task-1",
        subject: "Toán",
        title: "Ôn tập Phân số",
        dueLabel: "Hết hạn trong 3 giờ",
        urgency: "high",
        assessmentId: "assess-1",
      },
      {
        id: "task-2",
        subject: "Toán",
        title: "Tỷ lệ thức nâng cao",
        dueLabel: "Hết hạn ngày mai",
        urgency: "normal",
        assessmentId: "assess-2",
      },
    ],
    quizHistory: [
      {
        id: "quiz-1",
        subject: "TOÁN HỌC",
        title: "Kiểm tra 15 phút - Phân số",
        date: "20/05/2024",
        score: 5.5,
        maxScore: 10,
      },
      {
        id: "quiz-2",
        subject: "TOÁN HỌC",
        title: "Khảo sát Số thập phân",
        date: "10/05/2024",
        score: 6.0,
        maxScore: 10,
      },
      {
        id: "quiz-3",
        subject: "TOÁN HỌC",
        title: "Kiểm tra Giữa kỳ II",
        date: "25/04/2024",
        score: 6.8,
        maxScore: 10,
      },
    ],
    learningPath: {
      goal: "Mục tiêu: Ôn tập nền tảng Phân số",
      status: "ai_suggested",
      steps: [
        {
          id: "basic",
          label: "Cơ bản",
          sublabel: "Hoàn thành",
          status: "completed",
        },
        {
          id: "applied",
          label: "Vận dụng",
          sublabel: "Đang học",
          status: "active",
        },
        {
          id: "advanced",
          label: "Vận dụng cao",
          sublabel: "Khoá",
          status: "locked",
        },
        {
          id: "target",
          label: "Luyện đề",
          sublabel: "Mục tiêu",
          status: "target",
        },
      ],
    },
  },
};

function fallbackInsight(studentId: string): StudentInsight {
  const base = STUDENT_INSIGHTS["minh-tuan"];
  return { ...base, studentId, name: studentId };
}

export async function fetchStudentHub(): Promise<TeacherOverview> {
  return withMockDelay(TEACHER_OVERVIEW);
}

export async function fetchTeacherOverview(): Promise<TeacherOverview> {
  return withMockDelay(TEACHER_OVERVIEW);
}

export async function fetchStudentInsight(
  studentId: string,
): Promise<StudentInsight> {
  const insight = STUDENT_INSIGHTS[studentId] ?? fallbackInsight(studentId);
  return withMockDelay(insight);
}

export async function verifyStudentPath(
  studentId: string,
): Promise<LearningPath> {
  const insight = STUDENT_INSIGHTS[studentId] ?? fallbackInsight(studentId);
  const verified: LearningPath = {
    ...insight.learningPath,
    status: "verified",
  };
  STUDENT_INSIGHTS[studentId] = { ...insight, learningPath: verified };
  return withMockDelay(verified, 700);
}

export async function aiUpdateStudentPath(
  studentId: string,
  note: string,
): Promise<LearningPath> {
  const insight = STUDENT_INSIGHTS[studentId] ?? fallbackInsight(studentId);
  const updated: LearningPath = {
    ...insight.learningPath,
    status: "ai_suggested",
    goal: note.trim()
      ? `Mục tiêu điều chỉnh: ${note.trim()}`
      : insight.learningPath.goal,
  };
  STUDENT_INSIGHTS[studentId] = { ...insight, learningPath: updated };
  return withMockDelay(updated, 1100);
}

// =============================================================================
// Real API bindings — teacher dashboard endpoints
// =============================================================================

export interface PriorityQueueItem {
  studentId: string;
  fullName: string;
  urgency: number;
  reason: string;
  weakNodeIds: string[];
}

export interface GapRadarItem {
  nodeId: string;
  nodeName: string;
  weakRatio: number;
  avgMastery: number;
}

export interface GroupItem {
  groupId: string;
  nodeIds: string[];
  nodeNames: string[];
  studentIds: string[];
}

export type InterventionType = 're_teach' | 'mini_group' | 'peer_support' | 'extra_practice';
export type InterventionStatus = 'suggested' | 'applied' | 'dismissed';

export interface InterventionItem {
  id: string;
  type: InterventionType;
  nodeId: string;
  targetStudentIds: string[];
  rationale: string;
  status: InterventionStatus;
}

export interface ClassProgressPoint {
  period: string;
  avgMastery: number;
  testsCompleted: number;
  studentsImproved: number;
}

export interface ClassResultStudent {
  studentId: string;
  fullName: string;
  score: number | null;
  status: 'submitted' | 'pending';
  submissionId: string | null;
}

export interface ClassResultsData {
  testId: string;
  testTitle: string;
  classAvgScore: number;
  distribution: { scoreRange: string; count: number }[];
  perNodeAccuracy: { nodeId: string; accuracy: number }[];
  students: ClassResultStudent[];
}

export interface StudentTestResult {
  testId: string;
  title: string;
  score: number;
  submittedAt: string;
  weakNodeIds: string[];
}

/** GET /teacher/classes/{classId}/priority-queue */
export async function fetchPriorityQueue(classId: string): Promise<PriorityQueueItem[]> {
  const res = await http.get<{ items: PriorityQueueItem[] }>(
    `/teacher/classes/${classId}/priority-queue`,
  );
  return res.items;
}

/** GET /teacher/classes/{classId}/gap-radar */
export async function fetchGapRadar(classId: string): Promise<GapRadarItem[]> {
  const res = await http.get<{ items: GapRadarItem[] }>(
    `/teacher/classes/${classId}/gap-radar`,
  );
  return res.items;
}

/** GET /teacher/classes/{classId}/groups */
export async function fetchGroups(classId: string): Promise<GroupItem[]> {
  const res = await http.get<{ items: GroupItem[] }>(
    `/teacher/classes/${classId}/groups`,
  );
  return res.items;
}

/** GET /teacher/classes/{classId}/interventions */
export async function fetchInterventions(classId: string): Promise<InterventionItem[]> {
  const res = await http.get<{ items: InterventionItem[] }>(
    `/teacher/classes/${classId}/interventions`,
  );
  return res.items;
}

/** POST /teacher/interventions/{interventionId}/apply */
export async function applyIntervention(
  interventionId: string,
  note?: string,
): Promise<{ id: string; status: string; appliedAt: string }> {
  return http.post(`/teacher/interventions/${interventionId}/apply`, { note });
}

/** GET /teacher/classes/{classId}/progress-timeline */
export async function fetchClassProgressTimeline(classId: string): Promise<ClassProgressPoint[]> {
  const res = await http.get<{ classId: string; timeline: ClassProgressPoint[] }>(
    `/teacher/classes/${classId}/progress-timeline`,
  );
  return res.timeline;
}

/** GET /teacher/classes/{classId}/results?test_id= */
export async function fetchClassResults(
  classId: string,
  testId?: string,
): Promise<ClassResultsData> {
  return http.get<ClassResultsData>(
    `/teacher/classes/${classId}/results`,
    testId ? { test_id: testId } : undefined,
  );
}

/** GET /teacher/students/{studentId}/results */
export async function fetchStudentResultsTeacher(
  studentId: string,
): Promise<StudentTestResult[]> {
  const res = await http.get<{ tests: StudentTestResult[] }>(
    `/teacher/students/${studentId}/results`,
  );
  return res.tests;
}

/** GET /agents/dashboard-insights — AI-generated composite insight */
export async function fetchDashboardInsights(classId: string): Promise<unknown> {
  return http.get('/agents/dashboard-insights', { class_id: classId });
}
