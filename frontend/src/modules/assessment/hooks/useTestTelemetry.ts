import { useRef, useCallback } from 'react';
import type { QuestionOptionKey, QuestionTelemetry, AnswerChangeEvent } from '../types';

interface TelemetryEntry {
  questionId: string;
  selectedOption: QuestionOptionKey | null;
  enterTime: number;
  totalTime: number;
  visits: number;
  answerChanges: AnswerChangeEvent[];
  lastOption: QuestionOptionKey | null;
}

export function useTestTelemetry() {
  const entriesRef = useRef<Map<string, TelemetryEntry>>(new Map());

  const enterQuestion = useCallback((questionId: string) => {
    const map = entriesRef.current;
    let entry = map.get(questionId);
    if (!entry) {
      entry = {
        questionId,
        selectedOption: null,
        enterTime: performance.now(),
        totalTime: 0,
        visits: 0,
        answerChanges: [],
        lastOption: null,
      };
      map.set(questionId, entry);
    }
    entry.enterTime = performance.now();
    entry.visits += 1;
  }, []);

  const recordAnswer = useCallback((questionId: string, option: QuestionOptionKey) => {
    const entry = entriesRef.current.get(questionId);
    if (!entry) return;
    if (entry.lastOption !== null) {
      entry.answerChanges.push({
        from: entry.lastOption,
        to: option,
        atSeconds: (performance.now() - entry.enterTime) / 1000,
      });
    }
    entry.selectedOption = option;
    entry.lastOption = option;
  }, []);

  const snapshot = useCallback((): QuestionTelemetry[] => {
    const now = performance.now();
    const result: QuestionTelemetry[] = [];
    entriesRef.current.forEach((entry) => {
      const elapsed = entry.totalTime + (now - entry.enterTime) / 1000;
      result.push({
        questionId: entry.questionId,
        timeSpentSeconds: Math.round(elapsed * 10) / 10,
        selectedOption: entry.selectedOption,
        visits: entry.visits,
        answerChanges: entry.answerChanges,
      });
    });
    return result;
  }, []);

  return { enterQuestion, recordAnswer, snapshot };
}
