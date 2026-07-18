import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssessmentDraft } from '@/modules/assessment/hooks/useAssessmentDraft';
import { QuestionEditorForm } from '@/modules/assessment/components/QuestionEditorForm';
import { QuestionListPreview } from '@/modules/assessment/components/QuestionListPreview';
import { AIQuestionForge } from '@/modules/assessment/components/AIQuestionForge';
import { AssessmentContextPanel } from '@/modules/assessment/components/AssessmentContextPanel';
import type { Question } from '@/modules/assessment/types';

export default function QuestionBank() {
  const {
    draft,
    isLoading,
    activeQuestion,
    setActiveQuestionId,
    completion,
    saveQuestionMutation,
    generateMutation,
    publishMutation,
  } = useAssessmentDraft();

  const [editedQuestion, setEditedQuestion] = useState<Question | undefined>(activeQuestion);

  useEffect(() => {
    setEditedQuestion(activeQuestion);
  }, [activeQuestion?.id]);

  if (isLoading || !draft || !editedQuestion) {
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
        title="Create New Assessment"
        subtitle={`Drafting: ${draft.title}`}
        actions={
          <>
            <Button variant="outline" onClick={() => saveQuestionMutation.mutate(editedQuestion)}>
              Save Draft
            </Button>
            <Button variant="primary" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              {publishMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {publishMutation.isSuccess ? 'Published' : 'Publish Test'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <QuestionEditorForm
            question={editedQuestion}
            totalQuestions={20}
            onChange={setEditedQuestion}
            onSave={() => saveQuestionMutation.mutate(editedQuestion)}
            isSaving={saveQuestionMutation.isPending}
          />
          <QuestionListPreview
            questions={draft.questions}
            activeQuestionId={editedQuestion.id}
            onSelect={setActiveQuestionId}
          />
        </div>

        <div className="flex flex-col gap-4">
          <AIQuestionForge
            onGenerate={(sourceText) => generateMutation.mutate({ sourceText, subject: draft.context.subject })}
            isGenerating={generateMutation.isPending}
            lastGeneratedCount={generateMutation.data?.length}
          />
          <AssessmentContextPanel context={draft.context} completion={completion} />
        </div>
      </div>
    </div>
  );
}
