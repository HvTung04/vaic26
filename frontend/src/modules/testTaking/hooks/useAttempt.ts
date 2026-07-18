import { useQuery } from '@tanstack/react-query';
import { fetchAttempt } from '../services/testTakingApi';

export function useAttempt(testId: string) {
  return useQuery({
    queryKey: ['attempt', testId],
    queryFn: () => fetchAttempt(testId),
    enabled: Boolean(testId),
  });
}
