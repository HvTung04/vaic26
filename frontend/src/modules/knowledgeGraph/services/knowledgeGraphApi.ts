import { withMockDelay } from '@/services/mockClient';
import { CURRENT_STUDENT } from '@/modules/studentSelf/constants';
import { nodeName } from '@/modules/studentSelf/knowledgeNodes';
import { getMasteryState } from '@/modules/studentSelf/masteryStore';
import type { GraphState } from '../types';

export async function fetchMyKnowledgeState(): Promise<GraphState> {
  const nodes = getMasteryState()
    .map((record) => ({
      nodeId: record.nodeId,
      nodeName: nodeName(record.nodeId),
      mastery: record.mastery,
      confidence: record.confidence,
      attempts: record.attempts,
      lastUpdated: record.lastUpdated,
      needsReview: record.needsReview,
    }))
    .sort((a, b) => a.mastery - b.mastery);
  return withMockDelay({ studentId: CURRENT_STUDENT.id, nodes });
}
