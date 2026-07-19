import { useQuery } from '@tanstack/react-query';
import { fetchSchedule } from '../../services/dashboardApi';

export function useSchedule(classId: string, date: string) {
  return useQuery({
    queryKey: ['dashboard', 'schedule', classId, date],
    queryFn: () => fetchSchedule(classId, date),
    enabled: Boolean(classId) && Boolean(date),
  });
}
