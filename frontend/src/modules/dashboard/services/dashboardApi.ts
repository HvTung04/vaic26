import { withMockDelay } from "@/services/mockClient";
import type {
  TeacherOverview,
  StudentInsight,
  StudentHubData,
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
        assessmentId: "on-tap-phan-so",
      },
      {
        id: "task-2",
        subject: "Toán",
        title: "Tỷ lệ thức nâng cao",
        dueLabel: "Hết hạn ngày mai",
        urgency: "normal",
        assessmentId: "ty-le-thuc",
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

const STUDENT_HUB: StudentHubData = {
  studentId: "minh-anh",
  name: "Nguyễn Minh Anh",
  className: "Học sinh lớp 12A1",
  points: 1250,
  dailyStreak: 12,
  performanceHistory: [
    { month: "T11", score: 72, classAverage: 70 },
    { month: "T12", score: 76, classAverage: 71 },
    { month: "T1", score: 79, classAverage: 72 },
    { month: "T2", score: 81, classAverage: 72 },
    { month: "T3", score: 85, classAverage: 73 },
    { month: "T4", score: 88, classAverage: 74 },
    { month: "T5", score: 90, classAverage: 74 },
    { month: "T6", score: 92, classAverage: 75 },
  ],
  tasks: [
    {
      id: "task-1",
      subject: "Toán",
      title: "Giải tích 12",
      dueLabel: "Hết hạn trong 2 giờ",
      urgency: "high",
      assessmentId: "giai-tich-12",
    },
    {
      id: "task-2",
      subject: "Vật Lý",
      title: "Sóng cơ học",
      dueLabel: "Hết hạn ngày mai",
      urgency: "normal",
      assessmentId: "song-co-hoc",
    },
  ],
  quizHistory: [
    {
      id: "quiz-1",
      subject: "TOÁN HỌC",
      title: "Khảo sát chất lượng Tháng 10",
      date: "15/10/2023",
      score: 9.5,
      maxScore: 10,
    },
    {
      id: "quiz-2",
      subject: "VẬT LÝ",
      title: "Kiểm tra Giữa kỳ I",
      date: "12/10/2023",
      score: 8.2,
      maxScore: 10,
    },
    {
      id: "quiz-3",
      subject: "HÓA HỌC",
      title: "Kiểm tra 15 phút - Este",
      date: "05/10/2023",
      score: 7.0,
      maxScore: 10,
    },
  ],
  learningPath: {
    goal: "Dựa trên mục tiêu Đại học Bách Khoa",
    status: "verified",
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
};

export async function fetchTeacherOverview(): Promise<TeacherOverview> {
  return withMockDelay(TEACHER_OVERVIEW);
}

export async function fetchStudentInsight(
  studentId: string,
): Promise<StudentInsight> {
  const insight = STUDENT_INSIGHTS[studentId] ?? fallbackInsight(studentId);
  return withMockDelay(insight);
}

export async function fetchStudentHub(): Promise<StudentHubData> {
  return withMockDelay(STUDENT_HUB);
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
