import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout';
import { Button } from '@/components/ui/button';
import { useTestExecution } from '@/modules/assessment/hooks/useTestExecution';
import { useMutateSubmitAttempt } from '@/modules/assessment/hooks/queries/useMutateSubmitAttempt';
import { useExamTimer } from '@/modules/assessment/hooks/useExamTimer';
import { AssessmentTopBar } from '@/modules/assessment/components/AssessmentTopBar';
import { QuestionNavigator } from '@/modules/assessment/components/QuestionNavigator';
import { QuestionConsole } from '@/modules/assessment/components/QuestionConsole';
import { ScoreReport } from '@/modules/assessment/components/ScoreReport';
import type { ScoreReportData } from '@/modules/assessment/types';

export default function AssessmentConsole() {
  const { assessmentId = '' } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ScoreReportData | null>(null);

  const {
    assessment,
    isLoading,
    questions,
    currentQuestion,
    currentIndex,
    answers,
    selectOption,
    goToIndex,
    goNext,
    goPrev,
    buildSubmission,
  } = useTestExecution(assessmentId);

  const timer = useExamTimer((assessment?.durationMinutes ?? 0) * 60, !report);
  const submitMutation = useMutateSubmitAttempt();

  const handleSubmit = () => {
    if (!assessment) return;
    const submission = buildSubmission();
    submitMutation.mutate(
      { assessment, submission },
      { onSuccess: (result) => setReport(result) },
    );
  };

  const handleContinue = useCallback(() => navigate('/student'), [navigate]);

  useEffect(() => {
    if (timer.isExpired && assessment && !report && !submitMutation.isPending) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isExpired]);

  if (isLoading || !currentQuestion || !assessment) {
    return (
      <ImmersiveLayout>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-ink-faint">Đang tải bài kiểm tra...</p>
        </div>
      </ImmersiveLayout>
    );
  }

  if (report) {
    return (
      <ImmersiveLayout>
        <ScoreReport report={report} onContinue={handleContinue} />
      </ImmersiveLayout>
    );
  }

  return (
    <ImmersiveLayout>
      <AssessmentTopBar
        sessionCode={assessment.sessionCode}
        remainingSeconds={timer.remainingSeconds}
        isPaused={timer.isPaused}
        onTogglePause={timer.togglePause}
      />
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[64px_1fr] lg:gap-8">
        <QuestionNavigator
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          onSelect={goToIndex}
        />
        <div className="relative">
          <QuestionConsole
            question={currentQuestion}
            totalQuestions={questions.length}
            selected={answers[currentQuestion.id] ?? null}
            onSelect={selectOption}
            onPrev={goPrev}
            onNext={goNext}
            onSubmit={handleSubmit}
            isFirst={currentIndex === 0}
            isLast={currentIndex === questions.length - 1}
            isSubmitting={submitMutation.isPending}
          />
          {timer.isPaused && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-bento-lg bg-cream/90 backdrop-blur-sm">
              <p className="font-serif text-xl font-semibold text-ink">Đã tạm dừng</p>
              <Button variant="ember" onClick={timer.togglePause}>
                Tiếp tục làm bài
              </Button>
            </div>
          )}
        </div>
      </div>
    </ImmersiveLayout>
  );
}
