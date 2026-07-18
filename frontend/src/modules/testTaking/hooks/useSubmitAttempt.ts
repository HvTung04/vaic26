import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthContext';
import { submitAttempt } from '../services/testTakingApi';
import type { SubmitAnswerItem } from '../types';

export function useSubmitAttempt(testId: string) {
  const queryClient = useQueryClient();
  const studentId = useAuth().user?.id ?? '';
  return useMutation({
    mutationFn: (answers: SubmitAnswerItem[]) => submitAttempt(testId, studentId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tests'] });
    },
  });
}
