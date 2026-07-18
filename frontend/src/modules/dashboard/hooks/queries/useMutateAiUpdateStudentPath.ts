import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/httpClient';
import { studentInsightQueryKey } from './useGetStudentInsight';
import type { StudentInsight, LearningPath } from '../../types';

/**
 * POST /agents/learning-path — generate a new AI learning path for the student.
 * Backend returns { path_id, student_id, tiers, generated_at, grounded_on }.
 * We adapt it to the FE's { goal, status, steps } shape.
 */
async function callGenerateLearningPath(studentId: string, _note: string): Promise<LearningPath> {
  const res = await http.post<{
    pathId: string;
    studentId: string;
    tiers: { tier: string; nodeIds: string[]; rationale: string }[];
    generatedAt: string;
  }>('/agents/learning-path', { student_id: studentId });

  // Adapt backend tiers → FE steps
  const steps = res.tiers.map((tier, i) => ({
    id: tier.tier,
    label: tier.tier === 'foundation' ? 'Nền tảng' : tier.tier === 'bridge' ? 'Kết nối' : 'Vận dụng',
    sublabel: `${tier.nodeIds.length} kiến thức`,
    status: i === 0 ? ('active' as const) : ('locked' as const),
  }));

  return {
    goal: `Lộ trình từ ${res.tiers.length} tầng kiến thức`,
    status: 'ai_suggested',
    steps,
  };
}

export function useMutateAiUpdateStudentPath(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: string) => callGenerateLearningPath(studentId, note),
    onSuccess: (learningPath) => {
      queryClient.setQueryData<StudentInsight>(studentInsightQueryKey(studentId), (prev) =>
        prev ? { ...prev, learningPath } : prev,
      );
    },
  });
}
