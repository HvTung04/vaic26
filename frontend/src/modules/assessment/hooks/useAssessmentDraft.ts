import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAssessmentDraft,
  generateAiQuestions,
  parseQuestionFile,
  publishAssessment,
  saveQuestionDraft,
} from '../services/assessmentApi';
import type { AssessmentDraft, Question } from '../types';

const DRAFT_QUERY_KEY = ['assessment', 'draft', 'biology-midterm-unit-4'];

function renumber(questions: Question[]): Question[] {
  return questions.map((q, i) => ({ ...q, order: i + 1 }));
}

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

  const draftQuery = useQuery({
    queryKey: DRAFT_QUERY_KEY,
    queryFn: fetchAssessmentDraft,
  });

  function setQuestions(updater: (questions: Question[]) => Question[]) {
    queryClient.setQueryData<AssessmentDraft>(DRAFT_QUERY_KEY, (prev) =>
      prev ? { ...prev, questions: updater(prev.questions) } : prev,
    );
  }

  const saveQuestionMutation = useMutation({
    mutationFn: saveQuestionDraft,
    onSuccess: (savedQuestion) => {
      setQuestions((questions) =>
        questions.map((q) => (q.id === savedQuestion.id ? savedQuestion : q)),
      );
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({ sourceText, subject }: { sourceText: string; subject: string }) =>
      generateAiQuestions(sourceText, subject),
    onSuccess: (generatedQuestions: Question[]) => {
      setQuestions((questions) => renumber([...questions, ...generatedQuestions]));
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => parseQuestionFile(file),
    onSuccess: ({ questions: imported }) => {
      setQuestions((questions) => renumber([...questions, ...imported]));
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
    setQuestions((prev) => renumber([...prev.slice(0, index + 1), clone, ...prev.slice(index + 1)]));
  }

  function deleteQuestion(id: string) {
    const questions = draftQuery.data?.questions ?? [];
    if (questions.length <= 1) return;
    setQuestions((prev) => renumber(prev.filter((q) => q.id !== id)));
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
