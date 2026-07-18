import { useQuery } from '@tanstack/react-query';
import { fetchClassById } from '../services/classesApi';

export function useClassDetail(classId: string) {
  return useQuery({
    queryKey: ['classes', classId],
    queryFn: () => fetchClassById(classId),
    enabled: Boolean(classId),
  });
}
