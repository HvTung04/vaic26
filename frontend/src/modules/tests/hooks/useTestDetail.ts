import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTestDetail, updateTestQuestions } from '../services/testsApi';
import type { TestQuestionTeacherView } from '../types';

export function useTestDetail(testId: string) {
  return useQuery({
    queryKey: ['tests', testId, 'detail'],
    queryFn: () => fetchTestDetail(testId),
    enabled: Boolean(testId),
  });
}

export function useUpdateTestQuestions(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; questions: TestQuestionTeacherView[] }) =>
      updateTestQuestions(testId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests', testId] });
      queryClient.invalidateQueries({ queryKey: ['tests', 'class'] });
    },
  });
}
