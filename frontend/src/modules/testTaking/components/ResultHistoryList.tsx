import { ChevronRight, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { StudentResultHistoryItem } from '../types';

function scoreColor(ratio: number) {
  if (ratio >= 0.85) return 'bg-lime';
  if (ratio >= 0.7) return 'bg-sky';
  return 'bg-coral-soft';
}

function ScoreBars({ ratio }: { ratio: number }) {
  const bars = [0.25, 0.5, 0.75, 1];
  return (
    <div className="flex items-end gap-0.5">
      {bars.map((threshold, i) => (
        <span
          key={i}
          className={cn('w-1 rounded-full', ratio >= threshold ? scoreColor(ratio) : 'bg-ink/10')}
          style={{ height: `${8 + i * 4}px` }}
        />
      ))}
    </div>
  );
}

export interface ResultHistoryListProps {
  history?: StudentResultHistoryItem[];
  isLoading?: boolean;
}

export function ResultHistoryList({ history, isLoading }: ResultHistoryListProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Kết quả bài kiểm tra</CardTitle>
        <Link
          to="/student/results"
          className="flex items-center gap-1 text-xs font-semibold text-ink-faint transition-colors hover:text-primary"
        >
          Xem lịch sử <History className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : (
          history?.slice(0, 6).map((item) => {
            const ratio = item.total > 0 ? item.score / item.total : 0;
            return (
              <Link
                key={item.submissionId}
                to={`/student/results/${item.submissionId}`}
                className="flex items-center justify-between gap-3 rounded-bento-sm p-1 transition-colors hover:bg-ink/[0.03]"
              >
                <div className="min-w-0">
                  <p className="mb-1 text-[11px] text-ink-faint">
                    {new Date(item.submittedAt).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-ink">
                    {item.score}
                    <span className="text-xs font-medium text-ink-faint">/{item.total}</span>
                  </span>
                  <ScoreBars ratio={ratio} />
                  <ChevronRight className="h-4 w-4 text-ink-faint" />
                </div>
              </Link>
            );
          })
        )}
        {!isLoading && history?.length === 0 && (
          <p className="text-sm text-ink-faint">Chưa có bài kiểm tra nào được chấm.</p>
        )}
      </CardContent>
    </Card>
  );
}
