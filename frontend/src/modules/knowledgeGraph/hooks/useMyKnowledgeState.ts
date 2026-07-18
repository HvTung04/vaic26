import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthContext';
import { fetchMyKnowledgeState } from '../services/knowledgeGraphApi';

export function useMyKnowledgeState() {
  const studentId = useAuth().user?.id ?? '';
  return useQuery({
    queryKey: ['knowledge-graph', studentId],
    queryFn: () => fetchMyKnowledgeState(studentId),
    enabled: Boolean(studentId),
  });
}
