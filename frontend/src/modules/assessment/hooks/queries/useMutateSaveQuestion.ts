import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveQuestionDraft } from '../../services/assessmentApi';
import { ASSESSMENT_DRAFT_QUERY_KEY } from './useGetAssessmentDraft';
import type { AssessmentDraft } from '../../types';

export function useMutateSaveQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveQuestionDraft,
    onSuccess: (savedQuestion) => {
      queryClient.setQueryData<AssessmentDraft>(ASSESSMENT_DRAFT_QUERY_KEY, (prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) => (q.id === savedQuestion.id ? savedQuestion : q)),
            }
          : prev,
      );
    },
  });
}
