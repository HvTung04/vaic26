import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { NodeSearchSelect } from "./NodeSearchSelect";
import { useTaxonomyNodes } from "../hooks/queries/useTaxonomyNodes";
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
  { value: "easy", label: "Dễ", variant: "mint" },
  { value: "medium", label: "Trung bình", variant: "sky" },
  { value: "hard", label: "Khó", variant: "coral" },
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
  const [nodeId, setNodeId] = useState(initialValue?.nodeId ?? "");
  const [explanation, setExplanation] = useState(
    initialValue?.explanation ?? "",
  );

  const { data: taxonomyNodes } = useTaxonomyNodes();
  useEffect(() => {
    if (!nodeId && taxonomyNodes?.length) setNodeId(taxonomyNodes[0].id);
  }, [nodeId, taxonomyNodes]);

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
            nodeId,
            options,
            explanation: explanation.trim() || null,
          }
        : {
            text,
            type,
            answer: shortAnswer,
            difficulty,
            nodeId,
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
            Loại câu hỏi
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
                {value === "mcq" ? "Trắc nghiệm" : "Tự luận ngắn"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Nội dung câu hỏi
          </label>
          <Textarea
            rows={3}
            placeholder="Nhập nội dung câu hỏi..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {type === "mcq" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {options.map((option) => {
              const isCorrect = correctKey === option.key;
              return (
                <div
                  key={option.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setCorrectKey(option.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCorrectKey(option.key);
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-bento-sm border-2 p-3 transition-colors",
                    isCorrect
                      ? "border-forest bg-forest/10"
                      : "border-hairline bg-white hover:border-forest/40",
                  )}
                >
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
                    Option {option.key}
                    {isCorrect && (
                      <span className="ml-auto text-forest normal-case tracking-normal">
                        Đáp án đúng
                      </span>
                    )}
                  </span>
                  <Input
                    placeholder="Nhập nội dung phương án..."
                    value={option.text}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateOption(option.key, e.target.value)}
                    className={cn(isCorrect && "border-forest/40 bg-white")}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
              Đáp án đúng
            </label>
            <Input
              placeholder="Nhập đáp án mong đợi..."
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
              Độ khó
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
              Chủ đề / Node kiến thức
            </label>
            <NodeSearchSelect nodes={taxonomyNodes} value={nodeId} onChange={setNodeId} />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
            Giải thích{" "}
            <span className="normal-case text-ink-faint/70">(tùy chọn)</span>
          </label>
          <Textarea
            rows={2}
            placeholder="Giải thích vì sao đáp án này đúng..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-hairline/70 pt-5">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
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
            {isEditMode ? "Lưu thay đổi" : "Tạo câu hỏi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
