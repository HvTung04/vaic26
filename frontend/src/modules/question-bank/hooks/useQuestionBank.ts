import { useEffect, useState } from 'react';
import { useGetQuestionBank } from './queries/useGetQuestionBank';
import type {
  QuestionBankDifficulty,
  QuestionBankSortField,
  QuestionBankType,
  SortDirection,
} from '../types';

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_ITEMS: never[] = [];

export function useQuestionBank() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionBankType | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionBankDifficulty | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<QuestionBankSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, difficultyFilter, topicFilter, sortField, sortDirection]);

  function toggleSort(field: QuestionBankSortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const query = useGetQuestionBank({
    search: debouncedSearch || undefined,
    type: typeFilter,
    difficulty: difficultyFilter,
    topic: topicFilter,
    sortField,
    sortDirection,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const pageItems = query.data?.items ?? EMPTY_ITEMS;
  const totalCount = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageRangeStart = pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const pageRangeEnd = Math.min(page * PAGE_SIZE, totalCount);

  return {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    pageItems,
    totalCount,
    filteredCount: totalCount,
    page,
    totalPages,
    pageRangeStart,
    pageRangeEnd,
    setPage,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    difficultyFilter,
    setDifficultyFilter,
    topicFilter,
    setTopicFilter,
    sortField,
    sortDirection,
    toggleSort,
  };
}
