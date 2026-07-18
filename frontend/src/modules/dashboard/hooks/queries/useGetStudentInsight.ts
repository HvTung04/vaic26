import { useQuery } from '@tanstack/react-query';
import { fetchStudentInsight } from '../../services/dashboardApi';

export function studentInsightQueryKey(studentId: string) {
  return ['dashboard', 'student-insight', studentId];
}

export function useGetStudentInsight(studentId: string) {
  return useQuery({
    queryKey: studentInsightQueryKey(studentId),
    queryFn: () => fetchStudentInsight(studentId),
    enabled: Boolean(studentId),
  });
}
