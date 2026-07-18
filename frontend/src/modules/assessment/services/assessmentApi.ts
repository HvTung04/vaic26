import { withMockDelay } from '@/services/mockClient';
import { calcAccuracy } from '@/utils/format';
import type {
  Assessment,
  AssessmentDraft,
  Question,
  QuestionDifficulty,
  QuestionOptionKey,
  ScoreReportData,
  TestAttemptSubmission,
} from '../types';

const ASSESSMENT_TITLES: Record<string, { title: string; subject: string }> = {
  'giai-tich-12': { title: 'Giải tích 12: Khảo sát hàm số', subject: 'Toán' },
  'song-co-hoc': { title: 'Vật Lý: Sóng cơ học', subject: 'Vật Lý' },
};

const DIFFICULTY_CYCLE: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];

function pointsForDifficulty(difficulty: QuestionDifficulty) {
  if (difficulty === 'Easy') return 10;
  if (difficulty === 'Medium') return 15;
  return 20;
}

function hashToRange(value: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return min + (hash % (max - min + 1));
}

function buildQuestion(order: number, subject: string): Question {
  const difficulty = DIFFICULTY_CYCLE[(order - 1) % DIFFICULTY_CYCLE.length];
  const options: Question['options'] = [
    { key: 'A', text: `Phương án A cho câu ${order}` },
    { key: 'B', text: `Phương án B cho câu ${order}` },
    { key: 'C', text: `Phương án C cho câu ${order}` },
    { key: 'D', text: `Phương án D cho câu ${order}` },
  ];
  const correctOption: QuestionOptionKey = (['A', 'B', 'C', 'D'] as const)[order % 4];
  return {
    id: `q-${order}`,
    order,
    prompt: `Câu ${order}: Nội dung câu hỏi ${subject} minh hoạ cho phiên kiểm tra thích ứng.`,
    options,
    correctOption,
    topicTag: `${subject} · Dạng ${order}`,
    difficulty,
    points: pointsForDifficulty(difficulty),
    explanation: `Giải thích ngắn gọn cho đáp án đúng của câu ${order}.`,
  };
}

function buildAssessment(assessmentId: string): Assessment {
  const meta = ASSESSMENT_TITLES[assessmentId] ?? { title: 'Bài kiểm tra thích ứng', subject: 'Toán' };
  return {
    id: assessmentId,
    title: meta.title,
    subject: meta.subject,
    durationMinutes: 20,
    sessionCode: `AS-${hashToRange(assessmentId, 1000, 9999)}`,
    questions: Array.from({ length: 10 }, (_, i) => buildQuestion(i + 1, meta.subject)),
  };
}

