import { Link } from 'react-router-dom';
import { ChevronRight, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StudentResultHistoryItem } from '../types';

export interface TestHistoryFullListProps {
  history?: StudentResultHistoryItem[];
  isLoading?: boolean;
  /** Where a row links to. Defaults to the student's own submission detail page. */
  getRowHref?: (submissionId: string) => string;
}

/** Full (non-capped) test-history list — shared by the student's own history
 * page and the teacher's "view all" drill-down for a given student. */
export function TestHistoryFullList({
  history,
  isLoading,
  getRowHref = (submissionId) => `/student/results/${submissionId}`,
}: TestHistoryFullListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (history?.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <History className="h-8 w-8 text-ink-faint" />
          <p className="text-sm text-ink-faint">Chưa có bài kiểm tra nào được chấm.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {history?.map((item) => {
        const percent = item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;
        return (
          <Link key={item.submissionId} to={getRowHref(item.submissionId)}>
            <Card className="transition-colors hover:border-ink/20">
              <CardContent className="flex items-center justify-between gap-4 py-5">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[11px] text-ink-faint">
                    {new Date(item.submittedAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                  <h3 className="truncate font-serif text-base font-semibold text-ink">{item.title}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-display text-xl font-semibold text-ink">{percent}%</span>
                  <ChevronRight className="h-4 w-4 text-ink-faint" />
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
