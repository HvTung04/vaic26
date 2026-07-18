import { useMutation } from '@tanstack/react-query';
import { fetchPracticeQuestions } from '../services/practiceApi';

export function usePracticeQuestions() {
  return useMutation({
    mutationFn: ({ nodeId, count }: { nodeId: string; count?: number }) => fetchPracticeQuestions(nodeId, count),
  });
}
