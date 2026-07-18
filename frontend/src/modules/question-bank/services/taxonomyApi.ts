import { http } from '@/services/httpClient';
import type { TaxonomyNode } from '../types';

/** GET /taxonomy/nodes — the real curriculum node catalog (docs/curriculum_nodes.json). */
export async function fetchTaxonomyNodes(): Promise<TaxonomyNode[]> {
  return http.get<TaxonomyNode[]>('/taxonomy/nodes');
}

/**
 * GET /taxonomy/topics — nodes deduped by (grade, topic_id), e.g. "Số tự
 * nhiên" once instead of once per L6-t1-B01/B02/B03. `id` here is the shared
 * node-id prefix ("L6-t1"); pass it as `topic` to GET /questions to match
 * every node under that topic.
 */
export async function fetchTaxonomyTopics(): Promise<TaxonomyNode[]> {
  return http.get<TaxonomyNode[]>('/taxonomy/topics');
}
