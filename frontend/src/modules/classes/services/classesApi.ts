import { http } from '@/services/httpClient';
import type { ClassListParams, ClassListResult, ClassStudentsResult, ClassSummary } from '../types';

/**
 * Real API bindings for the Classes domain.
 * The httpClient camelCases response keys, so the backend's snake_case
 * (`teacher_id`, `student_count`, `full_name`) already lands on the FE types.
 */

/** GET /classes — all classes for the current user (used by sidebar picker). */
export async function fetchClasses(): Promise<ClassSummary[]> {
  return http.get<ClassSummary[]>('/classes');
}

/** GET /classes — paginated with search/filter. */
export async function fetchClassesPaginated(params: ClassListParams): Promise<ClassListResult> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('page_size', String(params.pageSize));
  if (params.search) searchParams.set('search', params.search);
  if (params.grade) searchParams.set('grade', String(params.grade));
  return http.get<ClassListResult>(`/classes?${searchParams.toString()}`);
}

/** GET /classes/{id} */
export async function fetchClassById(classId: string): Promise<ClassSummary> {
  return http.get<ClassSummary>(`/classes/${classId}`);
}

/** GET /classes/{id}/students → { items, total } */
export async function fetchClassStudents(classId: string): Promise<ClassStudentsResult> {
  return http.get<ClassStudentsResult>(`/classes/${classId}/students`);
}
