import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parseQuestionFile } from '../../services/assessmentApi';
import { renumberQuestions } from '../../utils';
import { ASSESSMENT_DRAFT_QUERY_KEY } from './useGetAssessmentDraft';
import type { AssessmentDraft } from '../../types';

export function useMutateImportQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => parseQuestionFile(file),
    onSuccess: ({ questions: imported }) => {
      queryClient.setQueryData<AssessmentDraft>(ASSESSMENT_DRAFT_QUERY_KEY, (prev) =>
        prev ? { ...prev, questions: renumberQuestions([...prev.questions, ...imported]) } : prev,
      );
    },
  });
}
