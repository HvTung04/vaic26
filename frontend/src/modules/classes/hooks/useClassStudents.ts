import { useQuery } from '@tanstack/react-query';
import { fetchClassStudents } from '../services/classesApi';

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: ['classes', classId, 'students'],
    queryFn: () => fetchClassStudents(classId),
    enabled: Boolean(classId),
  });
}
