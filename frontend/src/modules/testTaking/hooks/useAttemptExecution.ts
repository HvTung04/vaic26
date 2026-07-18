import { useCallback, useEffect, useRef, useState } from 'react';
import { useAttempt } from './useAttempt';
import { clampNumber } from '@/utils/format';
import type { SubmitAnswerItem } from '../types';

export function useAttemptExecution(testId: string) {
  const attemptQuery = useAttempt(testId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const timeSpentRef = useRef<Record<string, number>>({});
  const questionEnteredAtRef = useRef(performance.now());

  const questions = attemptQuery.data?.questions ?? [];
  const currentQuestion = questions[currentIndex];

  const flushCurrentQuestionTime = useCallback(() => {
    if (!currentQuestion) return;
    const elapsed = (performance.now() - questionEnteredAtRef.current) / 1000;
    timeSpentRef.current[currentQuestion.id] = (timeSpentRef.current[currentQuestion.id] ?? 0) + elapsed;
    questionEnteredAtRef.current = performance.now();
  }, [currentQuestion]);

  useEffect(() => {
    questionEnteredAtRef.current = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  const setAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    },
    [currentQuestion],
  );

  const isLast = currentIndex >= Math.max(questions.length - 1, 0);
  const isCurrentAnswered = Boolean(answers[currentQuestion?.id ?? '']?.trim());

  // Sequential-only: a question must be answered before advancing, and there is no going back.
  const goNext = useCallback(() => {
    if (!isCurrentAnswered || isLast) return;
    flushCurrentQuestionTime();
    setCurrentIndex((prev) => clampNumber(prev + 1, 0, Math.max(questions.length - 1, 0)));
  }, [flushCurrentQuestionTime, isCurrentAnswered, isLast, questions.length]);

  const buildAnswers = useCallback((): SubmitAnswerItem[] => {
    flushCurrentQuestionTime();
    return questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? '',
      timeSpentSeconds: Math.round(timeSpentRef.current[q.id] ?? 0),
    }));
  }, [questions, answers, flushCurrentQuestionTime]);

  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const canSubmit = isLast && isCurrentAnswered;

  return {
    attempt: attemptQuery.data,
    isLoading: attemptQuery.isLoading,
    isError: attemptQuery.isError,
    questions,
    currentQuestion,
    currentIndex,
    answers,
    setAnswer,
    goNext,
    buildAnswers,
    answeredCount,
    progressPercent,
    isCurrentAnswered,
    isLast,
    canSubmit,
  };
}
