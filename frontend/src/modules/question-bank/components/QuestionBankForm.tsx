import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { KNOWLEDGE_NODES } from "../constants";
import type {
  QuestionBankDifficulty,
  QuestionBankDraftInput,
  QuestionBankItem,
  QuestionBankType,
} from "../types";

const DEFAULT_OPTIONS = [
  { key: "A", text: "" },
  { key: "B", text: "" },
  { key: "C", text: "" },
  { key: "D", text: "" },
];

const DIFFICULTY_OPTIONS: {
  value: QuestionBankDifficulty;
  label: string;
  variant: "mint" | "sky" | "coral";
}[] = [
  { value: "easy", label: "Easy", variant: "mint" },
  { value: "medium", label: "Medium", variant: "sky" },
  { value: "hard", label: "Hard", variant: "coral" },
];

function initialCorrectKey(item?: QuestionBankItem) {
  return (
    item?.options?.find((o) => o.text === item.answer)?.key ??
    item?.options?.[0]?.key ??
    "A"
  );
}

export interface QuestionBankFormProps {
  initialValue?: QuestionBankItem;
  onSubmit: (payload: QuestionBankDraftInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function QuestionBankForm({
  initialValue,
  onSubmit,
  onCancel,
  isSubmitting,
}: QuestionBankFormProps) {
  const isEditMode = Boolean(initialValue);
  const [type, setType] = useState<QuestionBankType>(
    initialValue?.type ?? "mcq",
  );
  const [text, setText] = useState(initialValue?.text ?? "");
  const [options, setOptions] = useState(
    initialValue?.options ?? DEFAULT_OPTIONS,
  );
  const [correctKey, setCorrectKey] = useState(initialCorrectKey(initialValue));
  const [shortAnswer, setShortAnswer] = useState(
    type === "short_answer" ? (initialValue?.answer ?? "") : "",
  );
  const [difficulty, setDifficulty] = useState<QuestionBankDifficulty>(
    initialValue?.difficulty ?? "medium",
  );
  const [nodeId, setNodeId] = useState(
    initialValue?.node_id ?? KNOWLEDGE_NODES[0].id,
  );
  const [explanation, setExplanation] = useState(
    initialValue?.explanation ?? "",
  );

  const updateOption = (key: string, value: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.key === key ? { ...opt, text: value } : opt)),
    );
  };

  const handleSubmit = () => {
    const payload: QuestionBankDraftInput =
      type === "mcq"
        ? {
            text,
            type,
            answer: options.find((o) => o.key === correctKey)?.text ?? "",
            difficulty,
            node_id: nodeId,
            options,
            explanation: explanation.trim() || null,
          }
        : {
            text,
            type,
            answer: shortAnswer,
            difficulty,
            node_id: nodeId,
            options: null,
            explanation: explanation.trim() || null,
          };
    onSubmit(payload);
  };

  const isValid =
    text.trim().length > 0 &&
    (type === "short_answer"
      ? shortAnswer.trim().length > 0
      : options.every((o) => o.text.trim().length > 0));

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Question Type
          </label>
          <div className="flex gap-1.5">
            {(["mcq", "short_answer"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                  type === value
                    ? "bg-ink text-cream"
                    : "bg-cream-100 text-ink-soft hover:bg-ink/10",
                )}
              >
                {value === "mcq" ? "Multiple Choice" : "Short Answer"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Question Text
          </label>
          <Textarea
            rows={3}
            placeholder="Enter your question here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {type === "mcq" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {options.map((option) => (
              <div key={option.key}>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
                  Option {option.key}
                  <button
                    type="button"
                    onClick={() => setCorrectKey(option.key)}
                    className={cn(
                      "ml-auto h-3.5 w-3.5 rounded-full border-2 transition-colors",
                      correctKey === option.key
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
        ) : (
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
              Correct Answer
            </label>
            <Input
              placeholder="Enter the expected answer..."
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
              Difficulty
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    "rounded-full transition-opacity",
                    difficulty === d.value
                      ? "opacity-100"
                      : "opacity-40 hover:opacity-70",
                  )}
                >
                  <Badge variant={d.variant}>{d.label}</Badge>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
              Topic / Knowledge Node
            </label>
            <select
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="h-11 w-full rounded-bento-sm border border-hairline bg-white px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            >
              {KNOWLEDGE_NODES.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Explanation{" "}
            <span className="normal-case text-ink-faint/70">(optional)</span>
          </label>
          <Textarea
            rows={2}
            placeholder="Explain why the correct answer is right..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-hairline/70 pt-5">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditMode ? "Save Changes" : "Create Question"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
