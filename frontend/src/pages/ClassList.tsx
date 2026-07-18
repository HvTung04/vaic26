import { Users2 } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useGetClassTelemetry } from '@/modules/dashboard/hooks/queries/useGetClassTelemetry';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function ClassList() {
  const { data, isLoading } = useGetClassTelemetry();
  const navigate = useNavigate();

  return (
    <div>
      <DashboardHeader title="Danh sách lớp" subtitle="Toán - Khối 8" />
      <Card>
        <CardContent className="divide-y divide-hairline/70 pt-6">
          {isLoading && <p className="py-4 text-sm text-ink-faint">Đang tải...</p>}
          {data?.roster.map((student) => (
            <button
              key={student.id}
              onClick={() => navigate(`/students/${student.id}`)}
              className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-ink/[0.02]"
            >
              <Avatar className="h-9 w-9 border border-hairline">
                <AvatarFallback className="bg-lavender-soft text-ink">
                  {student.name.split(' ').slice(-2).map((p) => p[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{student.name}</p>
                <p className="text-xs text-ink-faint">{student.grade}</p>
              </div>
              <span className="text-sm font-semibold text-ink-soft">{student.overallAccuracy}%</span>
              {student.flagged && <Badge variant="urgent">Cần hỗ trợ</Badge>}
            </button>
          ))}
        </CardContent>
      </Card>
      {!isLoading && !data?.roster.length && (
        <p className="flex items-center gap-2 text-sm text-ink-faint">
          <Users2 className="h-4 w-4" /> Không có học sinh nào.
        </p>
      )}
    </div>
  );
}
