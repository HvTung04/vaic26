import { Loader2 } from "lucide-react";
import { DashboardHeader } from "@/layouts/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssessmentDraft } from "@/modules/assessment/hooks/useAssessmentDraft";
import { QuestionAccordionList } from "@/modules/assessment/components/QuestionAccordionList";
import { QuestionFileImportCard } from "@/modules/assessment/components/QuestionFileImportCard";
import { AIQuestionForge } from "@/modules/assessment/components/AIQuestionForge";
import { AssessmentContextPanel } from "@/modules/assessment/components/AssessmentContextPanel";

export default function TestBuilder() {
  const {
    draft,
    isLoading,
    completion,
    updateQuestion,
    addQuestion,
    duplicateQuestion,
    deleteQuestion,
    saveQuestionMutation,
    generateMutation,
    importMutation,
    publishMutation,
  } = useAssessmentDraft();

  if (isLoading || !draft) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[520px] lg:col-span-2" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardHeader
        title="Tạo bài kiểm tra mới"
        subtitle={`Soạn: ${draft.title} · ${draft.questions.length} câu hỏi`}
        actions={
          <Button
            variant="primary"
            onClick={() => publishMutation.mutate(draft.id)}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {publishMutation.isSuccess ? "Đã xuất bản" : "Xuất bản bài kiểm tra"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuestionAccordionList
            questions={draft.questions}
            onChange={updateQuestion}
            onSave={(question) => saveQuestionMutation.mutate(question)}
            onAdd={addQuestion}
            onDuplicate={duplicateQuestion}
            onDelete={deleteQuestion}
            isSaving={saveQuestionMutation.isPending}
          />
        </div>

        <div className="flex flex-col gap-4">
          <QuestionFileImportCard
            onUpload={(file) => importMutation.mutate(file)}
            isUploading={importMutation.isPending}
            lastImportedCount={importMutation.data?.questions.length}
            lastFileName={importMutation.data?.fileName}
          />
          <AIQuestionForge
            onGenerate={(sourceText) =>
              generateMutation.mutate({
                sourceText,
                subject: draft.context.subject,
              })
            }
            isGenerating={generateMutation.isPending}
            lastGeneratedCount={generateMutation.data?.length}
          />
          <AssessmentContextPanel
            context={draft.context}
            completion={completion}
          />
        </div>
      </div>
    </div>
  );
}
