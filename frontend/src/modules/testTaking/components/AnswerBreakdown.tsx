import { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { QuestionResult } from '../types';

export interface AnswerBreakdownProps {
  results: QuestionResult[];
}

/** One option row inside an expanded MCQ question — correct choice is always
 * green; the student's choice is red when it was wrong (green too when right,
 * since it's then the same option as the correct answer). */
function OptionRow({ option, result }: { option: string; result: QuestionResult }) {
  const isCorrectOption = option === result.correctAnswer;
  const isStudentChoice = option === result.studentAnswer;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-bento-sm border px-4 py-2.5 text-sm',
        isCorrectOption
          ? 'border-lime bg-lime/40 font-semibold text-ink'
          : isStudentChoice
            ? 'border-coral bg-coral-soft font-semibold text-ink'
            : 'border-hairline bg-white text-ink-soft',
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
        {isCorrectOption ? (
          <Check className="h-4 w-4 text-[#5A7300]" />
        ) : isStudentChoice ? (
          <X className="h-4 w-4 text-[#B23A1F]" />
        ) : null}
      </span>
      {option}
    </div>
  );
}

export function AnswerBreakdown({ results }: AnswerBreakdownProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(questionId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {results.map((result, index) => {
        const isOpen = expanded.has(result.questionId);
        return (
          <li key={result.questionId} className="overflow-hidden rounded-bento-sm border border-hairline bg-white">
            <button
              type="button"
              onClick={() => toggle(result.questionId)}
              className="flex w-full items-start justify-between gap-4 p-4 text-left"
            >
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
              <div className="flex shrink-0 items-center gap-2">
                {!result.isCorrect && <Badge variant="lavender">Cần ôn lại</Badge>}
                <ChevronDown className={cn('h-4 w-4 text-ink-faint transition-transform', isOpen && 'rotate-180')} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-hairline/70 bg-cream-100/40 p-4 pl-[4.25rem]">
                {result.options && result.options.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {result.options.map((option) => (
                      <OptionRow key={option} option={option} result={result} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-soft">
                    <span>
                      Bạn trả lời:{' '}
                      <span className={cn('font-semibold', result.isCorrect ? 'text-[#5A7300]' : 'text-[#B23A1F]')}>
                        {result.studentAnswer || '—'}
                      </span>
                    </span>
                    {!result.isCorrect && (
                      <span>
                        Đáp án đúng: <span className="font-semibold text-[#5A7300]">{result.correctAnswer}</span>
                      </span>
                    )}
                  </div>
                )}
                {!result.isCorrect && result.rootCauseNodeName && (
                  <p className="mt-3 text-xs text-ink-soft">
                    Lỗ hổng kiến thức: <span className="font-semibold text-ink">{result.rootCauseNodeName}</span>
                  </p>
                )}
                {result.explanation && (
                  <p className="mt-3 text-xs text-ink-soft">
                    Giải thích: <span className="text-ink">{result.explanation}</span>
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
