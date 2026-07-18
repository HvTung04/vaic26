import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQuestionBankItem } from '../../services/questionBankApi';
import { QUESTION_BANK_QUERY_KEY } from './useGetQuestionBank';
import type { QuestionBankDraftInput } from '../../types';

export function useMutateUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuestionBankDraftInput }) =>
      updateQuestionBankItem(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUESTION_BANK_QUERY_KEY }),
  });
}
