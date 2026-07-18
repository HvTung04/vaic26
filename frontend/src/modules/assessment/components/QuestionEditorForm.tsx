import { Trash2, Copy, ImagePlus, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import type { Question, QuestionOptionKey } from "../types";

export interface QuestionEditorFormProps {
  question: Question;
  totalQuestions: number;
  onChange: (question: Question) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function QuestionEditorForm({
  question,
  totalQuestions,
  onChange,
  onSave,
  isSaving,
}: QuestionEditorFormProps) {
  const updateOption = (key: QuestionOptionKey, text: string) => {
    onChange({
      ...question,
      options: question.options.map((opt) =>
        opt.key === key ? { ...opt, text } : opt,
      ),
    });
  };

  return (
    <div className="rounded-bento-lg border border-hairline/70 bg-white p-6 shadow-bento">
      <div className="mb-5 flex items-center justify-between">
        <Badge variant="sky">
          Question {String(question.order).padStart(2, "0")} / {totalQuestions}
        </Badge>
        <div className="flex items-center gap-1 text-ink-faint">
          <button
            type="button"
            className="rounded-bento-sm p-2 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-bento-sm p-2 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
          Question Prompt
        </label>
        <Textarea
          rows={3}
          placeholder="Enter your question here... e.g. Which organelle is known as the powerhouse of the cell?"
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {question.options.map((option) => (
          <div key={option.key}>
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
              Option {option.key}
              <button
                type="button"
                onClick={() =>
                  onChange({ ...question, correctOption: option.key })
                }
                className={cn(
                  "ml-auto h-3.5 w-3.5 rounded-full border-2 transition-colors",
                  question.correctOption === option.key
                    ? "border-forest bg-forest"
                    : "border-hairline bg-white",
                )}
                aria-label={`Mark option ${option.key} as correct`}
              />
            </label>
            <Input
              placeholder="Enter option text..."
              value={option.text}
              onChange={(e) => updateOption(option.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
