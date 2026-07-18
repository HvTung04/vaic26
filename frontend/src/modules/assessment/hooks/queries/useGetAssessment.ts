import { useQuery } from '@tanstack/react-query';
import { fetchAssessment } from '../../services/assessmentApi';

export function useGetAssessment(assessmentId: string) {
  return useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => fetchAssessment(assessmentId),
    enabled: Boolean(assessmentId),
  });
}
