import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitAttempt } from '../services/testTakingApi';
import type { SubmitAnswerItem } from '../types';

export function useSubmitAttempt(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: SubmitAnswerItem[]) => submitAttempt(testId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tests'] });
    },
  });
}
