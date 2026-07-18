import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CLASS_ID, fetchClassTests } from '../services/testsApi';

export function useClassTests(classId: string = DEFAULT_CLASS_ID) {
  return useQuery({
    queryKey: ['tests', 'class', classId],
    queryFn: () => fetchClassTests(classId),
  });
}
