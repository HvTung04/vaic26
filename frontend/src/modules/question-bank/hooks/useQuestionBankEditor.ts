import { useGetQuestionBankItem } from './queries/useGetQuestionBankItem';
import { useMutateCreateQuestion } from './queries/useMutateCreateQuestion';
import { useMutateUpdateQuestion } from './queries/useMutateUpdateQuestion';

export function useQuestionBankEditor(questionId?: string) {
  const itemQuery = useGetQuestionBankItem(questionId);
  const createMutation = useMutateCreateQuestion();
  const updateMutation = useMutateUpdateQuestion();

  return {
    item: itemQuery.data,
    isLoading: itemQuery.isLoading,
    isError: itemQuery.isError,
    createMutation,
    updateMutation,
  };
}
