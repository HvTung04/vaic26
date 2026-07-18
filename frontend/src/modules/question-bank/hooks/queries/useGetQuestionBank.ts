import { useQuery } from '@tanstack/react-query';
import { fetchQuestionBank } from '../../services/questionBankApi';

export const QUESTION_BANK_QUERY_KEY = ['question-bank'];

export function useGetQuestionBank() {
  return useQuery({ queryKey: QUESTION_BANK_QUERY_KEY, queryFn: fetchQuestionBank });
}
