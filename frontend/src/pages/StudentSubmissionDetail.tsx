import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubmissionResult } from '@/modules/testTaking/hooks/useSubmissionResult';
import { AnswerBreakdown } from '@/modules/testTaking/components/AnswerBreakdown';

export default function StudentSubmissionDetail() {
  const { submissionId = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useSubmissionResult(submissionId);

  const percent = data && data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;

  return (
    <div>
      <DashboardHeader
        title={isLoading ? 'Đang tải...' : data?.testTitle ?? 'Không tìm thấy bài làm'}
        subtitle="Chi tiết bài làm — đúng/sai từng câu"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/results')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại lịch sử
          </Button>
        }
      />

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && data && data.status === 'grading' && (
        <p className="text-sm text-ink-faint">Bài làm đang được chấm, vui lòng quay lại sau.</p>
      )}

      {!isLoading && data && data.status === 'graded' && (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">Điểm số</p>
              <p className="font-display text-2xl font-semibold text-ink">{percent}%</p>
            </div>
            <div className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                <CheckCircle2 className="h-3 w-3" /> Câu đúng
              </p>
              <p className="font-display text-2xl font-semibold text-ink">
                {data.score}/{data.total}
              </p>
            </div>
            <div className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                <ShieldCheck className="h-3 w-3" /> Node cập nhật
              </p>
              <p className="font-display text-2xl font-semibold text-ink">{data.graphUpdates.length}</p>
            </div>
          </div>

          <h2 className="mb-3 font-serif text-lg font-bold text-ink">Chi tiết từng câu</h2>
          <AnswerBreakdown results={data.results} />
        </>
      )}
    </div>
  );
}
