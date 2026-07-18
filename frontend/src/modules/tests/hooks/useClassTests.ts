import { useQuery } from '@tanstack/react-query';
import { fetchClassTests } from '../services/testsApi';

export function useClassTests(classId: string) {
  return useQuery({
    queryKey: ['tests', 'class', classId],
    queryFn: () => fetchClassTests(classId),
    enabled: Boolean(classId),
  });
}
