import { useNavigate } from 'react-router-dom';
import { ClipboardList, Pencil, Users2 } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClassTests } from '@/modules/tests/hooks/useClassTests';
import { TestStatusBadge } from '@/modules/tests/components/TestStatusBadge';
import { useAuth } from '@/modules/auth/AuthContext';
import type { TestKind } from '@/modules/tests/types';

const TYPE_LABEL: Record<TestKind, string> = {
  weekly: 'Kiểm tra định kỳ',
  revision: 'Ôn tập',
  practice: 'Luyện tập',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TestList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const classId = user?.classIds[0] ?? '';
  const { data: tests, isLoading } = useClassTests(classId);

  return (
    <div>
      <DashboardHeader title="Danh sách bài test" subtitle="Toán - Khối 8" />

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && tests?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-faint">Chưa có bài test nào cho lớp này.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {tests?.map((test) => (
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
    </div>
  );
}
