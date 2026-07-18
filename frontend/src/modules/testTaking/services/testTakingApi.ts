import { withMockDelay } from '@/services/mockClient';
import { nodeName } from '@/modules/studentSelf/knowledgeNodes';
import { applyAnswer } from '@/modules/studentSelf/masteryStore';
import type {
  Attempt,
  AttemptQuestion,
  GraphUpdate,
  QuestionKind,
  QuestionResult,
  StudentResultHistoryItem,
  StudentTestListItem,
  SubmissionResult,
  SubmitAnswerItem,
  SubmitResult,
  TestKind,
} from '../types';

interface BankQuestion {
  id: string;
  text: string;
  type: QuestionKind;
  options: string[] | null;
  answer: string;
  nodeId: string;
  explanation: string;
}

interface MockTest {
  id: string;
  title: string;
  type: TestKind;
  dueAt: string | null;
  questions: BankQuestion[];
}

function q(
  id: string,
  text: string,
  nodeId: string,
  answer: string,
  explanation: string,
  options: string[] | null = null,
): BankQuestion {
  return { id, text, type: options ? 'mcq' : 'short_answer', options, answer, nodeId, explanation };
}

const PENDING_TESTS: MockTest[] = [
  {
    id: 'test-giai-tich-12',
    title: 'Giải tích 12: Khảo sát hàm số',
    type: 'weekly',
    dueAt: '2026-07-20T15:00:00Z',
    questions: [
      q(
        'q1',
        'Hàm số y = x³ - 3x + 1 đồng biến trên khoảng nào?',
        'node-khao-sat-ham-so',
        '(1;+∞)',
        'y\' = 3x² - 3 > 0 khi x < -1 hoặc x > 1, kết hợp xét dấu ta chọn khoảng (1;+∞).',
        ['(-1;1)', '(1;+∞)', '(-∞;-1)', 'R'],
      ),
      q(
        'q2',
        'Hàm số y = x⁴ - 2x² có bao nhiêu điểm cực trị?',
        'node-khao-sat-ham-so',
        '3',
        'y\' = 4x³ - 4x = 0 có 3 nghiệm phân biệt x = 0, ±1 nên hàm số có 3 điểm cực trị.',
        ['1', '2', '3', '4'],
      ),
      q(
        'q3',
        'Đạo hàm của hàm số y = sin(2x) là?',
        'node-dao-ham',
        '2cos(2x)',
        'Áp dụng công thức đạo hàm hàm hợp: (sin u)\' = u\'.cos u với u = 2x.',
        ['cos(2x)', '2cos(2x)', '-2cos(2x)', '2sin(2x)'],
      ),
      q('q4', 'Tính đạo hàm của hàm số y = x³ tại x = 2.', 'node-dao-ham', '12', 'y\' = 3x², thay x = 2 ta được 3.4 = 12.'),
    ],
  },
  {
    id: 'test-song-co-hoc',
    title: 'Vật Lý: Sóng cơ học',
    type: 'practice',
    dueAt: '2026-07-21T15:00:00Z',
    questions: [
      q(
        'q1',
        'Sóng cơ học không truyền được trong môi trường nào sau đây?',
        'node-song-co',
        'chân không',
        'Sóng cơ cần môi trường vật chất để lan truyền dao động, chân không không có vật chất.',
        ['chất rắn', 'chất lỏng', 'chất khí', 'chân không'],
      ),
      q(
        'q2',
        'Bước sóng là khoảng cách giữa hai điểm gần nhau nhất trên phương truyền sóng dao động',
        'node-song-co',
        'cùng pha',
        'Theo định nghĩa, bước sóng là quãng đường sóng truyền trong một chu kỳ, ứng với 2 điểm dao động cùng pha gần nhau nhất.',
        ['cùng pha', 'ngược pha', 'vuông pha', 'lệch pha bất kỳ'],
      ),
      q(
        'q3',
        'Con lắc lò xo dao động điều hòa, khi động năng cực đại thì thế năng bằng bao nhiêu?',
        'node-dao-dong',
        '0',
        'Cơ năng bảo toàn: khi động năng đạt cực đại (tại vị trí cân bằng) thì thế năng bằng 0.',
        ['0', 'Cực đại', 'Bằng động năng', 'Không xác định'],
      ),
      q(
        'q4',
        'Chu kỳ dao động điều hòa của con lắc lò xo phụ thuộc vào đại lượng nào?',
        'node-dao-dong',
        'khối lượng và độ cứng lò xo',
        'T = 2π√(m/k) — chỉ phụ thuộc khối lượng vật nặng và độ cứng lò xo, không phụ thuộc biên độ.',
      ),
    ],
  },
];

