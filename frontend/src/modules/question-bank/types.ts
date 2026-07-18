export type QuestionBankType = 'mcq' | 'short_answer';

export type QuestionBankDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionBankOption {
  key: string;
  text: string;
}

/** Mirrors the backend `QuestionDetail` schema (app/schemas/content.py). */
export interface QuestionBankItem {
  id: string;
  text: string;
  type: QuestionBankType;
  answer: string;
  difficulty: QuestionBankDifficulty;
  node_id: string;
  created_at: string;
  options: QuestionBankOption[] | null;
  explanation: string | null;
  source_upload_id: string | null;
}

export type QuestionBankDraftInput = Pick<
  QuestionBankItem,
  'text' | 'type' | 'answer' | 'difficulty' | 'node_id' | 'options' | 'explanation'
>;

export type QuestionBankSortField = 'text' | 'type' | 'difficulty' | 'created_at';

export type SortDirection = 'asc' | 'desc';
