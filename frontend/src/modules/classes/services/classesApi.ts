import { http } from '@/services/httpClient';
import type { ClassStudentsResult, ClassSummary } from '../types';

/**
 * Real API bindings for the Classes domain.
 * The httpClient camelCases response keys, so the backend's snake_case
 * (`teacher_id`, `student_count`, `full_name`) already lands on the FE types.
 */

/** GET /classes — classes owned (teacher) or joined (student) by the current user. */
export async function fetchClasses(): Promise<ClassSummary[]> {
  return http.get<ClassSummary[]>('/classes');
}

/** GET /classes/{id} */
export async function fetchClassById(classId: string): Promise<ClassSummary> {
  return http.get<ClassSummary>(`/classes/${classId}`);
}

/** GET /classes/{id}/students → { items, total } */
export async function fetchClassStudents(classId: string): Promise<ClassStudentsResult> {
  return http.get<ClassStudentsResult>(`/classes/${classId}/students`);
}
