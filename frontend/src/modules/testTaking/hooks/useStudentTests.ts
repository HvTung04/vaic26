import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/AuthContext';
import { fetchStudentTests } from '../services/testTakingApi';

export function useStudentTests(status?: string, studentIdOverride?: string) {
  const studentId = studentIdOverride || (useAuth().user?.id ?? '');
  return useQuery({
    queryKey: ['student-tests', studentId, status ?? 'all'],
    queryFn: () => fetchStudentTests(studentId, status),
    enabled: Boolean(studentId),
  });
}
