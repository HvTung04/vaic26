import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAssessmentDraft,
  generateAiQuestions,
  publishAssessment,
  saveQuestionDraft,
} from '../services/assessmentApi';
import type { AssessmentDraft, Question } from '../types';

const DRAFT_QUERY_KEY = ['assessment', 'draft', 'biology-midterm-unit-4'];

export function useAssessmentDraft() {
  const queryClient = useQueryClient();
  const [activeQuestionId, setActiveQuestionId] = useState<string>('q-4');

  const draftQuery = useQuery({
    queryKey: DRAFT_QUERY_KEY,
    queryFn: fetchAssessmentDraft,
  });

  const saveQuestionMutation = useMutation({
    mutationFn: saveQuestionDraft,
    onSuccess: (savedQuestion) => {
      queryClient.setQueryData<AssessmentDraft>(DRAFT_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        const exists = prev.questions.some((q) => q.id === savedQuestion.id);
        const questions = exists
          ? prev.questions.map((q) => (q.id === savedQuestion.id ? savedQuestion : q))
          : [...prev.questions, savedQuestion];
        return { ...prev, questions };
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({ sourceText, subject }: { sourceText: string; subject: string }) =>
      generateAiQuestions(sourceText, subject),
    onSuccess: (generatedQuestions: Question[]) => {
      queryClient.setQueryData<AssessmentDraft>(DRAFT_QUERY_KEY, (prev) =>
        prev ? { ...prev, questions: [...prev.questions, ...generatedQuestions] } : prev,
      );
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishAssessment(draftQuery.data?.id ?? ''),
    onSuccess: () => {
      queryClient.setQueryData<AssessmentDraft>(DRAFT_QUERY_KEY, (prev) =>
        prev ? { ...prev, status: 'published' } : prev,
      );
    },
  });

  const draft = draftQuery.data;
  const activeQuestion = draft?.questions.find((q) => q.id === activeQuestionId) ?? draft?.questions[0];
  const completion = draft ? Math.round((draft.questions.length / 20) * 100) : 0;

  return {
    draft,
    isLoading: draftQuery.isLoading,
    activeQuestion,
    setActiveQuestionId,
    completion,
    saveQuestionMutation,
    generateMutation,
    publishMutation,
  };
}
