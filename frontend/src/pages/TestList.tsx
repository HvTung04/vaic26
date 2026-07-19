import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ClipboardList, Pencil, Search, Users2 } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassTestsPaginated } from '@/modules/tests/hooks/useClassTests';
import { TestStatusBadge } from '@/modules/tests/components/TestStatusBadge';
import { useSelectedClass } from '@/modules/classes/SelectedClassContext';
import { cn } from '@/utils/cn';
import type { TestKind } from '@/modules/tests/types';

const TYPE_LABEL: Record<TestKind, string> = {
  weekly: 'Kiểm tra định kỳ',
  revision: 'Ôn tập',
  practice: 'Luyện tập',
};

const TYPE_FILTERS: { value: TestKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'weekly', label: 'Định kỳ' },
  { value: 'revision', label: 'Ôn tập' },
  { value: 'practice', label: 'Luyện tập' },
];

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TestList() {
  const navigate = useNavigate();
  const { classId, selectedClass } = useSelectedClass();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TestKind | 'all'>('all');

  const { data, isLoading } = useClassTestsPaginated({
    classId,
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
  });

  const tests = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <DashboardHeader
        title="Danh sách bài test"
        subtitle={selectedClass ? `${selectedClass.subject} · Khối ${selectedClass.grade} · ${selectedClass.name}` : undefined}
      />

      {/* Search + Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Tìm kiếm bài test..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setTypeFilter(f.value);
                setPage(1);
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                typeFilter === f.value
                  ? 'bg-ink text-cream'
                  : 'bg-cream-100 text-ink-soft hover:bg-ink/10',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && tests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-faint">
              {search || typeFilter !== 'all'
                ? 'Không tìm thấy bài test phù hợp.'
                : 'Chưa có bài test nào cho lớp này.'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {tests.map((test) => (
          <Card key={test.id}>
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-serif text-base font-semibold text-ink">{test.title}</h3>
                  <TestStatusBadge status={test.status} />
                  <Badge variant="neutral">{TYPE_LABEL[test.type]}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
                  <span>Tạo ngày {formatDate(test.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <Users2 className="h-3.5 w-3.5" />
                    {test.submittedCount}/{test.assignedCount} học sinh đã nộp bài
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/tests/${test.id}/results`)}>
                  Xem chi tiết
                </Button>
                {test.status === 'not_started' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/tests/${test.id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between pt-4 text-sm text-ink-soft">
          <p>
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} trong số {total} bài test
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold text-ink-faint">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
