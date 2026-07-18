import { ChevronDown } from 'lucide-react';
import type { Question } from '../types';

export interface QuestionListPreviewProps {
  questions: Question[];
  activeQuestionId?: string;
  onSelect: (id: string) => void;
}

export function QuestionListPreview({ questions, activeQuestionId, onSelect }: QuestionListPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      {questions
        .filter((q) => q.id !== activeQuestionId)
        .map((question) => (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelect(question.id)}
            className="flex items-center justify-between gap-3 rounded-bento-lg border border-hairline/70 bg-white px-5 py-4 text-left shadow-bento transition-colors hover:bg-cream-100"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-100 text-xs font-bold text-ink-soft">
                {question.order}
              </span>
              <span className="truncate text-sm font-medium text-ink">
                {question.prompt || 'Chưa có nội dung'}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint" />
          </button>
        ))}
    </div>
  );
}
