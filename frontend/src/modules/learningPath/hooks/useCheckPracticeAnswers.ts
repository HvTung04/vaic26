import { useMutation } from '@tanstack/react-query';
import { checkPracticeAnswers } from '../services/practiceApi';

export function useCheckPracticeAnswers() {
  return useMutation({
    mutationFn: (answers: { questionId: string; answer: string }[]) => checkPracticeAnswers(answers),
  });
}
