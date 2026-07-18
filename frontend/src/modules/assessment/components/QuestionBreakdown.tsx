import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { formatTimeSpent } from '@/utils/format';
import type { QuestionResult } from '../types';

export interface QuestionBreakdownProps {
  results: QuestionResult[];
}

export function QuestionBreakdown({ results }: QuestionBreakdownProps) {
  return (
    <ul className="flex flex-col gap-3">
      {results.map((result) => (
        <li
          key={result.question.id}
          className="flex items-center justify-between gap-4 rounded-bento-sm border border-hairline bg-white p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                result.reviewNeeded ? 'bg-lavender-soft text-[#6B3FCB]' : 'bg-lime text-ink',
              )}
            >
              {result.reviewNeeded ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                Question {String(result.question.order).padStart(2, '0')}: {result.question.topicTag}
              </p>
              <p className="truncate text-xs text-ink-faint">
                Time spent: {formatTimeSpent(result.timeSpentSeconds)} • Difficulty: {result.question.difficulty}
                {result.waverCount > 0 && ` • Changed answer ${result.waverCount}×`}
              </p>
            </div>
          </div>
          {result.reviewNeeded ? (
            <Badge variant="lavender" className="shrink-0">
              Review Needed
            </Badge>
          ) : (
            <span className="shrink-0 text-sm font-bold text-[#5A7300]">+{result.pointsEarned} pts</span>
          )}
        </li>
      ))}
    </ul>
  );
}
