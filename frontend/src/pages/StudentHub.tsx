import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentTests } from "@/modules/testTaking/hooks/useStudentTests";
import { useStudentResults } from "@/modules/testTaking/hooks/useStudentResults";
import { PendingTestList } from "@/modules/testTaking/components/PendingTestList";
import { ResultHistoryList } from "@/modules/testTaking/components/ResultHistoryList";
import { ScoreTrendChart } from "@/modules/testTaking/components/ScoreTrendChart";
import { useMyKnowledgeState } from "@/modules/knowledgeGraph/hooks/useMyKnowledgeState";
import { KnowledgeMasteryMap } from "@/modules/knowledgeGraph/components/KnowledgeMasteryMap";
import { useLearningPathProgress } from "@/modules/learningPath/hooks/useLearningPathProgress";
import { LearningPathPractice } from "@/modules/learningPath/components/LearningPathPractice";
import { RevisionCta } from "@/modules/revision/components/RevisionCta";

export default function StudentHub() {
  const { data: pendingTests, isLoading: isTestsLoading } =
    useStudentTests("pending");
  const { data: results, isLoading: isResultsLoading } = useStudentResults();
  const { data: graphState, isLoading: isGraphLoading } = useMyKnowledgeState();
  const { tiers, path, isLoading: isPathLoading } = useLearningPathProgress();

  return (
    <div className="flex flex-col gap-6">
      <RevisionCta
        weakestNode={graphState?.nodes[0]}
        isLoading={isGraphLoading}
      />

      {/*
        Desktop (lg:grid-cols-3): row 1 = learning path (full width); row 2 =
        chart (2/3) + pending tests (1/3); row 3 = result history (2/3) +
        mastery map (1/3). Mobile: single column, ordered path > pending >
        chart > history > mastery map via the `order-*` utilities below (grid
        auto-placement follows `order`, so no separate mobile-only markup is
        needed).
      */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="order-1 lg:col-span-3">
          {isPathLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            tiers.length > 0 && (
              <LearningPathPractice
                tiers={tiers}
                pathStatus={path?.status}
                nodeNames={path?.nodeNames}
                masteryNodes={graphState?.nodes}
              />
            )
          )}
        </div>

        <Card className="order-3 lg:order-2 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Kết quả học tập</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-bento-sm bg-cream-100 text-ink-soft">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-ink-faint">
              Xu hướng điểm số các bài kiểm tra gần đây
            </p>
            {isResultsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ScoreTrendChart history={results ?? []} height={190} />
            )}
          </CardContent>
        </Card>

        <div className="order-2 lg:order-3 lg:col-span-1">
          <PendingTestList tests={pendingTests} isLoading={isTestsLoading} />
        </div>

        <div className="order-4 lg:col-span-2">
          <ResultHistoryList history={results} isLoading={isResultsLoading} />
        </div>

        <div className="order-5 lg:col-span-1">
          <KnowledgeMasteryMap
            nodes={graphState?.nodes}
            isLoading={isGraphLoading}
          />
        </div>
      </div>
    </div>
  );
}
