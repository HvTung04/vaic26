import { withMockDelay } from '@/services/mockClient';
import { KNOWLEDGE_NODES } from '../constants';
import type { QuestionBankDifficulty, QuestionBankDraftInput, QuestionBankItem, QuestionBankType } from '../types';

const DIFFICULTIES: QuestionBankDifficulty[] = ['easy', 'medium', 'hard'];

function seedBank(): QuestionBankItem[] {
  return Array.from({ length: 34 }, (_, i) => {
    const difficulty = DIFFICULTIES[i % DIFFICULTIES.length];
    const type: QuestionBankType = i % 5 === 0 ? 'short_answer' : 'mcq';
    const node = KNOWLEDGE_NODES[i % KNOWLEDGE_NODES.length];
    const isMcq = type === 'mcq';
    const options = isMcq
      ? [
          { key: 'A', text: `Option A for question ${i + 1}` },
          { key: 'B', text: `Option B for question ${i + 1}` },
          { key: 'C', text: `Option C for question ${i + 1}` },
          { key: 'D', text: `Option D for question ${i + 1}` },
        ]
      : null;
    const daysAgo = i * 3 + 1;

    return {
      id: `qb-${i + 1}`,
      text: `Question ${i + 1}: ${node.label} — explain the underlying concept in your own words.`,
      type,
      answer: isMcq ? 'Option A for question ' + (i + 1) : `Sample short answer for question ${i + 1}`,
      difficulty,
      node_id: node.id,
      created_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      options,
      explanation: i % 4 === 0 ? null : `Explanation for question ${i + 1}.`,
      source_upload_id: i % 6 === 0 ? `upload-${Math.ceil((i + 1) / 6)}` : null,
    };
  });
}

/** In-memory mock store standing in for the real question-bank API. */
let bank: QuestionBankItem[] = seedBank();

export async function fetchQuestionBank(): Promise<QuestionBankItem[]> {
  return withMockDelay([...bank]);
}

export async function fetchQuestionBankItem(id: string): Promise<QuestionBankItem | undefined> {
  return withMockDelay(bank.find((q) => q.id === id));
}

export async function createQuestionBankItem(payload: QuestionBankDraftInput): Promise<QuestionBankItem> {
  const created: QuestionBankItem = {
    ...payload,
    id: `qb-${Date.now()}`,
    created_at: new Date().toISOString(),
    source_upload_id: null,
  };
  bank = [created, ...bank];
  return withMockDelay(created, 500);
}

export async function updateQuestionBankItem(
  id: string,
  payload: QuestionBankDraftInput,
): Promise<QuestionBankItem> {
  const existing = bank.find((q) => q.id === id);
  const updated: QuestionBankItem = {
    ...payload,
    id,
    created_at: existing?.created_at ?? new Date().toISOString(),
    source_upload_id: existing?.source_upload_id ?? null,
  };
  bank = bank.map((q) => (q.id === id ? updated : q));
  return withMockDelay(updated, 500);
}
