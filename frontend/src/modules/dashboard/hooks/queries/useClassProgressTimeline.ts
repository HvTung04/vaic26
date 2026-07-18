import { useQuery } from '@tanstack/react-query';
import { fetchClassProgressTimeline } from '../../services/dashboardApi';

export function useClassProgressTimeline(classId: string) {
  return useQuery({
    queryKey: ['dashboard', 'progress-timeline', classId],
    queryFn: () => fetchClassProgressTimeline(classId),
    enabled: Boolean(classId),
  });
}
