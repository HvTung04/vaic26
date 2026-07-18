import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTestResults } from '@/modules/tests/hooks/useTestResults';

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('');
}

export default function TestResults() {
  const { testId = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useTestResults(testId);

  return (
    <div>
      <DashboardHeader
        title={isLoading ? 'Đang tải...' : data?.testTitle ?? 'Không tìm thấy bài test'}
        subtitle="Kết quả bài test theo học sinh"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/tests')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách
          </Button>
        }
      />

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">Điểm TB lớp</p>
              <p className="font-display text-2xl font-semibold text-ink">{data.classAvgScore}%</p>
            </div>
            <div className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">Đã nộp bài</p>
              <p className="font-display text-2xl font-semibold text-ink">
                {data.students.filter((s) => s.status === 'submitted').length}/{data.students.length}
              </p>
            </div>
            {data.distribution.map((bucket) => (
              <div key={bucket.scoreRange} className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">{bucket.scoreRange}%</p>
                <p className="font-display text-2xl font-semibold text-ink">{bucket.count}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-hairline/70 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      <th className="pb-3 pr-4 font-semibold">Học sinh</th>
                      <th className="pb-3 pr-4 font-semibold">Trạng thái</th>
                      <th className="pb-3 pr-4 font-semibold">Điểm</th>
                      <th className="pb-3 pr-4 font-semibold text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/70">
                    {data.students.map((student) => (
                      <tr key={student.studentId}>
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
                          <Badge variant={student.status === 'submitted' ? 'lime' : 'neutral'}>
                            {student.status === 'submitted' ? 'Đã làm' : 'Chưa làm'}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 font-semibold text-ink">
                          {student.score !== null ? `${student.score}%` : '—'}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!student.submissionId}
                            onClick={() => student.submissionId && navigate(`/dashboard/submissions/${student.submissionId}`)}
                          >
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
