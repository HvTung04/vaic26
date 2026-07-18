import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishAssessment } from '../../services/assessmentApi';
import { ASSESSMENT_DRAFT_QUERY_KEY } from './useGetAssessmentDraft';
import type { AssessmentDraft } from '../../types';

export function useMutatePublishAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => publishAssessment(draftId),
    onSuccess: () => {
      queryClient.setQueryData<AssessmentDraft>(ASSESSMENT_DRAFT_QUERY_KEY, (prev) =>
        prev ? { ...prev, status: 'published' } : prev,
      );
    },
  });
}
