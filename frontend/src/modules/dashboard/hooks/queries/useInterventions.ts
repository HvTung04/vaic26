import { useQuery } from '@tanstack/react-query';
import { fetchInterventions } from '../../services/dashboardApi';

export function useInterventions(classId: string) {
  return useQuery({
    queryKey: ['dashboard', 'interventions', classId],
    queryFn: () => fetchInterventions(classId),
    enabled: Boolean(classId),
  });
}
