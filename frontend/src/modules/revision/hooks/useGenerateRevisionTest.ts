import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthContext';
import { generateRevisionTest } from '@/modules/testTaking/services/testTakingApi';

export function useGenerateRevisionTest() {
  const queryClient = useQueryClient();
  const studentId = useAuth().user?.id ?? '';
  return useMutation({
    mutationFn: (nodeId: string) => generateRevisionTest(studentId, nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-tests'] });
    },
  });
}
