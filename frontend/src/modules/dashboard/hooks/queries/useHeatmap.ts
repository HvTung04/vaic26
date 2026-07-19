import { useQuery } from '@tanstack/react-query';
import { fetchHeatmap } from '../../services/dashboardApi';

export function useHeatmap(classId: string) {
  return useQuery({
    queryKey: ['dashboard', 'heatmap', classId],
    queryFn: () => fetchHeatmap(classId),
    enabled: Boolean(classId),
  });
}
