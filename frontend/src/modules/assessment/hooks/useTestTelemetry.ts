import { useCallback, useEffect, useRef } from 'react';
import type { AnswerChangeEvent, QuestionOptionKey, QuestionTelemetry } from '../types';

/**
 * Internal per-question stopwatch. A question can be revisited via the
 * navigator, so time accumulates across visits rather than resetting.
 * Also records every select -> change-to-another-option event so wavered
 * answers can be surfaced in the submission payload.
 */
export function useTestTelemetry() {
  const telemetryRef = useRef<Map<string, QuestionTelemetry>>(new Map());
  const activeQuestionId = useRef<string | null>(null);
  const activeStartedAt = useRef(0);

  const flushActive = useCallback(() => {
    const questionId = activeQuestionId.current;
    if (!questionId) return;
    const elapsed = (performance.now() - activeStartedAt.current) / 1000;
    const existing = telemetryRef.current.get(questionId);
    telemetryRef.current.set(questionId, {
      questionId,
      timeSpentSeconds: (existing?.timeSpentSeconds ?? 0) + elapsed,
      selectedOption: existing?.selectedOption ?? null,
      visits: existing?.visits ?? 0,
      answerChanges: existing?.answerChanges ?? [],
    });
  }, []);

  const enterQuestion = useCallback(
    (questionId: string) => {
      flushActive();
      activeQuestionId.current = questionId;
      activeStartedAt.current = performance.now();
      const existing = telemetryRef.current.get(questionId);
      telemetryRef.current.set(questionId, {
        questionId,
        timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
        selectedOption: existing?.selectedOption ?? null,
        visits: (existing?.visits ?? 0) + 1,
        answerChanges: existing?.answerChanges ?? [],
      });
    },
    [flushActive],
  );

  const recordAnswer = useCallback((questionId: string, option: QuestionOptionKey) => {
    const existing = telemetryRef.current.get(questionId);
    const previous = existing?.selectedOption ?? null;
    const isActive = activeQuestionId.current === questionId;
    const elapsedIntoQuestion =
      (existing?.timeSpentSeconds ?? 0) + (isActive ? (performance.now() - activeStartedAt.current) / 1000 : 0);

    const priorChanges = existing?.answerChanges ?? [];
    const nextChanges: AnswerChangeEvent[] =
      previous !== null && previous !== option
        ? [...priorChanges, { from: previous, to: option, atSeconds: elapsedIntoQuestion }]
        : priorChanges;

    telemetryRef.current.set(questionId, {
      questionId,
      timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
      selectedOption: option,
      visits: existing?.visits ?? 1,
      answerChanges: nextChanges,
    });
  }, []);

  const snapshot = useCallback((): QuestionTelemetry[] => {
    flushActive();
    return Array.from(telemetryRef.current.values());
  }, [flushActive]);

  useEffect(() => () => flushActive(), [flushActive]);

  return { enterQuestion, recordAnswer, snapshot };
}
