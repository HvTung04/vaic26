import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentProfile } from "@/modules/dashboard/hooks/queries/useStudentProfile";
import { AIInsightCard } from "@/modules/dashboard/components/AIInsightCard";
import { PathEditorPanel } from "@/modules/dashboard/components/PathEditorPanel";
import { buildAiInsight } from "@/modules/dashboard/utils/buildAiInsight";
import { LearningPathTextSummary } from "@/modules/learningPath/components/LearningPathTextSummary";
import { useLearningPathProgress } from "@/modules/learningPath/hooks/useLearningPathProgress";
import { useMyKnowledgeState } from "@/modules/knowledgeGraph/hooks/useMyKnowledgeState";
import { KnowledgeMasteryMap } from "@/modules/knowledgeGraph/components/KnowledgeMasteryMap";
import { useStudentResults } from "@/modules/testTaking/hooks/useStudentResults";
import { ResultHistoryList } from "@/modules/testTaking/components/ResultHistoryList";
import { ScoreTrendChart } from "@/modules/testTaking/components/ScoreTrendChart";

function initials(name: string) {
  return name.split(" ").slice(-2).map((p) => p[0]).join("");
}

export default function StudentInsights() {
  const { studentId = "" } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading: isProfileLoading } = useStudentProfile(studentId);
  const { data: results, isLoading: isResultsLoading } = useStudentResults(studentId);
  const { data: graphState, isLoading: isGraphLoading } = useMyKnowledgeState(studentId);
  const { path, tiers, isLoading: isPathLoading } = useLearningPathProgress(studentId);

  const aiInsight = buildAiInsight(graphState?.nodes, results);

  return (
    <div className="animate-slide-in-right">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại Dashboard
      </button>

      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-14 w-14 border border-hairline">
          <AvatarFallback className="bg-lavender-soft text-lg text-ink">
            {isProfileLoading ? "" : initials(profile?.fullName ?? studentId)}
          </AvatarFallback>
        </Avatar>
        <div>
          {isProfileLoading ? (
            <Skeleton className="h-7 w-40" />
          ) : (
            <h1 className="font-serif text-2xl font-bold text-ink">
              {profile?.fullName ?? studentId}
            </h1>
          )}
          {profile?.username && (
            <p className="text-sm text-ink-soft">@{profile.username}</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <AIInsightCard
          summary={aiInsight.summary}
          weakTopics={aiInsight.weakTopics}
          strongTopics={aiInsight.strongTopics}
          isLoading={isGraphLoading || isResultsLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <LearningPathTextSummary
              tiers={tiers}
              pathStatus={path?.status}
              nodeNames={path?.nodeNames}
              generatedAt={path?.generatedAt}
              isLoading={isPathLoading}
              hasPath={Boolean(path)}
            />
            <PathEditorPanel studentId={studentId} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Xu hướng điểm số</CardTitle>
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

        <div className="lg:col-span-1">
          <KnowledgeMasteryMap nodes={graphState?.nodes} isLoading={isGraphLoading} />
        </div>

        <div className="lg:col-span-3">
          <ResultHistoryList
            history={results}
            isLoading={isResultsLoading}
            limit={5}
            viewAllHref={`/dashboard/students/${studentId}/results`}
            getRowHref={(submissionId) => `/dashboard/submissions/${submissionId}`}
          />
        </div>
      </div>
    </div>
  );
}
