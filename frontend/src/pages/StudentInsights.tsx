import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentInsight } from "@/modules/dashboard/hooks/useStudentPath";
import { PerformanceChart } from "@/modules/dashboard/components/PerformanceChart";
import { AIInsightCard } from "@/modules/dashboard/components/AIInsightCard";
import { LearningPathMap } from "@/modules/dashboard/components/LearningPathMap";
import { PathEditorPanel } from "@/modules/dashboard/components/PathEditorPanel";
import { StudentTaskList } from "@/modules/dashboard/components/StudentTaskList";
import { QuizHistoryList } from "@/modules/dashboard/components/QuizHistoryList";

export default function StudentInsights() {
  const { studentId = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useStudentInsight(studentId);

  return (
    <div className="animate-slide-in-right">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại Dashboard
      </button>

      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-14 w-14 border border-hairline">
          <AvatarFallback className="bg-lavender-soft text-lg text-ink">
            {isLoading
              ? ""
              : data?.name
                  .split(" ")
                  .slice(-2)
                  .map((p) => p[0])
                  .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-40" />
          ) : (
            <h1 className="font-serif text-2xl font-bold text-ink">
              {data?.name}
            </h1>
          )}
          <p className="text-sm text-ink-soft">{data?.className}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Exercise Performance</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-bento-sm bg-cream-100 text-ink-soft">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-ink-faint">
              Academic Performance Trend (T11 &rarr; T6)
            </p>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <PerformanceChart
                data={data?.performanceHistory ?? []}
                height={190}
                showLegend={false}
              />
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <StudentTaskList tasks={data?.tasks} isLoading={isLoading} />
        </div>

        <div className="lg:col-span-1 lg:row-span-2">
          <QuizHistoryList attempts={data?.quizHistory} isLoading={isLoading} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                data && <LearningPathMap path={data.learningPath} />
              )}

              <PathEditorPanel studentId={studentId} />
            </CardContent>
          </Card>

          <AIInsightCard
            summary={data?.aiInsightSummary}
            weakTopics={data?.weakTopics}
            strongTopics={data?.strongTopics}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
