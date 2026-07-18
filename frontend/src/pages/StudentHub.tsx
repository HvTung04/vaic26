import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStudentHub } from "@/modules/dashboard/hooks/queries/useGetStudentHub";
import { PerformanceChart } from "@/modules/dashboard/components/PerformanceChart";
import { StudentTaskList } from "@/modules/dashboard/components/StudentTaskList";
import { QuizHistoryList } from "@/modules/dashboard/components/QuizHistoryList";
import { LearningPathMap } from "@/modules/dashboard/components/LearningPathMap";

export default function StudentHub() {
  const { data, isLoading } = useGetStudentHub();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Exercise Performance</CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-bento-sm bg-cream-100 text-ink-soft">
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-ink-faint">Hiệu suất 30 ngày qua</p>
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

      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            data && <LearningPathMap path={data.learningPath} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
