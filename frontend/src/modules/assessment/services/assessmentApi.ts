import { withMockDelay } from '@/services/mockClient';
import type { AssessmentDraft, Question } from '../types';

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
