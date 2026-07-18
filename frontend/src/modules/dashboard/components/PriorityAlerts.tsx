import {
  AlertTriangle,
  TrendingDown,
  CalendarOff,
  Gauge,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  PriorityAlerts as PriorityAlertsData,
  PriorityAlertStudent,
} from "../types";

function initials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AlertRow({
  student,
  onSelect,
}: {
  student: PriorityAlertStudent;
  onSelect?: (id: string) => void;
}) {
  const Icon =
    student.category === "ability"
      ? TrendingDown
      : student.reason.includes("Nghỉ")
        ? CalendarOff
        : Gauge;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(student.id)}
        className="flex w-full items-center gap-3 rounded-bento-sm px-2 py-2 text-left transition-colors hover:bg-ink/3"
      >
        <Avatar className="h-9 w-9 border border-hairline">
          <AvatarFallback
            className={
              student.severity === "critical"
                ? "bg-primary/15 text-primary"
                : "bg-lavender-soft text-ink"
            }
          >
            {initials(student.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {student.name}
          </p>
          <p
            className={
              student.severity === "critical"
                ? "flex items-center gap-1 text-xs font-medium text-primary"
                : "flex items-center gap-1 text-xs font-medium text-ink-faint"
            }
          >
            <Icon className="h-3 w-3" />
            {student.reason}
          </p>
        </div>
      </button>
    </li>
  );
}

export interface PriorityAlertsProps {
  data?: PriorityAlertsData;
  isLoading?: boolean;
  onViewAll?: () => void;
  onSelectStudent?: (id: string) => void;
}

export function PriorityAlertsCard({
  data,
  isLoading,
  onViewAll,
  onSelectStudent,
}: PriorityAlertsProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Hàng đợi ưu tiên
        </CardTitle>
        {isLoading ? (
          <Skeleton className="h-6 w-20 rounded-full" />
        ) : (
          <Badge variant="urgent">{data?.urgentCount ?? 0} Khẩn cấp</Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-bento-sm bg-coral-soft/50 p-3">
            <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              <Gauge className="h-3 w-3" /> Kết quả học tập
            </p>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <ul className="space-y-1">
                {data?.ability.map((student) => (
                  <AlertRow
                    key={student.id}
                    student={student}
                    onSelect={onSelectStudent}
                  />
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-bento-sm bg-lavender-soft/50 p-3">
            <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              <Ban className="h-3 w-3" /> Mức độ tham gia
            </p>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <ul className="space-y-1">
                {data?.engagement.map((student) => (
                  <AlertRow
                    key={student.id}
                    student={student}
                    onSelect={onSelectStudent}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="mt-auto text-center text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Xem tất cả cảnh báo &rsaquo;
        </button>
      </CardContent>
    </Card>
  );
}
