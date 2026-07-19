import { useQuery } from '@tanstack/react-query';
import { fetchScheduleDates } from '../../services/dashboardApi';

export function useScheduleDates(classId: string, month: string) {
  return useQuery({
    queryKey: ['dashboard', 'schedule-dates', classId, month],
    queryFn: () => fetchScheduleDates(classId, month),
    enabled: Boolean(classId) && Boolean(month),
  });
}
