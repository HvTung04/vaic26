import { BookOpen, Users, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CurrentLesson } from '../types';

export interface CurrentLessonCardProps {
  lesson?: CurrentLesson;
  isLoading?: boolean;
}

export function CurrentLessonCard({ lesson, isLoading }: CurrentLessonCardProps) {
  return (
    <Card className="flex h-full flex-col justify-between">
      <CardContent className="flex flex-1 flex-col justify-between p-4">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-bento-sm bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">Bài học hiện tại</span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <h3 className="font-display text-3xl font-bold leading-snug text-ink">
                {lesson?.name ?? '—'}
              </h3>
              <p className="text-[11px] text-ink-faint">{lesson?.book ?? ''}</p>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-4">
              <div className="flex items-center gap-2 text-[11px] text-ink-soft">
              </div>
              <div className="flex items-center gap-2 text-[11px] text-ink-soft">
                <Clock className="h-3 w-3" />
                <span>Tiết 3 · Thứ 4</span>
              </div>
              <button
                type="button"
                className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Xem chi tiết bài <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
