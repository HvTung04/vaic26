export type PathTierName = 'foundation' | 'bridge' | 'application';

export type PathStatus = 'active' | 'completed' | 'superseded' | 'verified';

export interface PathTier {
  tier: PathTierName;
  nodeIds: string[];
  recommendedQuestionIds: string[];
  rationale: string;
}

export interface LearningPath {
  pathId: string;
  generatedAt: string;
  status: PathStatus;
  tiers: PathTier[];
  /** node_id -> human name, resolved server-side (no client node catalog). */
  nodeNames: Record<string, string>;
}

export type TierProgressStatus = 'completed' | 'current' | 'upcoming';

export interface TierProgress extends PathTier {
  avgMastery: number | null;
  status: TierProgressStatus;
}
