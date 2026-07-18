import { http } from '@/services/httpClient';
import type {
  QuestionBankDraftInput,
  QuestionBankItem,
} from '../types';

/**
 * Real API bindings for the Question Bank domain.
 *
 * Backend endpoints (content.py):
 *   GET    /questions              — list with filters
 *   GET    /questions/{id}         — single item
 *   PATCH  /questions/{id}         — update
 *   POST   /content/uploads        — upload file (separate flow)
 *   POST   /content/uploads/{id}/approve — approve parsed drafts
 *
 * NOTE: There is no POST /questions for direct creation. The backend
 * requires upload→parse→approve pipeline. For MVP, createQuestionBankItem
 * is a placeholder that will need the full upload pipeline wired.
 */

export interface QuestionBankListParams {
  nodeId?: string;
  difficulty?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface QuestionBankListResult {
  items: QuestionBankItem[];
  total: number;
}

/** GET /questions — paginated list with optional filters. */
export async function fetchQuestionBank(
  params?: QuestionBankListParams,
): Promise<QuestionBankListResult> {
  const query: Record<string, string | number> = {};
  if (params?.nodeId) query.node_id = params.nodeId;
  if (params?.difficulty) query.difficulty = params.difficulty;
  if (params?.search) query.search = params.search;
  if (params?.limit) query.limit = params.limit;
  if (params?.offset) query.offset = params.offset;
  return http.get<QuestionBankListResult>('/questions', query);
}

/** GET /questions/{id} — single question detail. */
export async function fetchQuestionBankItem(
  id: string,
): Promise<QuestionBankItem> {
  return http.get<QuestionBankItem>(`/questions/${id}`);
}

/**
 * Create a question via the upload→approve pipeline.
 *
 * TODO: This requires the full upload→OCR→parse→approve flow.
 * Backend has no POST /questions endpoint for direct creation.
 * Current implementation creates a mock-local question for UI flow.
 * Wire to real pipeline once upload workflow is connected.
 */
export async function createQuestionBankItem(
  payload: QuestionBankDraftInput,
): Promise<QuestionBankItem> {
  // Real flow: upload file → poll status → get draft_ids → approve
  // For now, use PATCH on a temp ID pattern (backend will 404, handled by caller)
  // TODO: implement real upload→approve pipeline
  throw new Error(
    'Direct question creation not yet supported. Use file upload pipeline.',
  );
}

/** PATCH /questions/{id} — update a question. */
export async function updateQuestionBankItem(
  id: string,
  payload: QuestionBankDraftInput,
): Promise<QuestionBankItem> {
  return http.patch<QuestionBankItem>(`/questions/${id}`, {
    text: payload.text,
    options: payload.options ?? null,
    answer: payload.answer,
    explanation: payload.explanation ?? null,
    difficulty: payload.difficulty,
    node_id: payload.node_id,
  });
}
