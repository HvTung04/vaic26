import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Users2 } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useSelectedClass } from '@/modules/classes/SelectedClassContext';
import { useClassesPaginated } from '@/modules/classes/hooks/useClasses';
import { cn } from '@/utils/cn';

const GRADE_FILTERS = [
  { value: 0, label: 'Tất cả khối' },
  { value: 6, label: 'Khối 6' },
  { value: 7, label: 'Khối 7' },
  { value: 8, label: 'Khối 8' },
];

const PAGE_SIZE = 10;

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('');
}

/** "Quản lý học sinh" — paginated roster with search and grade filter. */
export default function ClassList() {
  const navigate = useNavigate();
  const { selectedClass, isLoading: isClassLoading } = useSelectedClass();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState(0);

  const { data, isLoading } = useClassesPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    grade: gradeFilter || undefined,
  });

  const classes = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const isLoadingState = isClassLoading || isLoading;

  return (
    <div>
      <DashboardHeader
        title="Quản lý học sinh"
        subtitle={
          selectedClass
            ? `${selectedClass.subject} · Khối ${selectedClass.grade} · ${selectedClass.studentCount} học sinh`
            : 'Chọn một lớp ở thanh bên để xem danh sách học sinh'
        }
      />

      <div className="flex flex-col gap-4">
        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              placeholder="Tìm kiếm lớp..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {GRADE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setGradeFilter(f.value);
                  setPage(1);
                }}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  gradeFilter === f.value
                    ? 'bg-ink text-cream'
                    : 'bg-cream-100 text-ink-soft hover:bg-ink/10',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoadingState && <Skeleton className="h-96 w-full" />}

        {!isLoadingState && classes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Users2 className="h-8 w-8 text-ink-faint" />
              <p className="text-sm text-ink-faint">
                {search || gradeFilter
                  ? 'Không tìm thấy lớp phù hợp.'
                  : 'Bạn chưa phụ trách lớp nào.'}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoadingState && classes.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-hairline/70 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      <th className="pb-3 pr-4 font-semibold">Tên lớp</th>
                      <th className="pb-3 pr-4 font-semibold">Khối</th>
                      <th className="pb-3 pr-4 font-semibold">Môn</th>
                      <th className="pb-3 pr-4 font-semibold">Sĩ số</th>
                      <th className="pb-3 pr-4 font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/70">
                    {classes.map((cls) => (
                      <tr key={cls.id}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-hairline">
                              <AvatarFallback className="bg-lavender-soft text-xs text-ink">
                                {cls.name.slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-ink">{cls.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="neutral">{cls.grade}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="lavender">{cls.subject}</Badge>
                        </td>
                        <td className="py-3 pr-4 tabular-nums">{cls.studentCount}</td>
                        <td className="py-3 pr-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/class-list?classId=${cls.id}`)}
                          >
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 text-sm text-ink-soft">
                <p>
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} trong số {total} lớp
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
