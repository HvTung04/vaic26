import { Trash2, Copy, Sparkles, FileUp, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import type { Question, QuestionOptionKey } from "../types";

const DIFFICULTY_BADGE_VARIANT = {
  Easy: "mint",
  Medium: "sky",
  Hard: "coral",
} as const;

export interface QuestionEditorFormProps {
  question: Question;
  totalQuestions: number;
  onChange: (question: Question) => void;
  onSave: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  canDelete?: boolean;
  isSaving?: boolean;
}

export function QuestionEditorForm({
  question,
  totalQuestions,
  onChange,
  onSave,
  onDelete,
  onDuplicate,
  canDelete = true,
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
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="sky">
            Question {String(question.order).padStart(2, "0")} / {totalQuestions}
          </Badge>
          {question.source === "ai" && (
            <Badge variant="lavender">
              <Sparkles className="h-3 w-3" /> AI generated
            </Badge>
          )}
          {question.source === "import" && (
            <Badge variant="lime">
              <FileUp className="h-3 w-3" /> Imported
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-ink-faint">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-bento-sm p-2 transition-colors hover:bg-ink/5 hover:text-ink"
            aria-label="Duplicate question"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete}
            className="rounded-bento-sm p-2 transition-colors hover:bg-ink/5 hover:text-coral-soft disabled:pointer-events-none disabled:opacity-30"
            aria-label="Delete question"
          >
            <Trash2 className="h-4 w-4" />
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
              className={cn(
                question.correctOption === option.key &&
                  "border-forest/50 bg-[#f0faf3] focus-visible:ring-forest/30",
              )}
            />
          </div>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Topic / Knowledge Node
          </label>
          <Input
            placeholder="e.g. Cell Organelles"
            value={question.topicTag}
            onChange={(e) => onChange({ ...question, topicTag: e.target.value })}
          />
          {question.knowledgeNodeId && (
            <p className="mt-1.5 truncate text-[11px] text-ink-faint">
              Linked node: <span className="font-medium text-ink-soft">{question.knowledgeNodeId}</span>
            </p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Difficulty &amp; Points
          </label>
          <div className="flex h-11 items-center gap-2">
            <Badge variant={DIFFICULTY_BADGE_VARIANT[question.difficulty]}>{question.difficulty}</Badge>
            <Input
              type="number"
              min={0}
              className="h-9 w-24"
              value={question.points}
              onChange={(e) => onChange({ ...question, points: Number(e.target.value) || 0 })}
            />
            <span className="text-xs text-ink-faint">pts</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant={isSaving ? "outline" : "secondary"}
          size="sm"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {isSaving ? "Saving..." : "Save Question"}
        </Button>
      </div>
    </div>
  );
}
