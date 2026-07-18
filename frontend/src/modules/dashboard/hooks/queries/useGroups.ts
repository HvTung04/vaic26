import { useQuery } from '@tanstack/react-query';
import { fetchGroups } from '../../services/dashboardApi';

export function useGroups(classId: string) {
  return useQuery({
    queryKey: ['dashboard', 'groups', classId],
    queryFn: () => fetchGroups(classId),
    enabled: Boolean(classId),
  });
}
