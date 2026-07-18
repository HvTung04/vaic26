import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verifyStudentPath } from '../../services/dashboardApi';
import { studentInsightQueryKey } from './useGetStudentInsight';
import type { StudentInsight } from '../../types';

export function useMutateVerifyStudentPath(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => verifyStudentPath(studentId),
    onSuccess: (learningPath) => {
      queryClient.setQueryData<StudentInsight>(studentInsightQueryKey(studentId), (prev) =>
        prev ? { ...prev, learningPath } : prev,
      );
    },
  });
}
