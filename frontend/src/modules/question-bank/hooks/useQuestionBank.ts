import { useEffect, useMemo, useState } from 'react';
import { useGetQuestionBank } from './queries/useGetQuestionBank';
import type {
  QuestionBankDifficulty,
  QuestionBankSortField,
  QuestionBankType,
  SortDirection,
} from '../types';

const PAGE_SIZE = 8;

const EMPTY_ITEMS: never[] = [];

const DIFFICULTY_RANK: Record<QuestionBankDifficulty, number> = { easy: 0, medium: 1, hard: 2 };

export function useQuestionBank() {
  const query = useGetQuestionBank();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionBankType | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionBankDifficulty | 'all'>('all');
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<QuestionBankSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  function toggleSort(field: QuestionBankSortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const items = query.data ?? EMPTY_ITEMS;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((q) => {
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
      if (nodeFilter !== 'all' && q.node_id !== nodeFilter) return false;
      if (term && !q.text.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, search, typeFilter, difficultyFilter, nodeFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'text') cmp = a.text.localeCompare(b.text);
      else if (sortField === 'type') cmp = a.type.localeCompare(b.type);
      else if (sortField === 'difficulty') cmp = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortField, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, difficultyFilter, nodeFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageRangeStart = pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const pageRangeEnd = Math.min(page * PAGE_SIZE, sorted.length);

  return {
    isLoading: query.isLoading,
    pageItems,
    totalCount: items.length,
    filteredCount: sorted.length,
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
    nodeFilter,
    setNodeFilter,
    sortField,
    sortDirection,
    toggleSort,
  };
}
