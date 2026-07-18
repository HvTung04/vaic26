import { useNavigate } from "react-router-dom";
import { CalendarClock, FlaskConical, Sigma } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentTestListItem } from "../types";

const typeIcon = {
  weekly: Sigma,
  practice: FlaskConical,
  revision: Sigma,
} as const;
const typeLabel: Record<StudentTestListItem["type"], string> = {
  weekly: "Kiểm tra định kỳ",
  practice: "Luyện tập",
  revision: "Ôn tập",
};

function formatDue(dueAt: string | null) {
  if (!dueAt) return "Không giới hạn thời gian";
  const days = Math.ceil(
    (new Date(dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return "Đã đến hạn";
  if (days === 1) return "Hết hạn trong 1 ngày";
  return `Hết hạn trong ${days} ngày`;
}

export interface PendingTestListProps {
  tests?: StudentTestListItem[];
  isLoading?: boolean;
}

export function PendingTestList({ tests, isLoading }: PendingTestListProps) {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Bài tập sắp tới</CardTitle>
        {!isLoading && tests && tests.length > 0 && (
          <Badge variant="urgent">{tests.length} bài</Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : tests?.length === 0 ? (
          <p className="text-sm text-ink-faint">
            Bạn đã hoàn thành hết bài tập được giao. Tuyệt vời!
          </p>
        ) : (
          // Capped to ~3 rows tall; the rest scrolls so the card doesn't grow unbounded.
          <div className="flex max-h-[228px] flex-col gap-3 overflow-y-auto pr-1">
            {tests?.map((test) => {
              const Icon = typeIcon[test.type];
              return (
                <div
                  key={test.testId}
                  className="flex items-center gap-3 rounded-bento-sm bg-cream-100 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-bento-sm bg-lavender-soft text-[#6B3FCB]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {test.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="flex items-center gap-1 text-xs text-ink-faint">
                        <CalendarClock className="h-3 w-3" />{" "}
                        {formatDue(test.dueAt)}
                      </span>
                      <Badge
                        variant="neutral"
                        className="px-1.5 py-0.5 text-[10px]"
                      >
                        {typeLabel[test.type]}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => navigate(`/assessment/${test.testId}`)}
                  >
                    Làm ngay
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
