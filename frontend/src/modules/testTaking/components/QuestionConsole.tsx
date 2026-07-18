import { ArrowLeft, ArrowRight, Check, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import type { AttemptQuestion } from '../types';

export interface QuestionConsoleProps {
  question: AttemptQuestion;
  index: number;
  totalQuestions: number;
  answer: string;
  onAnswer: (answer: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
}

export function QuestionConsole({
  question,
  index,
  totalQuestions,
  answer,
  onAnswer,
  onPrev,
  onNext,
  onSubmit,
  isFirst,
  isLast,
  isSubmitting,
}: QuestionConsoleProps) {
  return (
    <div className="flex h-full flex-col rounded-bento-lg border border-hairline bg-white p-8 shadow-bento">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-faint">
        Câu {index + 1} / {totalQuestions}
      </p>
      <h1 className="mb-6 font-serif text-2xl font-bold leading-snug text-ink">{question.text}</h1>

      <div className="flex flex-1 flex-col gap-3">
        {question.type === 'mcq' && question.options ? (
          question.options.map((option) => {
            const isSelected = answer === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onAnswer(option)}
                className={cn(
                  'flex items-center gap-4 rounded-bento-sm border px-5 py-4 text-left transition-all duration-200',
                  isSelected
                    ? 'border-lime bg-lime shadow-[0_8px_24px_-8px_rgba(226,247,132,0.6)]'
                    : 'border-hairline bg-white hover:border-ink/20 hover:bg-cream-100',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isSelected ? 'bg-white text-ink' : 'bg-cream-100 text-ink-faint',
                  )}
                >
                  {isSelected ? <Check className="h-4 w-4" /> : null}
                </span>
                <span className={cn('text-sm', isSelected ? 'font-bold text-ink' : 'font-medium text-ink-soft')}>
                  {option}
                </span>
              </button>
            );
          })
        ) : (
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
              Nhập câu trả lời
            </label>
            <Textarea rows={3} value={answer} onChange={(e) => onAnswer(e.target.value)} placeholder="Câu trả lời của bạn..." />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onPrev} disabled={isFirst}>
            <ArrowLeft className="h-4 w-4" /> Trước
          </Button>
          <Button variant="outline" onClick={onNext} disabled={isLast}>
            Tiếp theo <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ember" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài'} <PenLine className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
