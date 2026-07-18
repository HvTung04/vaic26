import { useQuery } from '@tanstack/react-query';
import { fetchQuestionBankItem } from '../../services/questionBankApi';
import { QUESTION_BANK_QUERY_KEY } from './useGetQuestionBank';

export function useGetQuestionBankItem(questionId?: string) {
  return useQuery({
    queryKey: [...QUESTION_BANK_QUERY_KEY, 'item', questionId],
    queryFn: () => fetchQuestionBankItem(questionId!),
    enabled: Boolean(questionId),
  });
}
