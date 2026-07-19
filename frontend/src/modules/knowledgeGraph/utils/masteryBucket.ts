export type MasteryBucket = 'strong' | 'medium' | 'weak' | 'unattempted';

export function masteryBucket(mastery: number | null): MasteryBucket {
  if (mastery === null) return 'unattempted';
  if (mastery >= 0.75) return 'strong';
  if (mastery >= 0.5) return 'medium';
  return 'weak';
}

export const MASTERY_BUCKET_META: Record<
  MasteryBucket,
  { label: string; bg: string; border: string; text: string; water: string; empty: string }
> = {
  strong: {
    label: 'Vững (≥75%)',
    bg: '#e2f784',
    border: '#7a9a1f',
    text: '#3f4d0c',
    water: '#a8d24c',
    empty: '#f3fad0',
  },
  medium: {
    label: 'Khá (50-74%)',
    bg: '#cfe4ff',
    border: '#3b82f6',
    text: '#1c3a5e',
    water: '#7fb3ff',
    empty: '#e7f1ff',
  },
  weak: {
    label: 'Yếu (<50%)',
    bg: '#c1440e',
    border: '#9a3412',
    text: '#ffffff',
    water: '#e2600f',
    empty: '#ffe9e2',
  },
  unattempted: {
    label: 'Chưa học',
    bg: '#f7f3ea',
    border: '#c9c5b8',
    text: '#8c8a94',
    water: '#e6e2d6',
    empty: '#f7f3ea',
  },
};
