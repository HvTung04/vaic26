import { useQuery } from '@tanstack/react-query';
import { fetchTestResults } from '../services/testsApi';

export function useTestResults(testId: string) {
  return useQuery({
    queryKey: ['tests', testId, 'results'],
    queryFn: () => fetchTestResults(testId),
    enabled: Boolean(testId),
  });
}