/** 2-3 short revision questions per node, used to synthesize an AI "revision test" for the weakest node. */
const REVISION_QUESTION_BANK: Record<string, Omit<BankQuestion, 'id'>[]> = {
  'node-dao-ham': [
    q('r1', 'Đạo hàm của hàm số y = x⁵ là?', 'node-dao-ham', '5x⁴', 'Áp dụng công thức (xⁿ)\' = n.xⁿ⁻¹.', ['4x⁴', '5x⁴', '5x⁵', 'x⁴']),
    q('r2', 'Đạo hàm của y = ln(x) là?', 'node-dao-ham', '1/x', 'Công thức đạo hàm hàm logarit tự nhiên.', ['1/x', 'x', 'ln(x)', '1/x²']),
  ],
  'node-khao-sat-ham-so': [
    q('r1', 'Hàm số y = x² - 4x có điểm cực tiểu tại x bằng bao nhiêu?', 'node-khao-sat-ham-so', '2', 'y\' = 2x - 4 = 0 ⟺ x = 2, đây là điểm cực tiểu vì hệ số a > 0.'),
    q('r2', 'Đồ thị hàm số bậc 3 có tối đa bao nhiêu điểm cực trị?', 'node-khao-sat-ham-so', '2', 'Đạo hàm là tam thức bậc 2 nên có tối đa 2 nghiệm phân biệt.', ['1', '2', '3', '4']),
  ],
  'node-tich-phan': [
    q('r1', 'Tính ∫1 dx từ 0 đến 3.', 'node-tich-phan', '3', 'Nguyên hàm của hằng số 1 là x, thay cận ta được 3 - 0 = 3.'),
    q('r2', 'Tính ∫2x dx từ 0 đến 1.', 'node-tich-phan', '1', 'Nguyên hàm của 2x là x², thay cận ta được 1 - 0 = 1.'),
  ],
  'node-song-co': [
    q('r1', 'Đơn vị của tần số sóng là gì?', 'node-song-co', 'Hz', 'Tần số đo bằng Hertz (Hz), số dao động trong 1 giây.', ['m', 's', 'Hz', 'm/s']),
    q('r2', 'Sóng dọc có phương dao động như thế nào so với phương truyền sóng?', 'node-song-co', 'trùng', 'Sóng dọc dao động cùng phương với phương truyền sóng.', ['vuông góc', 'trùng', 'lệch 45 độ', 'ngẫu nhiên']),
  ],
  'node-dao-dong': [
    q('r1', 'Đơn vị của tần số góc ω trong dao động điều hòa là gì?', 'node-dao-dong', 'rad/s', 'Tần số góc đo bằng radian trên giây.', ['Hz', 'rad/s', 's', 'm/s']),
    q('r2', 'Tại vị trí biên, vận tốc của vật dao động điều hòa bằng bao nhiêu?', 'node-dao-dong', '0', 'Ở biên, vật đổi chiều chuyển động nên vận tốc tức thời bằng 0.', ['0', 'Cực đại', 'Không đổi', 'Không xác định']),
  ],
  'node-este': [
    q('r1', 'Este đơn chức được tạo bởi axit đơn chức và chất nào?', 'node-este', 'ancol đơn chức', 'Phản ứng este hóa giữa axit đơn chức và ancol đơn chức tạo este đơn chức.', ['ancol đơn chức', 'amin', 'anđehit', 'axit khác']),
    q('r2', 'Phản ứng thủy phân este trong môi trường axit tạo ra sản phẩm gì?', 'node-este', 'axit và ancol', 'Thủy phân trong môi trường axit là phản ứng thuận nghịch, tạo lại axit và ancol ban đầu.', ['muối và ancol', 'axit và ancol', 'chỉ có ancol', 'chỉ có axit']),
  ],
};

