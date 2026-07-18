import { useEffect, useRef, useState } from "react";
import { Plus, Sparkles, FileUp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionEditorForm } from "./QuestionEditorForm";
import type { Question } from "../types";

export interface QuestionAccordionListProps {
  questions: Question[];
  onChange: (question: Question) => void;
  onSave: (question: Question) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
}

export function QuestionAccordionList({
  questions,
  onChange,
  onSave,
  onAdd,
  onDuplicate,
  onDelete,
  isSaving,
}: QuestionAccordionListProps) {
  const seenIds = useRef<Set<string>>(new Set(questions.map((q) => q.id)));
  const [openIds, setOpenIds] = useState<string[]>(() => questions.map((q) => q.id));

  // Newly added/imported/duplicated questions default to open; manual collapses are preserved.
  useEffect(() => {
    const currentIds = new Set(questions.map((q) => q.id));
    const newIds = [...currentIds].filter((id) => !seenIds.current.has(id));
    newIds.forEach((id) => seenIds.current.add(id));
    setOpenIds((prev) => {
      const kept = prev.filter((id) => currentIds.has(id));
      return newIds.length ? [...kept, ...newIds] : kept;
    });
  }, [questions]);

  return (
    <div className="flex flex-col gap-3">
      <Accordion
        type="multiple"
        value={openIds}
        onValueChange={setOpenIds}
        className="flex flex-col gap-3"
      >
        {questions.map((question) => (
          <AccordionItem key={question.id} value={question.id}>
            <AccordionTrigger>
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-100 text-xs font-bold text-ink-soft">
                  {question.order}
                </span>
                <span className="truncate text-sm font-medium text-ink">
                  {question.prompt || "Chưa có nội dung"}
                </span>
                {question.source === "ai" && (
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#6B3FCB]" />
                )}
                {question.source === "import" && (
                  <FileUp className="h-3.5 w-3.5 shrink-0 text-forest-soft" />
                )}
              </div>
              <Badge variant="neutral" className="ml-auto shrink-0">
                {question.topicTag}
              </Badge>
            </AccordionTrigger>
            <AccordionContent>
              <QuestionEditorForm
                question={question}
                totalQuestions={questions.length}
                onChange={onChange}
                onSave={() => onSave(question)}
                onDelete={() => onDelete(question.id)}
                onDuplicate={() => onDuplicate(question.id)}
                canDelete={questions.length > 1}
                isSaving={isSaving}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="self-start"
      >
        <Plus className="h-4 w-4" /> Thêm câu hỏi
      </Button>
    </div>
  );
}
