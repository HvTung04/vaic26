import { History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import type { QuizAttempt } from "../types";

function scoreColor(ratio: number) {
  if (ratio >= 0.85) return "bg-lime";
  if (ratio >= 0.7) return "bg-sky";
  return "bg-coral-soft";
}

function ScoreBars({ ratio }: { ratio: number }) {
  const bars = [0.25, 0.5, 0.75, 1];
  return (
    <div className="flex items-end gap-0.5">
      {bars.map((threshold, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full",
            ratio >= threshold ? scoreColor(ratio) : "bg-ink/10",
          )}
          style={{ height: `${8 + i * 4}px` }}
        />
      ))}
    </div>
  );
}

export interface QuizHistoryListProps {
  attempts?: QuizAttempt[];
  isLoading?: boolean;
}

export function QuizHistoryList({ attempts, isLoading }: QuizHistoryListProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Test Results</CardTitle>
        <History className="h-4 w-4 text-ink-faint" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : (
          attempts?.map((attempt) => {
            const ratio = attempt.score / attempt.maxScore;
            return (
              <div
                key={attempt.id}
                className="flex items-center justify-between gap-3 rounded-bento-sm p-1"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="lavender">{attempt.subject}</Badge>
                    <span className="text-[11px] text-ink-faint">
                      {attempt.date}
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold text-ink">
                    {attempt.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-ink">
                    {attempt.score}
                    <span className="text-xs font-medium text-ink-faint">
                      /{attempt.maxScore}
                    </span>
                  </span>
                  <ScoreBars ratio={ratio} />
                </div>
              </div>
            );
          })
        )}
        <button className="pt-1 text-center text-sm font-semibold text-primary transition-colors hover:text-primary/80">
          View All &rarr;
        </button>
      </CardContent>
    </Card>
  );
}
