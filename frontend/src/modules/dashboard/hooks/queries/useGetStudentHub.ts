import { useQuery } from '@tanstack/react-query';
import { fetchStudentHub } from '../../services/dashboardApi';

export function useGetStudentHub() {
  return useQuery({
    queryKey: ['dashboard', 'student-hub'],
    queryFn: fetchStudentHub,
  });
}
