import { useQuery } from '@tanstack/react-query';
import { fetchGapRadar } from '../../services/dashboardApi';

export function useGapRadar(classId: string) {
  return useQuery({
    queryKey: ['dashboard', 'gap-radar', classId],
    queryFn: () => fetchGapRadar(classId),
    enabled: Boolean(classId),
  });
}
