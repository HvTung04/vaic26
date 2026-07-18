import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateRevisionTest } from '@/modules/testTaking/services/testTakingApi';

export function useGenerateRevisionTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) => generateRevisionTest(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tests'] });
    },
  });
}
