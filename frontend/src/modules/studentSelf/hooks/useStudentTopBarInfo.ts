import { useStudentTests } from '@/modules/testTaking/hooks/useStudentTests';
import { useStudentResults } from '@/modules/testTaking/hooks/useStudentResults';
import { useAuth } from '@/modules/auth/AuthContext';

const RECENT_RESULTS_WINDOW = 3;

export function useStudentTopBarInfo() {
  const user = useAuth().user;
  const pendingQuery = useStudentTests('pending');
  const resultsQuery = useStudentResults();

  const recentScores = (resultsQuery.data ?? [])
    .slice(0, RECENT_RESULTS_WINDOW)
    .map((r) => (r.total > 0 ? (r.score / r.total) * 100 : 0));
  const avgRecentScore = recentScores.length
    ? Math.round(recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length)
    : null;

  return {
    name: user?.fullName ?? 'Học sinh',
    className: user ? `Mã học sinh: ${user.username}` : '',
    pendingCount: pendingQuery.data?.length ?? 0,
    avgRecentScore,
    isLoading: pendingQuery.isLoading || resultsQuery.isLoading,
  };
}