const DRAFT_ASSESSMENT: AssessmentDraft = {
  id: 'biology-midterm-unit-4',
  title: 'Biology Mid-term Unit 4',
  status: 'draft',
  context: {
    difficulty: 'adaptive',
    subject: 'Biology',
    gradeTag: 'Grade 11',
    extraTags: [],
    estimatedMinutes: 45,
    totalPoints: 100,
  },
  questions: [
    { id: 'q-1', order: 1, prompt: 'Which organelle is known as the powerhouse of the cell?', topicTag: 'Cell Organelles', difficulty: 'Easy', points: 10, options: [
      { key: 'A', text: 'Mitochondria' }, { key: 'B', text: 'Nucleus' }, { key: 'C', text: 'Ribosome' }, { key: 'D', text: 'Golgi apparatus' },
    ], correctOption: 'A' },
    { id: 'q-2', order: 2, prompt: 'What is the primary pigment used in photosynthesis?', topicTag: 'Photosynthesis', difficulty: 'Medium', points: 15, options: [
      { key: 'A', text: 'Carotene' }, { key: 'B', text: 'Chlorophyll' }, { key: 'C', text: 'Melanin' }, { key: 'D', text: 'Anthocyanin' },
    ], correctOption: 'B' },
    { id: 'q-3', order: 3, prompt: 'DNA replication occurs during which phase of the cell cycle?', topicTag: 'Cell Cycle', difficulty: 'Hard', points: 20, options: [
      { key: 'A', text: 'G1 phase' }, { key: 'B', text: 'S phase' }, { key: 'C', text: 'G2 phase' }, { key: 'D', text: 'M phase' },
    ], correctOption: 'B' },
    { id: 'q-4', order: 4, prompt: '', topicTag: 'Untitled', difficulty: 'Easy', points: 10, options: [
      { key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' },
    ], correctOption: 'A' },
    { id: 'q-5', order: 5, prompt: 'Define the process of Osmosis...', topicTag: 'Cell Transport', difficulty: 'Medium', points: 15, options: [
      { key: 'A', text: 'Movement of solutes from low to high concentration' },
      { key: 'B', text: 'Movement of water across a semi-permeable membrane' },
      { key: 'C', text: 'Active transport requiring ATP' },
      { key: 'D', text: 'Breakdown of glucose for energy' },
    ], correctOption: 'B' },
  ],
};

export async function fetchAssessment(assessmentId: string): Promise<Assessment> {
  return withMockDelay(buildAssessment(assessmentId));
}

export async function fetchAssessmentDraft(): Promise<AssessmentDraft> {
  return withMockDelay(structuredClone(DRAFT_ASSESSMENT));
}

export async function generateAiQuestions(sourceText: string, subject: string): Promise<Question[]> {
  const topic = sourceText.trim() || 'General Biology';
  const generated: Question[] = Array.from({ length: 5 }, (_, i) => ({
    id: `ai-${Date.now()}-${i}`,
    order: 100 + i,
    prompt: `[AI Forge] ${subject} question ${i + 1} generated from: "${topic.slice(0, 60)}"`,
    topicTag: topic.slice(0, 32) || subject,
    difficulty: 'Medium',
    points: 15,
    options: [
      { key: 'A', text: 'Auto-generated option A' },
      { key: 'B', text: 'Auto-generated option B' },
      { key: 'C', text: 'Auto-generated option C' },
      { key: 'D', text: 'Auto-generated option D' },
    ],
    correctOption: 'A',
    explanation: 'Generated explanation pending teacher review.',
  }));
  return withMockDelay(generated, 1400);
}

export async function saveQuestionDraft(question: Question): Promise<Question> {
  return withMockDelay(question, 350);
}

export async function publishAssessment(draftId: string): Promise<{ id: string; status: 'published' }> {
  return withMockDelay({ id: draftId, status: 'published' as const }, 900);
}

function shuffledRank(): { classRank: number; classSize: number } {
  const classSize = 32;
  const classRank = Math.max(1, Math.round(classSize * 0.15));
  return { classRank, classSize };
}

export async function submitTestAttempt(
  assessment: Assessment,
  submission: TestAttemptSubmission,
): Promise<ScoreReportData> {
  const questionResults = assessment.questions.map((question) => {
    const selectedOption = submission.answers[question.id] ?? null;
    const telemetry = submission.telemetry.find((t) => t.questionId === question.id);
    const isCorrect = selectedOption === question.correctOption;
    return {
      question,
      selectedOption,
      isCorrect,
      timeSpentSeconds: telemetry?.timeSpentSeconds ?? 0,
      pointsEarned: isCorrect ? question.points : 0,
      reviewNeeded: !isCorrect,
      waverCount: telemetry?.answerChanges.length ?? 0,
    };
  });

  const correctCount = questionResults.filter((r) => r.isCorrect).length;
  const accuracy = calcAccuracy(correctCount, assessment.questions.length);
  const totalPossiblePoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
  const pointsEarned = questionResults.reduce((sum, r) => sum + r.pointsEarned, 0);
  const finalScorePercent = totalPossiblePoints > 0 ? Math.round((pointsEarned / totalPossiblePoints) * 100) : 0;
  const { classRank, classSize } = shuffledRank();

  const report: ScoreReportData = {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    accuracy,
    correctCount,
    totalQuestions: assessment.questions.length,
    durationSeconds: submission.totalDurationSeconds,
    classRank,
    classSize,
    pointsEarned,
    totalPossiblePoints,
    finalScorePercent,
    questionResults,
  };

  return withMockDelay(report, 900);
}
