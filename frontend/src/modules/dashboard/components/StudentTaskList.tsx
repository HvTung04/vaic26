import { CalendarClock, FlaskConical, Sigma } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentTask } from "../types";

const subjectIcon: Record<string, typeof Sigma> = {
  Toán: Sigma,
  "Vật Lý": FlaskConical,
};

export interface StudentTaskListProps {
  tasks?: StudentTask[];
  isLoading?: boolean;
}

export function StudentTaskList({ tasks, isLoading }: StudentTaskListProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Bài tập sắp đến hạn</CardTitle>
        {!isLoading && tasks && tasks.length > 0 && (
          <Badge variant="urgent">Bắt buộc</Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : (
          tasks?.map((task) => {
            const Icon = subjectIcon[task.subject] ?? Sigma;
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-bento-sm bg-cream-100 p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-bento-sm bg-lavender-soft text-[#6B3FCB]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {task.subject}: {task.title}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-faint">
                    <CalendarClock className="h-3 w-3" /> {task.dueLabel}
                  </p>
                </div>
                {task.urgency === "high" && <Badge variant="urgent">Gấp</Badge>}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
