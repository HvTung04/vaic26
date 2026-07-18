import { useQuery } from '@tanstack/react-query';
import { fetchClasses } from '../services/classesApi';

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });
}
