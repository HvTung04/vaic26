import { http } from '@/services/httpClient';
import type {
  QuestionBankDifficulty,
  QuestionBankDraftInput,
  QuestionBankItem,
  QuestionBankListResult,
  QuestionBankSortField,
  QuestionBankType,
  SortDirection,
} from '../types';

/**
 * Real API bindings for the Question Bank domain (backend/app/api/v1/content.py).
 * The httpClient camelCases response keys, so the backend's snake_case
 * (`node_id`, `source_upload_id`, `created_at`) already lands on the FE types.
 */

export interface QuestionBankListParams {
  search?: string;
  type?: QuestionBankType | 'all';
  difficulty?: QuestionBankDifficulty | 'all';
  /** Topic key from GET /taxonomy/topics (e.g. "L6-t1") — matches every node under that topic. */
  topic?: string | 'all';
  sortField?: QuestionBankSortField;
  sortDirection?: SortDirection;
  limit?: number;
  offset?: number;
}

export async function fetchQuestionBank(params: QuestionBankListParams = {}): Promise<QuestionBankListResult> {
  return http.get<QuestionBankListResult>('/questions', {
    search: params.search || undefined,
    type: params.type && params.type !== 'all' ? params.type : undefined,
    difficulty: params.difficulty && params.difficulty !== 'all' ? params.difficulty : undefined,
    topic: params.topic && params.topic !== 'all' ? params.topic : undefined,
    sort_by: params.sortField,
    sort_dir: params.sortDirection,
    limit: params.limit,
    offset: params.offset,
  });
}

export async function fetchQuestionBankItem(id: string): Promise<QuestionBankItem> {
  return http.get<QuestionBankItem>(`/questions/${id}`);
}

// Request bodies must be snake_case (the httpClient only camelCases responses).
function toWritePayload(payload: QuestionBankDraftInput) {
  return {
    text: payload.text,
    type: payload.type,
    options: payload.options,
    answer: payload.answer,
    explanation: payload.explanation,
    difficulty: payload.difficulty,
    node_id: payload.nodeId,
  };
}

export async function createQuestionBankItem(payload: QuestionBankDraftInput): Promise<QuestionBankItem> {
  return http.post<QuestionBankItem>('/questions', toWritePayload(payload));
}

/** PATCH /questions/{id} — update a question. */
export async function updateQuestionBankItem(
  id: string,
  payload: QuestionBankDraftInput,
): Promise<QuestionBankItem> {
  return http.patch<QuestionBankItem>(`/questions/${id}`, toWritePayload(payload));
}
