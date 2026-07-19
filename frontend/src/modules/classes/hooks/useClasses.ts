import { useQuery } from '@tanstack/react-query';
import { fetchClasses, fetchClassesPaginated } from '../services/classesApi';
import type { ClassListParams } from '../types';

/** Fetch all classes for the current user (sidebar picker). */
export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });
}

/** Fetch classes with pagination, search, and filters. */
export function useClassesPaginated(params: ClassListParams) {
  return useQuery({
    queryKey: ['classes', 'paginated', params],
    queryFn: () => fetchClassesPaginated(params),
  });
}
