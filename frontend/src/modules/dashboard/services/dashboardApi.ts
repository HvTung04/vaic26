import { withMockDelay } from "@/services/mockClient";
import { http } from "@/services/httpClient";
import type {
  TeacherOverview,
  StudentInsight,
  LearningPath,
  HeatmapTopic,
  HeatmapStudentRow,
  TopicMasteryBar,
  NeedGroup,
  CurrentLesson,
} from "../types";

// ── Bản đồ thành thạo (mock deterministic) ──────────────────────────────────
// Cột = chủ đề (grade < 8 là nền lớp dưới). Bài đang dạy demo: "Hằng đẳng thức".
const HEATMAP_TOPICS: HeatmapTopic[] = [
  { key: "int", label: "Số nguyên", grade: 6 },
  { key: "frac", label: "Phân số & Số thập phân", grade: 6 },
  { key: "expr7", label: "Biểu thức đại số", grade: 7 },
  { key: "poly", label: "Đa thức nhiều biến", grade: 8 },
  { key: "iden", label: "Hằng đẳng thức đáng nhớ", grade: 8, isCurrentLesson: true },
  { key: "fact", label: "Phân tích đa thức", grade: 8 },
  { key: "pyth", label: "Định lí Pythagore", grade: 8 },
  { key: "pyr", label: "Hình chóp đều", grade: 8 },
];
const CURRENT_TOPIC = HEATMAP_TOPICS.find((t) => t.isCurrentLesson)!;

const HM_SEED: { id: string; name: string; ability: number }[] = [
  { id: "minh-tuan", name: "Minh Tuấn", ability: 0.34 },
  { id: "bao-ngoc", name: "Bảo Ngọc", ability: 0.48 },
  { id: "gia-huy", name: "Gia Huy", ability: 0.41 },
  { id: "phuong-linh", name: "Phương Linh", ability: 0.55 },
  { id: "duc-anh", name: "Đức Anh", ability: 0.83 },
  { id: "thu-ha", name: "Thu Hà", ability: 0.9 },
  { id: "khanh-vy", name: "Khánh Vy", ability: 0.72 },
  { id: "tuan-kiet", name: "Tuấn Kiệt", ability: 0.27 },
  { id: "ngoc-mai", name: "Ngọc Mai", ability: 0.66 },
  { id: "quoc-bao", name: "Quốc Bảo", ability: 0.6 },
  { id: "lan-chi", name: "Lan Chi", ability: 0.5 },
  { id: "hoang-nam", name: "Hoàng Nam", ability: 0.38 },
];

// LCG nhỏ để mock ổn định (không phụ thuộc thứ tự render).
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function bandOf(avg: number): string {
  if (avg >= 0.7) return "Vững";
  if (avg >= 0.55) return "Khá";
  if (avg >= 0.4) return "Cần hỗ trợ";
  return "Nguy cơ";
}

function buildHeatmap(): HeatmapStudentRow[] {
  return HM_SEED.map((s, i) => {
    const rnd = seeded(26 + i * 101);
    const cells: Record<string, number | null> = {};
    for (const t of HEATMAP_TOPICS) {
      if (rnd() < 0.1 && !t.isCurrentLesson) {
        cells[t.key] = null; // chưa test
        continue;
      }
      const bias = t.grade === 8 ? 0.08 : -0.05;
      const m = s.ability + bias + (rnd() - 0.5) * 0.34;
      cells[t.key] = Math.round(Math.min(0.98, Math.max(0.05, m)) * 100) / 100;
    }
    const tested = Object.values(cells).filter((v): v is number => v !== null);
    const avg = tested.reduce((a, b) => a + b, 0) / tested.length;
    const foundationGap = HEATMAP_TOPICS.some(
      (t) => t.grade < 8 && cells[t.key] !== null && (cells[t.key] as number) < 0.4,
    );
    return {
      id: s.id,
      name: s.name,
      band: bandOf(avg),
      avgMastery: Math.round(avg * 100) / 100,
      foundationGap,
      cells,
    };
  }).sort((a, b) => b.avgMastery - a.avgMastery); // giỏi -> yếu
}

const HEATMAP = buildHeatmap();

function buildNeedGroups(rows: HeatmapStudentRow[]): NeedGroup[] {
  return HEATMAP_TOPICS.map((t) => {
    const students = rows
      .filter((r) => r.cells[t.key] !== null && (r.cells[t.key] as number) < 0.6)
      .map((r) => ({ id: r.id, name: r.name }));
    return { topicKey: t.key, topicLabel: t.label, students };
  })
    .filter((g) => g.students.length >= 2)
    .sort((a, b) => b.students.length - a.students.length);
}

const NEED_GROUPS = buildNeedGroups(HEATMAP);

function buildTopicBars(): TopicMasteryBar[] {
  return HEATMAP_TOPICS.map((t) => {
    const counts = { mastered: 0, developing: 0, gap: 0, untested: 0 };
    for (const row of HEATMAP) {
      const m = row.cells[t.key];
      if (m === null) { counts.untested++; continue; }
      if (m >= 0.6) counts.mastered++;
      else if (m >= 0.4) counts.developing++;
      else counts.gap++;
    }
    const total = counts.mastered + counts.developing + counts.gap;
    return {
      key: t.key, label: t.label, grade: t.grade,
      isCurrentLesson: t.isCurrentLesson,
      total, counts,
      passRate: total > 0 ? Math.round((counts.mastered / total) * 100) : 0,
    };
  }).sort((a, b) => a.passRate - b.passRate);
}

const TOPIC_BARS = buildTopicBars();

// % lớp đủ nền (trung bình các chủ đề lớp dưới >= 0.5) để học bài đang dạy.
const CURRENT_LESSON: CurrentLesson = {
  name: CURRENT_TOPIC.label,
  book: "Chân trời sáng tạo",
  topicKey: CURRENT_TOPIC.key,
  readyPct: Math.round(
    (HEATMAP.filter((r) => {
      const nen = HEATMAP_TOPICS.filter((t) => t.grade < 8)
        .map((t) => r.cells[t.key])
        .filter((v): v is number => v !== null);
      return nen.length > 0 && nen.reduce((a, b) => a + b, 0) / nen.length >= 0.5;
    }).length /
      HEATMAP.length) *
      100,
  ),
};

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
  currentLesson: CURRENT_LESSON,
  heatmapTopics: HEATMAP_TOPICS,
  heatmap: HEATMAP,
  topicBars: TOPIC_BARS,
  needGroups: NEED_GROUPS,
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
