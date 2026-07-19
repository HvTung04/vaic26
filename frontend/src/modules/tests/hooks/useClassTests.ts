import { useQuery } from '@tanstack/react-query';
import { fetchClassTests, fetchClassTestsPaginated } from '../services/testsApi';
import type { TestListParams } from '../types';

/** Fetch all tests for a class (legacy, no pagination). */
export function useClassTests(classId: string) {
  return useQuery({
    queryKey: ['tests', 'class', classId],
    queryFn: () => fetchClassTests(classId),
    enabled: Boolean(classId),
  });
}

/** Fetch tests with pagination, search, and type filter. */
export function useClassTestsPaginated(params: TestListParams) {
  return useQuery({
    queryKey: ['tests', 'paginated', params],
    queryFn: () => fetchClassTestsPaginated(params),
    enabled: Boolean(params.classId),
  });
}
