import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/httpClient';
import { verifyLearningPath } from '../services/learningPathApi';
import type { LearningPath } from '../types';

/**
 * Teacher-side actions on a student's learning path:
 *  - "generate" re-runs the same agent the student's own flow uses
 *    (POST /agents/learning-path), just triggered by the teacher.
 *  - "verify" is teacher-only (see backend `ensure` check) and marks the
 *    current AI-suggested path as reviewed.
 * Both just invalidate the `['learning-path', studentId]` query used by
 * useLearningPathProgress rather than hand-mapping the generate response,
 * since that response lacks `nodeNames` (only the GET does).
 */
export function useTeacherPathActions(studentId: string) {
  const queryClient = useQueryClient();
  const pathQueryKey = ['learning-path', studentId];

  const generateMutation = useMutation({
    mutationFn: () => http.post('/agents/learning-path', { student_id: studentId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pathQueryKey }),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyLearningPath(studentId),
    onSuccess: (path) => queryClient.setQueryData<LearningPath>(pathQueryKey, path),
  });

  return { generateMutation, verifyMutation };
}
