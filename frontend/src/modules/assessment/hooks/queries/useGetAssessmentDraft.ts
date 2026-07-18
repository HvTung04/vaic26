import { useQuery } from '@tanstack/react-query';
import { fetchAssessmentDraft } from '../../services/assessmentApi';

export const ASSESSMENT_DRAFT_QUERY_KEY = ['assessment', 'draft', 'biology-midterm-unit-4'];

export function useGetAssessmentDraft() {
  return useQuery({
    queryKey: ASSESSMENT_DRAFT_QUERY_KEY,
    queryFn: fetchAssessmentDraft,
  });
}
