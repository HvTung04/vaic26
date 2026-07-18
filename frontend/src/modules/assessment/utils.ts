import type { Question } from './types';

export function renumberQuestions(questions: Question[]): Question[] {
  return questions.map((q, i) => ({ ...q, order: i + 1 }));
}
