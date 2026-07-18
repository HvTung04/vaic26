import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '../../services/dashboardApi';

export function useStudentProfile(studentId: string) {
  return useQuery({
    queryKey: ['dashboard', 'student-profile', studentId],
    queryFn: () => fetchUserProfile(studentId),
    enabled: Boolean(studentId),
  });
}
