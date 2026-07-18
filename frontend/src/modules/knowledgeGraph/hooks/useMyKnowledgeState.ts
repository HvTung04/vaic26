import { useQuery } from '@tanstack/react-query';
import { fetchMyKnowledgeState } from '../services/knowledgeGraphApi';

export function useMyKnowledgeState() {
  return useQuery({
    queryKey: ['knowledge-graph', 'me'],
    queryFn: fetchMyKnowledgeState,
  });
}
