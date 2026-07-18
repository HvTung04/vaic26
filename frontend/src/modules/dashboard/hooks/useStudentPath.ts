import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStudentInsight, verifyStudentPath, aiUpdateStudentPath } from '../services/dashboardApi';
import type { StudentInsight } from '../types';

export function useStudentInsight(studentId: string) {
  return useQuery({
    queryKey: ['dashboard', 'student-insight', studentId],
    queryFn: () => fetchStudentInsight(studentId),
    enabled: Boolean(studentId),
  });
}

export function useStudentPath(studentId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['dashboard', 'student-insight', studentId];

  const verifyMutation = useMutation({
    mutationFn: () => verifyStudentPath(studentId),
    onSuccess: (learningPath) => {
      queryClient.setQueryData<StudentInsight>(queryKey, (prev) =>
        prev ? { ...prev, learningPath } : prev,
      );
    },
  });

  const aiUpdateMutation = useMutation({
    mutationFn: (note: string) => aiUpdateStudentPath(studentId, note),
    onSuccess: (learningPath) => {
      queryClient.setQueryData<StudentInsight>(queryKey, (prev) =>
        prev ? { ...prev, learningPath } : prev,
      );
    },
  });

  return { verifyMutation, aiUpdateMutation };
}