let revisionTestCounter = 0;

/** Mirrors POST /agents/revision-test: synthesizes a short test targeting the weakest node. */
function createRevisionTest(nodeId: string, questionCount = 2): MockTest {
  const bank = REVISION_QUESTION_BANK[nodeId] ?? [];
  const questions = bank.slice(0, questionCount).map((question, i) => ({ ...question, id: `rq${i + 1}` }));
  const test: MockTest = {
    id: `test-revision-${nodeId}-${revisionTestCounter++}`,
    title: `Ôn tập: ${nodeName(nodeId)}`,
    type: 'revision',
    dueAt: null,
    questions,
  };
  PENDING_TESTS.push(test);
  return test;
}

interface HistoryAnswer {
  questionText: string;
  nodeId: string;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
}

interface HistoryTest {
  testId: string;
  title: string;
  submittedAt: string;
  answers: HistoryAnswer[];
}

const GRADED_HISTORY: HistoryTest[] = [
  {
    testId: 'test-khao-sat-t10',
    title: 'Khảo sát chất lượng Tháng 10',
    submittedAt: '2025-10-15T02:00:00Z',
    answers: [
      { questionText: 'Tính đạo hàm của hàm số y = x² + 3x.', nodeId: 'node-dao-ham', isCorrect: true, studentAnswer: '2x+3', correctAnswer: '2x+3' },
      { questionText: 'Hàm số y = -x² + 4x nghịch biến trên khoảng nào?', nodeId: 'node-khao-sat-ham-so', isCorrect: true, studentAnswer: '(2;+∞)', correctAnswer: '(2;+∞)' },
      { questionText: 'Tính tích phân ∫x dx từ 0 đến 2.', nodeId: 'node-tich-phan', isCorrect: true, studentAnswer: '2', correctAnswer: '2' },
      { questionText: 'Giá trị cực đại của hàm số y = -x² + 2 là?', nodeId: 'node-khao-sat-ham-so', isCorrect: true, studentAnswer: '2', correctAnswer: '2' },
      { questionText: 'Đạo hàm của y = cos(x) là?', nodeId: 'node-dao-ham', isCorrect: true, studentAnswer: '-sin(x)', correctAnswer: '-sin(x)' },
      { questionText: 'Tính ∫(2x+1)dx từ 0 đến 1.', nodeId: 'node-tich-phan', isCorrect: false, studentAnswer: '1', correctAnswer: '2' },
      { questionText: 'Số điểm cực trị của y = x³ - 3x là?', nodeId: 'node-khao-sat-ham-so', isCorrect: true, studentAnswer: '2', correctAnswer: '2' },
      { questionText: 'Đạo hàm của y = e^x là?', nodeId: 'node-dao-ham', isCorrect: true, studentAnswer: 'e^x', correctAnswer: 'e^x' },
    ],
  },
  {
    testId: 'test-giua-ky-1',
    title: 'Kiểm tra Giữa kỳ I',
    submittedAt: '2025-10-12T02:00:00Z',
    answers: [
      { questionText: 'Sóng âm truyền nhanh nhất trong môi trường nào?', nodeId: 'node-song-co', isCorrect: true, studentAnswer: 'chất rắn', correctAnswer: 'chất rắn' },
      { questionText: 'Tần số dao động điều hòa có đơn vị là?', nodeId: 'node-dao-dong', isCorrect: false, studentAnswer: 'rad/s', correctAnswer: 'Hz' },
      { questionText: 'Biên độ dao động là gì?', nodeId: 'node-dao-dong', isCorrect: false, studentAnswer: 'quãng đường đi được', correctAnswer: 'li độ cực đại' },
      { questionText: 'Bước sóng liên hệ với tốc độ truyền sóng và chu kỳ theo công thức nào?', nodeId: 'node-song-co', isCorrect: true, studentAnswer: 'λ = v.T', correctAnswer: 'λ = v.T' },
      { questionText: 'Sóng ngang là sóng có phương dao động như thế nào so với phương truyền sóng?', nodeId: 'node-song-co', isCorrect: true, studentAnswer: 'vuông góc', correctAnswer: 'vuông góc' },
      { questionText: 'Con lắc đơn dao động điều hòa có chu kỳ phụ thuộc vào?', nodeId: 'node-dao-dong', isCorrect: true, studentAnswer: 'chiều dài dây và g', correctAnswer: 'chiều dài dây và g' },
    ],
  },
  {
    testId: 'test-este-15p',
    title: 'Kiểm tra 15 phút - Este',
    submittedAt: '2025-10-05T02:00:00Z',
    answers: [
      { questionText: 'Este được tạo thành từ phản ứng giữa axit và chất nào?', nodeId: 'node-este', isCorrect: false, studentAnswer: 'amin', correctAnswer: 'ancol' },
      { questionText: 'Phản ứng thủy phân este trong môi trường kiềm gọi là gì?', nodeId: 'node-este', isCorrect: false, studentAnswer: 'este hóa', correctAnswer: 'xà phòng hóa' },
      { questionText: 'Công thức tổng quát của este no đơn chức mạch hở là?', nodeId: 'node-este', isCorrect: true, studentAnswer: 'CnH2nO2', correctAnswer: 'CnH2nO2' },
      { questionText: 'Este có mùi thơm đặc trưng thường dùng làm gì?', nodeId: 'node-este', isCorrect: false, studentAnswer: 'dung môi công nghiệp', correctAnswer: 'hương liệu thực phẩm' },
      { questionText: 'Phản ứng este hóa cần chất xúc tác nào?', nodeId: 'node-este', isCorrect: true, studentAnswer: 'H2SO4 đặc', correctAnswer: 'H2SO4 đặc' },
      { questionText: 'Este có nhiệt độ sôi thấp hơn axit và ancol có cùng số cacbon vì lý do gì?', nodeId: 'node-este', isCorrect: false, studentAnswer: 'phân tử khối lớn hơn', correctAnswer: 'không tạo được liên kết hidro giữa các phân tử' },
    ],
  },
];

