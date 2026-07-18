import { CalendarClock, CalendarX, Clock, Users, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { ScheduledLesson } from '../data/calendarSchedule';

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function formatDayLabel(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS[date.getDay()]}, ${dd}/${mm}`;
}

export interface DayLessonsCardProps {
  /** Ngày đang chọn trên lịch — card hiển thị đúng các lớp/tiết dạy của ngày này. */
  date: Date;
  lessons: ScheduledLesson[];
  isLoading?: boolean;
}

export function DayLessonsCard({ date, lessons, isLoading }: DayLessonsCardProps) {
  return (
    <Card className="flex h-full max-h-[320px] flex-col overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-bento-sm bg-primary/10">
            <CalendarClock className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">Lịch dạy</span>
            <span className="text-sm font-bold text-ink">{formatDayLabel(date)}</span>
          </div>
        </div>
        {!isLoading && lessons.length > 0 && (
          <Badge variant="sky" className="shrink-0 normal-case tracking-normal">
            {lessons.length} lớp
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pt-0 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] w-full" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            <CalendarX className="h-6 w-6 text-ink-faint" />
            <p className="text-xs text-ink-faint">Không có tiết dạy nào trong ngày này</p>
          </div>
        ) : (
          lessons.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              className="group flex flex-col gap-2 rounded-bento-sm border border-hairline bg-cream-100/60 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                <Clock className="h-3 w-3" />
                <span>{lesson.period} · {lesson.time}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold leading-snug text-ink">{lesson.topic}</span>
                  <span className="text-[11px] text-ink-faint">
                    {lesson.classLabel} · {lesson.subject} · {lesson.book}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-primary" />
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-ink-faint">
                <Users className="h-3 w-3" />
                <span>{lesson.studentCount} học sinh</span>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
