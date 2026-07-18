import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthContext';
import { fetchStudentResults } from '../services/testTakingApi';

export function useStudentResults() {
  const studentId = useAuth().user?.id ?? '';
  return useQuery({
    queryKey: ['student-results', studentId],
    queryFn: () => fetchStudentResults(studentId),
    enabled: Boolean(studentId),
  });
}
