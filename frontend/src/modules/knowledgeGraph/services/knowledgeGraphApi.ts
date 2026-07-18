import { http } from '@/services/httpClient';
import type { GraphState } from '../types';

/**
 * GET /graph/students/{id}/state — the student's mastery across attempted nodes.
 * camelCased response already matches {@link GraphState} (incl. `node_name`,
 * which the API supplies so the UI needs no separate node-catalog lookup).
 * Sorted weakest-first so the "revision CTA" can take nodes[0].
 */
export async function fetchMyKnowledgeState(studentId: string): Promise<GraphState> {
  const state = await http.get<GraphState>(`/graph/students/${studentId}/state`);
  return { ...state, nodes: [...state.nodes].sort((a, b) => a.mastery - b.mastery) };
}
