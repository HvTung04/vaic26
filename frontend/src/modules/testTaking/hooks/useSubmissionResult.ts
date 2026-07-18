import { useQuery } from '@tanstack/react-query';
import { fetchSubmissionResult } from '../services/testTakingApi';

export function useSubmissionResult(submissionId: string) {
  return useQuery({
    queryKey: ['submission-result', submissionId],
    queryFn: () => fetchSubmissionResult(submissionId),
    enabled: Boolean(submissionId),
    refetchInterval: (query) => (query.state.data?.status === 'grading' ? 1000 : false),
  });
}
