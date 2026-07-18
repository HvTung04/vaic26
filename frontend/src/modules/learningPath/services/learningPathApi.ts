import { http } from '@/services/httpClient';
import type { LearningPath } from '../types';

/**
 * GET /students/{id}/learning-path — the student's current path.
 * camelCased response matches {@link LearningPath} directly.
 */
export async function fetchMyLearningPath(studentId: string): Promise<LearningPath> {
  return http.get<LearningPath>(`/students/${studentId}/learning-path`);
}

/**
 * POST /students/{id}/learning-path/verify — teacher-only. Marks the current
 * AI-suggested path as reviewed/approved; the path stays the student's
 * "current" path (status just flips to `verified`).
 */
export async function verifyLearningPath(studentId: string): Promise<LearningPath> {
  return http.post<LearningPath>(`/students/${studentId}/learning-path/verify`, {});
}
