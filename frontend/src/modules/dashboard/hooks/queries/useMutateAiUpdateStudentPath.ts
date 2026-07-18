import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiUpdateStudentPath } from '../../services/dashboardApi';
import { studentInsightQueryKey } from './useGetStudentInsight';
import type { StudentInsight } from '../../types';

export function useMutateAiUpdateStudentPath(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: string) => aiUpdateStudentPath(studentId, note),
    onSuccess: (learningPath) => {
      queryClient.setQueryData<StudentInsight>(studentInsightQueryKey(studentId), (prev) =>
        prev ? { ...prev, learningPath } : prev,
      );
    },
  });
}
