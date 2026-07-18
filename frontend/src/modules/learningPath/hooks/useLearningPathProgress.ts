import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '@/modules/auth/AuthContext';
import { useMyKnowledgeState } from '@/modules/knowledgeGraph/hooks/useMyKnowledgeState';
import { fetchMyLearningPath } from '../services/learningPathApi';
import type { TierProgress } from '../types';

const MASTERED_THRESHOLD = 0.75;

export function useLearningPathProgress() {
  const studentId = useAuth().user?.id ?? '';
  const pathQuery = useQuery({
    queryKey: ['learning-path', studentId],
    queryFn: () => fetchMyLearningPath(studentId),
    enabled: Boolean(studentId),
  });
  const graphQuery = useMyKnowledgeState();

  const tiers = useMemo<TierProgress[]>(() => {
    if (!pathQuery.data) return [];
    const masteryByNode = new Map(graphQuery.data?.nodes.map((n) => [n.nodeId, n.mastery]) ?? []);

    const withMastery = pathQuery.data.tiers.map((tier) => {
      const known = tier.nodeIds.map((id) => masteryByNode.get(id)).filter((m): m is number => m !== undefined);
      const avgMastery = known.length ? known.reduce((sum, m) => sum + m, 0) / known.length : null;
      return { ...tier, avgMastery };
    });

    let currentIndex = withMastery.findIndex((t) => t.avgMastery === null || t.avgMastery < MASTERED_THRESHOLD);
    if (currentIndex === -1) currentIndex = withMastery.length;

    return withMastery.map((tier, index) => ({
      ...tier,
      status: index < currentIndex ? ('completed' as const) : index === currentIndex ? ('current' as const) : ('upcoming' as const),
    }));
  }, [pathQuery.data, graphQuery.data]);

  return {
    path: pathQuery.data,
    tiers,
    isLoading: pathQuery.isLoading || graphQuery.isLoading,
  };
}
