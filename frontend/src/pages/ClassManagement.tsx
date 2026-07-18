import { useNavigate } from 'react-router-dom';
import { School, Users2 } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/modules/classes/hooks/useClasses';

export default function ClassManagement() {
  const navigate = useNavigate();
  const { data: classes, isLoading } = useClasses();

  return (
    <div>
      <DashboardHeader title="Quản lý lớp học" subtitle="Danh sách các lớp bạn đang phụ trách" />

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!isLoading && classes?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <School className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-faint">Bạn chưa phụ trách lớp nào.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {classes?.map((klass) => (
          <Card key={klass.id}>
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-serif text-base font-semibold text-ink">{klass.name}</h3>
                  <Badge variant="neutral">Khối {klass.grade}</Badge>
                  <Badge variant="lavender">{klass.subject}</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-ink-faint">
                  <Users2 className="h-3.5 w-3.5" />
                  {klass.studentCount} học sinh
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/classes/${klass.id}`)}>
                Xem chi tiết
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
