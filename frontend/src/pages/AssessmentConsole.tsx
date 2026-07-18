import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout';
import { Button } from '@/components/ui/button';
import { useAttemptExecution } from '@/modules/testTaking/hooks/useAttemptExecution';
import { useSubmitAttempt } from '@/modules/testTaking/hooks/useSubmitAttempt';
import { useSubmissionResult } from '@/modules/testTaking/hooks/useSubmissionResult';
import { useExamTimer } from '@/modules/assessment/hooks/useExamTimer';
import { AssessmentTopBar } from '@/modules/assessment/components/AssessmentTopBar';
import { QuestionNavigator } from '@/modules/testTaking/components/QuestionNavigator';
import { QuestionConsole } from '@/modules/testTaking/components/QuestionConsole';
import { ScoreReport } from '@/modules/testTaking/components/ScoreReport';

const DEFAULT_DURATION_MINUTES = 20;

export default function AssessmentConsole() {
  const { assessmentId: testId = '' } = useParams();
  const navigate = useNavigate();
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const {
    attempt,
    isLoading,
    questions,
    currentQuestion,
    currentIndex,
    answers,
    setAnswer,
    goToIndex,
    goNext,
    goPrev,
    buildAnswers,
  } = useAttemptExecution(testId);

  const timer = useExamTimer(DEFAULT_DURATION_MINUTES * 60, !submissionId);
  const submitMutation = useSubmitAttempt(testId);
  const resultQuery = useSubmissionResult(submissionId ?? '');

  const handleSubmit = useCallback(() => {
    if (!attempt || submitMutation.isPending) return;
    submitMutation.mutate(buildAnswers(), {
      onSuccess: (result) => setSubmissionId(result.submissionId),
    });
  }, [attempt, submitMutation, buildAnswers]);

  const handleContinue = useCallback(() => navigate('/student'), [navigate]);

  useEffect(() => {
    if (timer.isExpired && attempt && !submissionId && !submitMutation.isPending) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isExpired]);

  if (isLoading || !currentQuestion || !attempt) {
    return (
      <ImmersiveLayout>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-ink-faint">Đang tải bài kiểm tra...</p>
        </div>
      </ImmersiveLayout>
    );
  }

  if (submissionId) {
    return (
      <ImmersiveLayout>
        {resultQuery.data ? (
          <ScoreReport report={resultQuery.data} onContinue={handleContinue} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-ink-faint">Đang nộp bài...</p>
          </div>
        )}
      </ImmersiveLayout>
    );
  }

  return (
    <ImmersiveLayout>
      <AssessmentTopBar
        sessionCode={testId}
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
            index={currentIndex}
            totalQuestions={questions.length}
            answer={answers[currentQuestion.id] ?? ''}
            onAnswer={setAnswer}
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
