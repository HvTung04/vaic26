import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassDetail } from '@/modules/classes/hooks/useClassDetail';
import { useClassStudents } from '@/modules/classes/hooks/useClassStudents';

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('');
}

export default function ClassDetail() {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const { data: klass, isLoading: isClassLoading } = useClassDetail(classId);
  const { data: students, isLoading: isStudentsLoading } = useClassStudents(classId);

  const isLoading = isClassLoading || isStudentsLoading;

  return (
    <div>
      <DashboardHeader
        title={isClassLoading ? 'Đang tải...' : klass?.name ?? 'Không tìm thấy lớp'}
        subtitle={klass ? `${klass.subject} · Khối ${klass.grade} · ${klass.studentCount} học sinh` : undefined}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/classes')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách lớp
          </Button>
        }
      />

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && (
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
