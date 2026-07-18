import { useQuery } from '@tanstack/react-query';
import { fetchTeacherOverview } from '../services/dashboardApi';

export function useClassTelemetry() {
  return useQuery({
    queryKey: ['dashboard', 'teacher-overview'],
    queryFn: fetchTeacherOverview,
  });
}
