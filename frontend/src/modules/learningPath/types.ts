export type PathTierName = 'foundation' | 'bridge' | 'application';

export type PathStatus = 'active' | 'completed' | 'superseded';

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
}

export type TierProgressStatus = 'completed' | 'current' | 'upcoming';

export interface TierProgress extends PathTier {
  avgMastery: number | null;
  status: TierProgressStatus;
}
