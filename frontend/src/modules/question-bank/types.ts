export type QuestionBankType = 'mcq' | 'short_answer';

export type QuestionBankDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionBankOption {
  key: string;
  text: string;
}

/**
 * Mirrors the backend `QuestionDetail` schema (app/schemas/content.py); the
 * httpClient camelCases snake_case response keys (`node_id` -> `nodeId`, etc).
 */
export interface QuestionBankItem {
  id: string;
  text: string;
  type: QuestionBankType;
  answer: string;
  difficulty: QuestionBankDifficulty;
  nodeId: string;
  createdAt: string;
  options: QuestionBankOption[] | null;
  explanation: string | null;
  sourceUploadId: string | null;
}

export type QuestionBankDraftInput = Pick<
  QuestionBankItem,
  'text' | 'type' | 'answer' | 'difficulty' | 'nodeId' | 'options' | 'explanation'
>;

/** GET /questions response shape (`QuestionListResponse`). */
export interface QuestionBankListResult {
  items: QuestionBankItem[];
  total: number;
  limit: number;
  offset: number;
}

export type QuestionBankSortField = 'text' | 'type' | 'difficulty' | 'created_at';

export type SortDirection = 'asc' | 'desc';

/** Mirrors the backend `TaxonomyNode` schema (GET /taxonomy/nodes). */
export interface TaxonomyNode {
  id: string;
  topicName: string;
  grade: number;
  topicId: string;
  mach: string;
  /** Specific content block description; unset on grouped /taxonomy/topics rows. */
  noiDungCuThe: string | null;
}
