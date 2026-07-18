import { useQueryClient } from '@tanstack/react-query';
import { useGetAssessmentDraft, ASSESSMENT_DRAFT_QUERY_KEY } from './queries/useGetAssessmentDraft';
import { useMutateSaveQuestion } from './queries/useMutateSaveQuestion';
import { useMutateGenerateQuestions } from './queries/useMutateGenerateQuestions';
import { useMutateImportQuestions } from './queries/useMutateImportQuestions';
import { useMutatePublishAssessment } from './queries/useMutatePublishAssessment';
import { renumberQuestions } from '../utils';
import type { AssessmentDraft, Question } from '../types';

function blankQuestion(order: number): Question {
  return {
    id: `q-new-${Date.now()}`,
    order,
    prompt: '',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' },
    ],
    correctOption: 'A',
    topicTag: 'Untitled',
    difficulty: 'Easy',
    points: 10,
    source: 'manual',
  };
}

export function useAssessmentDraft() {
  const queryClient = useQueryClient();

  const draftQuery = useGetAssessmentDraft();
  const saveQuestionMutation = useMutateSaveQuestion();
  const generateMutation = useMutateGenerateQuestions();
  const importMutation = useMutateImportQuestions();
  const publishMutation = useMutatePublishAssessment();

  function setQuestions(updater: (questions: Question[]) => Question[]) {
    queryClient.setQueryData<AssessmentDraft>(ASSESSMENT_DRAFT_QUERY_KEY, (prev) =>
      prev ? { ...prev, questions: updater(prev.questions) } : prev,
    );
  }

  function updateQuestion(updated: Question) {
    setQuestions((questions) => questions.map((q) => (q.id === updated.id ? updated : q)));
  }

  function addQuestion() {
    const questions = draftQuery.data?.questions ?? [];
    const created = blankQuestion(questions.length + 1);
    setQuestions((prev) => [...prev, created]);
  }

  function duplicateQuestion(id: string) {
    const questions = draftQuery.data?.questions ?? [];
    const source = questions.find((q) => q.id === id);
    if (!source) return;
    const clone: Question = { ...source, id: `q-copy-${Date.now()}`, source: 'manual' };
    const index = questions.findIndex((q) => q.id === id);
    setQuestions((prev) => renumberQuestions([...prev.slice(0, index + 1), clone, ...prev.slice(index + 1)]));
  }

  function deleteQuestion(id: string) {
    const questions = draftQuery.data?.questions ?? [];
    if (questions.length <= 1) return;
    setQuestions((prev) => renumberQuestions(prev.filter((q) => q.id !== id)));
  }

  const draft = draftQuery.data;
  const completion = draft ? Math.round((draft.questions.length / 20) * 100) : 0;

  return {
    draft,
    isLoading: draftQuery.isLoading,
    completion,
    updateQuestion,
    addQuestion,
    duplicateQuestion,
    deleteQuestion,
    saveQuestionMutation,
    generateMutation,
    importMutation,
    publishMutation,
  };
}
