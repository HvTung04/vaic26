import { useStudentTests } from '@/modules/testTaking/hooks/useStudentTests';
import { useStudentResults } from '@/modules/testTaking/hooks/useStudentResults';
import { CURRENT_STUDENT } from '../constants';

const RECENT_RESULTS_WINDOW = 3;

export function useStudentTopBarInfo() {
  const pendingQuery = useStudentTests('pending');
  const resultsQuery = useStudentResults();

  const recentScores = (resultsQuery.data ?? [])
    .slice(0, RECENT_RESULTS_WINDOW)
    .map((r) => (r.total > 0 ? (r.score / r.total) * 100 : 0));
  const avgRecentScore = recentScores.length
    ? Math.round(recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length)
    : null;

  return {
    name: CURRENT_STUDENT.name,
    className: CURRENT_STUDENT.className,
    pendingCount: pendingQuery.data?.length ?? 0,
    avgRecentScore,
    isLoading: pendingQuery.isLoading || resultsQuery.isLoading,
  };
}