// Seed mastery from history once, in chronological order, so the graph state
// mock and the "weakest node" revision CTA have realistic starting data.
let seeded = false;
function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  const chronological = [...GRADED_HISTORY].sort((a, b) => (a.submittedAt < b.submittedAt ? -1 : 1));
  for (const test of chronological) {
    for (const answer of test.answers) {
      applyAnswer(answer.nodeId, answer.isCorrect, test.submittedAt);
    }
  }
}
ensureSeeded();

interface LiveSubmission {
  submissionId: string;
  testId: string;
  testTitle: string;
  status: 'grading' | 'graded';
  score: number;
  total: number;
  results: QuestionResult[];
  graphUpdates: GraphUpdate[];
  submittedAt: string;
}

const liveSubmissions = new Map<string, LiveSubmission>();
const submittedTestIds = new Set<string>();
let submissionCounter = 0;

function findPendingTest(testId: string): MockTest {
  const test = PENDING_TESTS.find((t) => t.id === testId);
  if (!test) throw new Error(`Không tìm thấy bài test: ${testId}`);
  return test;
}

export async function fetchStudentTests(status?: string): Promise<StudentTestListItem[]> {
  const items: StudentTestListItem[] = PENDING_TESTS.map((t) => ({
    testId: t.id,
    title: t.title,
    type: t.type,
    dueAt: t.dueAt,
    status: submittedTestIds.has(t.id) ? 'submitted' : 'pending',
  }));
  const filtered = status ? items.filter((i) => i.status === status) : items;
  return withMockDelay(filtered);
}

export async function fetchAttempt(testId: string): Promise<Attempt> {
  const test = findPendingTest(testId);
  const questions: AttemptQuestion[] = test.questions.map((question) => ({
    id: question.id,
    text: question.text,
    type: question.type,
    options: question.options,
  }));
  return withMockDelay({ testId: test.id, title: test.title, questions });
}

