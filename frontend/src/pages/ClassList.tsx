import { useMemo, useState } from 'react';
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
import { useClassStudents } from '@/modules/classes/hooks/useClassStudents';

const PAGE_SIZE = 15;

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('');
}

/** "Quản lý học sinh" — student roster of the class selected in the sidebar. */
export default function ClassList() {
  const navigate = useNavigate();
  const { classId, selectedClass, isLoading: isClassLoading } = useSelectedClass();
  const { data, isLoading: isStudentsLoading } = useClassStudents(classId);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const allStudents = data?.items ?? [];
  const total = data?.total ?? 0;

  const filteredStudents = useMemo(() => {
    if (!search) return allStudents;
    const q = search.toLowerCase();
    return allStudents.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.username.toLowerCase().includes(q),
    );
  }, [allStudents, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isLoading = isClassLoading || isStudentsLoading;

  return (
    <div>
      <DashboardHeader
        title="Quản lý học sinh"
        subtitle={
          selectedClass
            ? `${selectedClass.name} · ${selectedClass.studentCount} học sinh`
            : 'Chọn một lớp ở thanh bên để xem danh sách'
        }
      />

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && !classId && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users2 className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-faint">Bạn chưa phụ trách lớp nào.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && classId && (
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              placeholder="Tìm theo tên hoặc username..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-hairline/70 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      <th className="pb-3 pr-4 font-semibold">STT</th>
                      <th className="pb-3 pr-4 font-semibold">Học sinh</th>
                      <th className="pb-3 pr-4 font-semibold">Tên đăng nhập</th>
                      <th className="pb-3 pr-4 font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/70">
                    {pagedStudents.map((student, idx) => (
                      <tr key={student.id}>
                        <td className="py-3 pr-4 tabular-nums text-ink-faint">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-hairline">
                              <AvatarFallback className="bg-lavender-soft text-xs text-ink">
                                {initials(student.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-ink">{student.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="neutral">@{student.username}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/students/${student.id}`)}
                          >
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pagedStudents.length === 0 && (
                  <p className="py-8 text-center text-sm text-ink-faint">
                    {search ? 'Không tìm thấy học sinh phù hợp.' : 'Lớp chưa có học sinh nào.'}
                  </p>
                )}
              </div>

              {/* Pagination */}
              {filteredStudents.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4 text-sm text-ink-soft">
                  <p>
                    Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredStudents.length)} / {filteredStudents.length} học sinh
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
