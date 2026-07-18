import { useQuery } from '@tanstack/react-query';
import { fetchSubmissionDetail } from '../services/testsApi';

export function useSubmissionDetail(submissionId: string) {
  return useQuery({
    queryKey: ['submissions', submissionId],
    queryFn: () => fetchSubmissionDetail(submissionId),
    enabled: Boolean(submissionId),
  });
}
