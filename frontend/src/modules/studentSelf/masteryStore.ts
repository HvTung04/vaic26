import { KNOWLEDGE_NODES } from './knowledgeNodes';

export interface MasteryRecord {
  nodeId: string;
  mastery: number;
  confidence: number;
  attempts: number;
  lastUpdated: string;
  needsReview: boolean;
}

/**
 * In-memory stand-in for the real KG mastery service (mastery per knowledge
 * node for the current mock student). Seeded once from historical graded
 * submissions, then nudged further as new attempts get graded — mirrors the
 * shape of GET /graph/students/{id}/state without the real Bayesian model.
 */
const state = new Map<string, MasteryRecord>();

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function applyAnswer(nodeId: string, isCorrect: boolean, at: string): { before: number; after: number } {
  const existing = state.get(nodeId);
  const before = existing?.mastery ?? 0.5;
  const delta = isCorrect ? 0.12 : -0.16;
  const after = clamp01(before + delta);
  const attempts = (existing?.attempts ?? 0) + 1;
  state.set(nodeId, {
    nodeId,
    mastery: after,
    confidence: clamp01(attempts / 8),
    attempts,
    lastUpdated: at,
    needsReview: after < 0.5,
  });
  return { before, after };
}

export function getMasteryState(): MasteryRecord[] {
  return KNOWLEDGE_NODES.map((n) => state.get(n.id)).filter((r): r is MasteryRecord => Boolean(r));
}

export function weakestNode(): MasteryRecord | null {
  const records = getMasteryState();
  if (records.length === 0) return null;
  return records.reduce((weakest, r) => (r.mastery < weakest.mastery ? r : weakest));
}
