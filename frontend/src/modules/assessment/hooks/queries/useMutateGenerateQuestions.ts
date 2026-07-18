import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateAiQuestions } from '../../services/assessmentApi';
import { renumberQuestions } from '../../utils';
import { ASSESSMENT_DRAFT_QUERY_KEY } from './useGetAssessmentDraft';
import type { AssessmentDraft } from '../../types';

export function useMutateGenerateQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceText, subject }: { sourceText: string; subject: string }) =>
      generateAiQuestions(sourceText, subject),
    onSuccess: (generatedQuestions) => {
      queryClient.setQueryData<AssessmentDraft>(ASSESSMENT_DRAFT_QUERY_KEY, (prev) =>
        prev ? { ...prev, questions: renumberQuestions([...prev.questions, ...generatedQuestions]) } : prev,
      );
    },
  });
}
