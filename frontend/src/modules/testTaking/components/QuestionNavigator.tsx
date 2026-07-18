import { cn } from '@/utils/cn';
import type { AttemptQuestion } from '../types';

export interface QuestionNavigatorProps {
  questions: AttemptQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  onSelect: (index: number) => void;
}

export function QuestionNavigator({ questions, currentIndex, answers, onSelect }: QuestionNavigatorProps) {
  return (
    <nav className="flex flex-row flex-wrap gap-3 lg:flex-col lg:items-center lg:pt-1">
      {questions.map((question, index) => {
        const isAnswered = Boolean(answers[question.id]?.trim());
        const isActive = index === currentIndex;
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={isActive}
            className={cn(
              'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-200',
              isActive && 'border-2 border-ember bg-white text-ember',
              !isActive && isAnswered && 'bg-lime text-ink',
              !isActive && !isAnswered && 'border border-hairline bg-white text-ink-faint hover:border-ink/20',
            )}
          >
            {index + 1}
            {isActive && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-ember ring-2 ring-cream" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
