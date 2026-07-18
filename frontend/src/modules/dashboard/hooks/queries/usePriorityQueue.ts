import { useQuery } from '@tanstack/react-query';
import { fetchPriorityQueue } from '../../services/dashboardApi';

export function usePriorityQueue(classId: string) {
  return useQuery({
    queryKey: ['dashboard', 'priority-queue', classId],
    queryFn: () => fetchPriorityQueue(classId),
    enabled: Boolean(classId),
  });
}
