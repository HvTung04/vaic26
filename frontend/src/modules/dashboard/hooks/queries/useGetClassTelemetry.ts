import { useQuery } from '@tanstack/react-query';
import { fetchTeacherOverview } from '../../services/dashboardApi';

export function useGetClassTelemetry() {
  return useQuery({
    queryKey: ['dashboard', 'teacher-overview'],
    queryFn: fetchTeacherOverview,
  });
}
