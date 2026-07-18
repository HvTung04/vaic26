import { withMockDelay } from '@/services/mockClient';
import type {
  QuestionDifficulty,
  ScoreDistributionBucket,
  StudentResultRow,
  SubmissionDetail,
  SubmissionQuestionResult,
  TestDetail,
  TestKind,
  TestListItem,
  TestQuestionTeacherView,
  TestResults,
} from '../types';

export const DEFAULT_CLASS_ID = 'khoi-8-toan';

interface MockStudent {
  id: string;
  fullName: string;
}

const STUDENTS: MockStudent[] = [
  { id: 'minh-tuan', fullName: 'Minh Tuấn' },
  { id: 'bao-ngoc', fullName: 'Bảo Ngọc' },
  { id: 'gia-huy', fullName: 'Gia Huy' },
  { id: 'phuong-linh', fullName: 'Phương Linh' },
  { id: 'duc-anh', fullName: 'Đức Anh' },
];

interface MockAnswer {
  isCorrect: boolean;
  studentAnswer: string;
}

interface MockSubmission {
  submissionId: string;
  studentId: string;
  submittedAt: string;
  answersByQuestionId: Record<string, MockAnswer>;
}

interface MockTest {
  id: string;
  title: string;
  type: TestKind;
  classId: string;
  createdAt: string;
  questions: TestQuestionTeacherView[];
  submissions: MockSubmission[];
}

function q(
  id: string,
  text: string,
  difficulty: QuestionDifficulty,
  nodeId: string,
  nodeName: string,
  answer: string,
): TestQuestionTeacherView {
  return { id, text, difficulty, nodeId, nodeName, answer };
}

