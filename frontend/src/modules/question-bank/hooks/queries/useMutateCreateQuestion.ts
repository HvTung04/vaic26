import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createQuestionBankItem } from '../../services/questionBankApi';
import { QUESTION_BANK_QUERY_KEY } from './useGetQuestionBank';
import type { QuestionBankDraftInput } from '../../types';

export function useMutateCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuestionBankDraftInput) => createQuestionBankItem(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUESTION_BANK_QUERY_KEY }),
  });
}
