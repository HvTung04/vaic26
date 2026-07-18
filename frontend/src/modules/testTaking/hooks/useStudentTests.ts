import { useQuery } from '@tanstack/react-query';
import { fetchStudentTests } from '../services/testTakingApi';

export function useStudentTests(status?: string) {
  return useQuery({
    queryKey: ['student-tests', status ?? 'all'],
    queryFn: () => fetchStudentTests(status),
  });
}
