import { useQuery } from '@tanstack/react-query';
import { fetchTaxonomyNodes, fetchTaxonomyTopics } from '../../services/taxonomyApi';

/** Curriculum nodes are static reference data — cache indefinitely for the session. */
export function useTaxonomyNodes() {
  return useQuery({
    queryKey: ['taxonomy-nodes'],
    queryFn: fetchTaxonomyNodes,
    staleTime: Infinity,
  });
}

/** Deduped topics (one per grade+topic_id) for the topic filter dropdown. */
export function useTaxonomyTopics() {
  return useQuery({
    queryKey: ['taxonomy-topics'],
    queryFn: fetchTaxonomyTopics,
    staleTime: Infinity,
  });
}
