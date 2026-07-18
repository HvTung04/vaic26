import { http } from '@/services/httpClient';
import type { LearningPath } from '../types';

/**
 * GET /students/{id}/learning-path — the student's current path.
 * camelCased response matches {@link LearningPath} directly.
 */
export async function fetchMyLearningPath(studentId: string): Promise<LearningPath> {
  return http.get<LearningPath>(`/students/${studentId}/learning-path`);
}
