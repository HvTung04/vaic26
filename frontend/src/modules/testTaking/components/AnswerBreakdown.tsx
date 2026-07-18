import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { QuestionResult } from '../types';

export interface AnswerBreakdownProps {
  results: QuestionResult[];
}

export function AnswerBreakdown({ results }: AnswerBreakdownProps) {
  return (
    <ul className="flex flex-col gap-3">
      {results.map((result, index) => (
        <li
          key={result.questionId}
          className="flex flex-col gap-2 rounded-bento-sm border border-hairline bg-white p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  result.isCorrect ? 'bg-lime text-ink' : 'bg-lavender-soft text-[#6B3FCB]',
                )}
              >
                {result.isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </span>
              <p className="text-sm font-bold text-ink">
                Câu {index + 1}: {result.questionText}
              </p>
            </div>
            {!result.isCorrect && (
              <Badge variant="lavender" className="shrink-0">
                Cần ôn lại
              </Badge>
            )}
          </div>
          {!result.isCorrect && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 pl-11 text-xs text-ink-soft">
              <span>
                Bạn trả lời: <span className="font-semibold text-ink">{result.studentAnswer || '—'}</span>
              </span>
              <span>
                Đáp án đúng: <span className="font-semibold text-ink">{result.correctAnswer}</span>
              </span>
              {result.rootCauseNodeName && (
                <span>
                  Lỗ hổng kiến thức: <span className="font-semibold text-ink">{result.rootCauseNodeName}</span>
                </span>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
