import { useNavigate } from 'react-router-dom';
import { Users2 } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useSelectedClass } from '@/modules/classes/SelectedClassContext';
import { useClassStudents } from '@/modules/classes/hooks/useClassStudents';

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('');
}

/** "Quản lý học sinh" — roster of the class currently selected in the sidebar. */
export default function ClassList() {
  const navigate = useNavigate();
  const { classId, selectedClass, isLoading: isClassLoading } = useSelectedClass();
  const { data: students, isLoading: isStudentsLoading } = useClassStudents(classId);

  const isLoading = isClassLoading || isStudentsLoading;

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
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-hairline/70 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    <th className="pb-3 pr-4 font-semibold">Học sinh</th>
                    <th className="pb-3 pr-4 font-semibold">Tên đăng nhập</th>
                    <th className="pb-3 pr-4 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/70">
                  {students?.items.map((student) => (
                    <tr key={student.id}>
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
              {students?.items.length === 0 && (
                <p className="py-8 text-center text-sm text-ink-faint">Lớp chưa có học sinh nào.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
