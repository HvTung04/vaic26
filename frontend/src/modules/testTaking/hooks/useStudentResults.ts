import { useQuery } from '@tanstack/react-query';
import { fetchStudentResults } from '../services/testTakingApi';

export function useStudentResults() {
  return useQuery({
    queryKey: ['student-results'],
    queryFn: fetchStudentResults,
  });
}
