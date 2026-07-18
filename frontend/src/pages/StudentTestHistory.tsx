import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, History } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudentResults } from '@/modules/testTaking/hooks/useStudentResults';

export default function StudentTestHistory() {
  const navigate = useNavigate();
  const { data: results, isLoading } = useStudentResults();

  return (
    <div>
      <DashboardHeader
        title="Lịch sử bài kiểm tra"
        subtitle="Toàn bộ các bài kiểm tra đã nộp và đã được chấm"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/student')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
          </Button>
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!isLoading && results?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <History className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-faint">Chưa có bài kiểm tra nào được chấm.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {results?.map((item) => {
          const percent = item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;
          return (
            <Link key={item.submissionId} to={`/student/results/${item.submissionId}`}>
              <Card className="transition-colors hover:border-ink/20">
                <CardContent className="flex items-center justify-between gap-4 py-5">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[11px] text-ink-faint">
                      {new Date(item.submittedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                    <h3 className="truncate font-serif text-base font-semibold text-ink">{item.title}</h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-display text-xl font-semibold text-ink">{percent}%</span>
                    <ChevronRight className="h-4 w-4 text-ink-faint" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
