import { useQuery } from '@tanstack/react-query';
import { fetchQuestionBank, type QuestionBankListParams } from '../../services/questionBankApi';
import type { QuestionBankListResult } from '../../services/questionBankApi';

export const QUESTION_BANK_QUERY_KEY = ['question-bank'];

export function useGetQuestionBank(params?: QuestionBankListParams) {
  return useQuery<QuestionBankListResult>({
    queryKey: [...QUESTION_BANK_QUERY_KEY, params],
    queryFn: () => fetchQuestionBank(params),
  });
}
