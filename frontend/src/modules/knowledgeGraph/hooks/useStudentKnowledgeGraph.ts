import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthContext';
import { fetchStudentKnowledgeGraph } from '../services/knowledgeGraphApi';

export function useStudentKnowledgeGraph(studentIdOverride?: string) {
  const studentId = studentIdOverride || (useAuth().user?.id ?? '');
  return useQuery({
    queryKey: ['knowledge-graph-full', studentId],
    queryFn: () => fetchStudentKnowledgeGraph(studentId),
    enabled: Boolean(studentId),
    staleTime: 60_000,
  });
}
