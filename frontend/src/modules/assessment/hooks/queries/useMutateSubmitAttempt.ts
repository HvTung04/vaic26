import { useMutation } from '@tanstack/react-query';
import { submitTestAttempt } from '../../services/assessmentApi';
import type { Assessment, TestAttemptSubmission } from '../../types';

export function useMutateSubmitAttempt() {
  return useMutation({
    mutationFn: ({
      assessment,
      submission,
    }: {
      assessment: Assessment;
      submission: TestAttemptSubmission;
    }) => submitTestAttempt(assessment, submission),
  });
}