const TESTS: MockTest[] = [
  {
    id: 'test-phan-so',
    title: 'Kiểm tra 15 phút - Phân số',
    type: 'weekly',
    classId: DEFAULT_CLASS_ID,
    createdAt: '2024-05-20T08:00:00Z',
    questions: [
      q('q1', 'Rút gọn phân số 18/24 về dạng tối giản.', 'easy', 'node-phan-so-rut-gon', 'Rút gọn phân số', '3/4'),
      q('q2', 'Tính 2/3 + 1/6.', 'medium', 'node-phan-so-cong-tru', 'Cộng trừ phân số', '5/6'),
      q('q3', 'So sánh hai phân số 5/8 và 3/5.', 'medium', 'node-phan-so-so-sanh', 'So sánh phân số', '5/8 > 3/5'),
      q('q4', 'Tính 3/4 × 2/9.', 'hard', 'node-phan-so-nhan-chia', 'Nhân chia phân số', '1/6'),
      q('q5', 'Một lớp có 40 học sinh, 3/8 là học sinh nữ. Hỏi có bao nhiêu học sinh nữ?', 'hard', 'node-phan-so-ung-dung', 'Ứng dụng phân số', '15'),
    ],
    submissions: STUDENTS.map((s, i) => ({
      submissionId: `sub-phan-so-${s.id}`,
      studentId: s.id,
      submittedAt: '2024-05-21T09:00:00Z',
      answersByQuestionId: {
        q1: { isCorrect: i !== 1, studentAnswer: i !== 1 ? '3/4' : '4/3' },
        q2: { isCorrect: i !== 1, studentAnswer: i !== 1 ? '5/6' : '1/2' },
        q3: { isCorrect: i % 2 === 0, studentAnswer: i % 2 === 0 ? '5/8 > 3/5' : '3/5 > 5/8' },
        q4: { isCorrect: i !== 1 && i !== 3, studentAnswer: i !== 1 && i !== 3 ? '1/6' : '2/3' },
        q5: { isCorrect: i !== 1, studentAnswer: i !== 1 ? '15' : '12' },
      },
    })),
  },
  {
    id: 'test-so-thap-phan',
    title: 'Khảo sát Số thập phân',
    type: 'practice',
    classId: DEFAULT_CLASS_ID,
    createdAt: '2024-05-10T08:00:00Z',
    questions: [
      q('q1', 'Viết 3/4 dưới dạng số thập phân.', 'easy', 'node-so-thap-phan-doi', 'Đổi phân số - thập phân', '0,75'),
      q('q2', 'Tính 2,5 + 1,75.', 'easy', 'node-so-thap-phan-cong-tru', 'Cộng trừ số thập phân', '4,25'),
      q('q3', 'Tính 3,2 × 1,5.', 'medium', 'node-so-thap-phan-nhan-chia', 'Nhân chia số thập phân', '4,8'),
      q('q4', 'Làm tròn 7,268 đến hàng phần trăm.', 'medium', 'node-so-thap-phan-lam-tron', 'Làm tròn số', '7,27'),
    ],
    submissions: [
      {
        submissionId: 'sub-so-thap-phan-minh-tuan',
        studentId: 'minh-tuan',
        submittedAt: '2024-05-12T09:00:00Z',
        answersByQuestionId: {
          q1: { isCorrect: true, studentAnswer: '0,75' },
          q2: { isCorrect: true, studentAnswer: '4,25' },
          q3: { isCorrect: false, studentAnswer: '4,5' },
          q4: { isCorrect: true, studentAnswer: '7,27' },
        },
      },
      {
        submissionId: 'sub-so-thap-phan-bao-ngoc',
        studentId: 'bao-ngoc',
        submittedAt: '2024-05-12T09:20:00Z',
        answersByQuestionId: {
          q1: { isCorrect: true, studentAnswer: '0,75' },
          q2: { isCorrect: false, studentAnswer: '4,2' },
          q3: { isCorrect: false, studentAnswer: '4,5' },
          q4: { isCorrect: false, studentAnswer: '7,3' },
        },
      },
    ],
  },
  {
    id: 'test-ty-le-thuc',
    title: 'Ôn tập Tỷ lệ thức nâng cao',
    type: 'revision',
    classId: DEFAULT_CLASS_ID,
    createdAt: '2024-05-25T08:00:00Z',
    questions: [
      q('q1', 'Tìm x biết x/4 = 6/8.', 'easy', 'node-ty-le-thuc-co-ban', 'Tỷ lệ thức cơ bản', '3'),
      q('q2', 'Hai đại lượng x và y tỉ lệ thuận, biết x = 4 khi y = 12. Tính y khi x = 6.', 'medium', 'node-ty-le-thuan', 'Tỷ lệ thuận', '18'),
      q('q3', 'Hai đại lượng x và y tỉ lệ nghịch, biết x = 3 khi y = 8. Tính y khi x = 4.', 'medium', 'node-ty-le-nghich', 'Tỷ lệ nghịch', '6'),
      q('q4', 'Chia 60 thành 3 phần tỉ lệ với 2:3:5. Tính phần lớn nhất.', 'hard', 'node-ty-le-thuc-ung-dung', 'Ứng dụng tỷ lệ thức', '30'),
    ],
    submissions: [],
  },
  {
    id: 'test-giua-ky-2',
    title: 'Kiểm tra Giữa kỳ II',
    type: 'weekly',
    classId: DEFAULT_CLASS_ID,
    createdAt: '2024-04-25T08:00:00Z',
    questions: [
      q('q1', 'Rút gọn phân số 21/28.', 'easy', 'node-phan-so-rut-gon', 'Rút gọn phân số', '3/4'),
      q('q2', 'Tính 1,2 × 0,5.', 'easy', 'node-so-thap-phan-nhan-chia', 'Nhân chia số thập phân', '0,6'),
      q('q3', 'Tìm x biết x/5 = 4/10.', 'medium', 'node-ty-le-thuc-co-ban', 'Tỷ lệ thức cơ bản', '2'),
      q('q4', 'Tính diện tích hình chữ nhật có chiều dài 8cm, chiều rộng 5cm.', 'medium', 'node-hinh-hoc-dien-tich', 'Diện tích hình học', '40 cm²'),
      q('q5', 'Tính chu vi hình vuông cạnh 6cm.', 'easy', 'node-hinh-hoc-chu-vi', 'Chu vi hình học', '24 cm'),
      q('q6', 'Một ô tô đi 120km trong 2 giờ. Tính vận tốc trung bình.', 'hard', 'node-toan-ung-dung', 'Toán ứng dụng', '60 km/h'),
    ],
    submissions: STUDENTS.map((s, i) => ({
      submissionId: `sub-giua-ky-2-${s.id}`,
      studentId: s.id,
      submittedAt: '2024-04-26T09:00:00Z',
      answersByQuestionId: {
        q1: { isCorrect: true, studentAnswer: '3/4' },
        q2: { isCorrect: i !== 2, studentAnswer: i !== 2 ? '0,6' : '0,06' },
        q3: { isCorrect: true, studentAnswer: '2' },
        q4: { isCorrect: i !== 2 && i !== 4, studentAnswer: i !== 2 && i !== 4 ? '40 cm²' : '13 cm²' },
        q5: { isCorrect: true, studentAnswer: '24 cm' },
        q6: { isCorrect: i !== 3, studentAnswer: i !== 3 ? '60 km/h' : '50 km/h' },
      },
    })),
  },
];

