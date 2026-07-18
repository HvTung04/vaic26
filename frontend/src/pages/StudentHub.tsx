import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentTests } from '@/modules/testTaking/hooks/useStudentTests';
import { useStudentResults } from '@/modules/testTaking/hooks/useStudentResults';
import { PendingTestList } from '@/modules/testTaking/components/PendingTestList';
import { ResultHistoryList } from '@/modules/testTaking/components/ResultHistoryList';
import { ScoreTrendChart } from '@/modules/testTaking/components/ScoreTrendChart';
import { useMyKnowledgeState } from '@/modules/knowledgeGraph/hooks/useMyKnowledgeState';
import { KnowledgeMasteryMap } from '@/modules/knowledgeGraph/components/KnowledgeMasteryMap';
import { useLearningPathProgress } from '@/modules/learningPath/hooks/useLearningPathProgress';
import { LearningPathTiers } from '@/modules/learningPath/components/LearningPathTiers';
import { RevisionCta } from '@/modules/revision/components/RevisionCta';

export default function StudentHub() {
  const { data: pendingTests, isLoading: isTestsLoading } = useStudentTests('pending');
  const { data: results, isLoading: isResultsLoading } = useStudentResults();
  const { data: graphState, isLoading: isGraphLoading } = useMyKnowledgeState();
  const { tiers, path, isLoading: isPathLoading } = useLearningPathProgress();

  return (
    <div className="flex flex-col gap-6">
      <RevisionCta weakestNode={graphState?.nodes[0]} isLoading={isGraphLoading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Kết quả học tập</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-bento-sm bg-cream-100 text-ink-soft">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-ink-faint">Xu hướng điểm số các bài kiểm tra gần đây</p>
            {isResultsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ScoreTrendChart history={results ?? []} height={190} />
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <PendingTestList tests={pendingTests} isLoading={isTestsLoading} />
        </div>

        <div className="lg:col-span-1 lg:row-span-2">
          <ResultHistoryList history={results} isLoading={isResultsLoading} />
        </div>

        <div className="lg:col-span-1">
          <KnowledgeMasteryMap nodes={graphState?.nodes} isLoading={isGraphLoading} />
        </div>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {isPathLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              tiers.length > 0 && <LearningPathTiers tiers={tiers} pathStatus={path?.status} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
