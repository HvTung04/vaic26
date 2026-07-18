import { useQuery } from '@tanstack/react-query';
import { fetchClassResults, type ClassResultsData } from '../../services/dashboardApi';

export function useClassResults(classId: string, testId?: string) {
  return useQuery<ClassResultsData>({
    queryKey: ['dashboard', 'class-results', classId, testId],
    queryFn: () => fetchClassResults(classId, testId),
    enabled: Boolean(classId),
  });
}