export async function submitAttempt(testId: string, answers: SubmitAnswerItem[]): Promise<SubmitResult> {
  const test = findPendingTest(testId);
  const byId = new Map(test.questions.map((q) => [q.id, q]));
  const submissionId = `sub-live-${testId}-${submissionCounter++}`;
  const submittedAt = new Date().toISOString();

  const live: LiveSubmission = {
    submissionId,
    testId: test.id,
    testTitle: test.title,
    status: 'grading',
    score: 0,
    total: answers.length,
    results: [],
    graphUpdates: [],
    submittedAt,
  };
  liveSubmissions.set(submissionId, live);
  submittedTestIds.add(testId);

  // Simulate the server's background grading job.
  setTimeout(() => {
    const graphUpdatesByNode = new Map<string, GraphUpdate>();
    let correctCount = 0;
    const results: QuestionResult[] = answers.map((submitted) => {
      const question = byId.get(submitted.questionId);
      if (!question) {
        return {
          questionId: submitted.questionId,
          questionText: '',
          isCorrect: false,
          studentAnswer: submitted.answer,
          correctAnswer: '',
          explanation: null,
          rootCauseNodeId: null,
          rootCauseNodeName: null,
        };
      }
      const isCorrect = submitted.answer.trim().toLowerCase() === question.answer.trim().toLowerCase();
      if (isCorrect) correctCount += 1;

      const { before, after } = applyAnswer(question.nodeId, isCorrect, submittedAt);
      graphUpdatesByNode.set(question.nodeId, {
        nodeId: question.nodeId,
        nodeName: nodeName(question.nodeId),
        masteryBefore: before,
        masteryAfter: after,
      });

      return {
        questionId: question.id,
        questionText: question.text,
        isCorrect,
        studentAnswer: submitted.answer,
        correctAnswer: question.answer,
        explanation: isCorrect ? null : question.explanation,
        rootCauseNodeId: isCorrect ? null : question.nodeId,
        rootCauseNodeName: isCorrect ? null : nodeName(question.nodeId),
      };
    });

    live.status = 'graded';
    live.score = correctCount;
    live.results = results;
    live.graphUpdates = Array.from(graphUpdatesByNode.values());
  }, 1800);

  return withMockDelay(
    { submissionId, testId: test.id, studentId: 'current-student', status: 'grading', submittedAt },
    400,
  );
}

export async function fetchSubmissionResult(submissionId: string): Promise<SubmissionResult> {
  const live = liveSubmissions.get(submissionId);
  if (!live) throw new Error(`Không tìm thấy bài làm: ${submissionId}`);
  return withMockDelay({
    submissionId: live.submissionId,
    testId: live.testId,
    testTitle: live.testTitle,
    status: live.status,
    score: live.score,
    total: live.total,
    results: live.results,
    graphUpdates: live.graphUpdates,
  });
}

export async function fetchStudentResults(): Promise<StudentResultHistoryItem[]> {
  const fromHistory: StudentResultHistoryItem[] = GRADED_HISTORY.map((test) => {
    const total = test.answers.length;
    const score = test.answers.filter((a) => a.isCorrect).length;
    const weakNodeIds = Array.from(new Set(test.answers.filter((a) => !a.isCorrect).map((a) => a.nodeId)));
    return { testId: test.testId, title: test.title, score, total, submittedAt: test.submittedAt, weakNodeIds };
  });

  const fromLive: StudentResultHistoryItem[] = Array.from(liveSubmissions.values())
    .filter((s) => s.status === 'graded')
    .map((s) => ({
      testId: s.testId,
      title: s.testTitle,
      score: s.score,
      total: s.total,
      submittedAt: s.submittedAt,
      weakNodeIds: Array.from(new Set(s.results.filter((r) => !r.isCorrect).map((r) => r.rootCauseNodeId).filter((n): n is string => Boolean(n)))),
    }));

  const all = [...fromHistory, ...fromLive].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  return withMockDelay(all);
}

export interface RevisionTestResult {
  testId: string;
  targetNodeIds: string[];
  questionCount: number;
}

/** Mirrors POST /agents/revision-test for a single target node. */
export async function generateRevisionTest(nodeId: string): Promise<RevisionTestResult> {
  const test = createRevisionTest(nodeId);
  return withMockDelay(
    { testId: test.id, targetNodeIds: [nodeId], questionCount: test.questions.length },
    900,
  );
}
