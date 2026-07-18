import { useQuery } from '@tanstack/react-query';
import { fetchStudentResultsTeacher } from '../../services/dashboardApi';

export function useStudentResultsTeacher(studentId: string) {
  return useQuery({
    queryKey: ['dashboard', 'student-results', studentId],
    queryFn: () => fetchStudentResultsTeacher(studentId),
    enabled: Boolean(studentId),
  });
}