function findTest(testId: string): MockTest {
  const test = TESTS.find((t) => t.id === testId);
  if (!test) throw new Error(`Không tìm thấy bài test: ${testId}`);
  return test;
}

function scoreFor(test: MockTest, submission: MockSubmission): number {
  const correctCount = test.questions.filter((question) => submission.answersByQuestionId[question.id]?.isCorrect).length;
  return Math.round((correctCount / test.questions.length) * 100);
}

function completionStatus(test: MockTest): TestListItem['status'] {
  if (test.submissions.length === 0) return 'not_started';
  if (test.submissions.length < STUDENTS.length) return 'in_progress';
  return 'completed';
}

export async function fetchClassTests(classId: string = DEFAULT_CLASS_ID): Promise<TestListItem[]> {
  const items: TestListItem[] = TESTS.filter((t) => t.classId === classId)
    .map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      classId: t.classId,
      createdAt: t.createdAt,
      status: completionStatus(t),
      assignedCount: STUDENTS.length,
      submittedCount: t.submissions.length,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return withMockDelay(items);
}

export async function fetchTestResults(testId: string): Promise<TestResults> {
  const test = findTest(testId);
  const submissionByStudent = new Map(test.submissions.map((s) => [s.studentId, s]));

  const students: StudentResultRow[] = STUDENTS.map((s) => {
    const submission = submissionByStudent.get(s.id);
    return {
      studentId: s.id,
      fullName: s.fullName,
      score: submission ? scoreFor(test, submission) : null,
      status: submission ? 'submitted' : 'pending',
      submissionId: submission?.submissionId ?? null,
    };
  });

  const scored = students.filter((s) => s.score !== null);
  const classAvgScore = scored.length
    ? Math.round(scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length)
    : 0;

  const buckets: Record<string, number> = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0 };
  for (const s of scored) {
    const pct = s.score ?? 0;
    if (pct < 50) buckets['0-49'] += 1;
    else if (pct < 70) buckets['50-69'] += 1;
    else if (pct < 90) buckets['70-89'] += 1;
    else buckets['90-100'] += 1;
  }
  const distribution: ScoreDistributionBucket[] = Object.entries(buckets).map(([scoreRange, count]) => ({
    scoreRange,
    count,
  }));

  return withMockDelay({
    testId: test.id,
    testTitle: test.title,
    classAvgScore,
    distribution,
    students,
  });
}

export async function fetchTestDetail(testId: string): Promise<TestDetail> {
  const test = findTest(testId);
  return withMockDelay({
    id: test.id,
    title: test.title,
    type: test.type,
    classId: test.classId,
    status: completionStatus(test),
    questions: test.questions.map((question) => ({ ...question })),
  });
}

export async function updateTestQuestions(
  testId: string,
  payload: { title: string; questions: TestQuestionTeacherView[] },
): Promise<TestDetail> {
  const test = findTest(testId);
  if (test.submissions.length > 0) {
    throw new Error('Không thể chỉnh sửa bài test đã có học sinh làm.');
  }
  test.title = payload.title;
  test.questions = payload.questions;
  return withMockDelay(
    {
      id: test.id,
      title: test.title,
      type: test.type,
      classId: test.classId,
      status: completionStatus(test),
      questions: test.questions.map((question) => ({ ...question })),
    },
    700,
  );
}

export async function fetchSubmissionDetail(submissionId: string): Promise<SubmissionDetail> {
  for (const test of TESTS) {
    const submission = test.submissions.find((s) => s.submissionId === submissionId);
    if (!submission) continue;
    const student = STUDENTS.find((s) => s.id === submission.studentId);
    const results: SubmissionQuestionResult[] = test.questions.map((question) => {
      const answer = submission.answersByQuestionId[question.id];
      return {
        questionId: question.id,
        questionText: question.text,
        isCorrect: answer?.isCorrect ?? false,
        studentAnswer: answer?.studentAnswer ?? '—',
        correctAnswer: question.answer,
        explanation: null,
        rootCauseNodeName: answer && !answer.isCorrect ? question.nodeName : null,
      };
    });
    return withMockDelay({
      submissionId,
      testId: test.id,
      testTitle: test.title,
      studentId: submission.studentId,
      studentName: student?.fullName ?? submission.studentId,
      score: results.filter((r) => r.isCorrect).length,
      total: results.length,
      submittedAt: submission.submittedAt,
      results,
    });
  }
  throw new Error(`Không tìm thấy bài làm: ${submissionId}`);
}
