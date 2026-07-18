import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAssessment } from '../services/assessmentApi';
import { useTestTelemetry } from './useTestTelemetry';
import { clampNumber } from '@/utils/format';
import type { QuestionOptionKey, TestAttemptSubmission, WaveredAnswer } from '../types';

export function useTestExecution(assessmentId: string) {
  const assessmentQuery = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => fetchAssessment(assessmentId),
    enabled: Boolean(assessmentId),
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionOptionKey | null>>({});
  const telemetry = useTestTelemetry();
  const startedAtRef = useRef(performance.now());

  const questions = assessmentQuery.data?.questions ?? [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (currentQuestion) telemetry.enterQuestion(currentQuestion.id);
    // telemetry callbacks are stable across renders; only re-run on question change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  const selectOption = useCallback(
    (option: QuestionOptionKey) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
      telemetry.recordAnswer(currentQuestion.id, option);
    },
    [currentQuestion, telemetry],
  );

  const goToIndex = useCallback(
    (index: number) => setCurrentIndex(clampNumber(index, 0, Math.max(questions.length - 1, 0))),
    [questions.length],
  );

  const goNext = useCallback(() => setCurrentIndex((i) => clampNumber(i + 1, 0, Math.max(questions.length - 1, 0))), [questions.length]);
  const goPrev = useCallback(() => setCurrentIndex((i) => clampNumber(i - 1, 0, Math.max(questions.length - 1, 0))), [questions.length]);

  const buildSubmission = useCallback((): TestAttemptSubmission => {
    const totalDurationSeconds = (performance.now() - startedAtRef.current) / 1000;
    const telemetrySnapshot = telemetry.snapshot();
    const waveredAnswers: WaveredAnswer[] = telemetrySnapshot
      .filter((t) => t.answerChanges.length > 0)
      .map((t) => ({
        questionId: t.questionId,
        questionOrder: questions.find((q) => q.id === t.questionId)?.order ?? 0,
        changes: t.answerChanges,
      }));
    return {
      assessmentId,
      answers,
      telemetry: telemetrySnapshot,
      totalDurationSeconds,
      waveredAnswers,
    };
  }, [assessmentId, answers, telemetry, questions]);

  return {
    assessment: assessmentQuery.data,
    isLoading: assessmentQuery.isLoading,
    isError: assessmentQuery.isError,
    questions,
    currentQuestion,
    currentIndex,
    answers,
    selectOption,
    goToIndex,
    goNext,
    goPrev,
    buildSubmission,
    answeredCount: Object.values(answers).filter(Boolean).length,
  };
}
