import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubmissionDetail } from '@/modules/tests/hooks/useSubmissionDetail';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} phút ${s}s` : `${s}s`;
}

export default function SubmissionDetail() {
  const { submissionId = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useSubmissionDetail(submissionId);

  return (
    <div>
      <DashboardHeader
        title={isLoading ? 'Đang tải...' : `Bài làm của ${data?.studentName}`}
        subtitle={data?.testTitle}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (data ? navigate(`/dashboard/tests/${data.testId}/results`) : navigate('/dashboard/tests'))}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại kết quả lớp
          </Button>
        }
      />

      {isLoading && <Skeleton className="h-96 w-full" />}

      {!isLoading && data && (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">Điểm số</p>
              <p className="font-display text-2xl font-semibold text-ink">
                {data.score}/{data.total}
              </p>
            </div>
            <div className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">Tỉ lệ đúng</p>
              <p className="font-display text-2xl font-semibold text-ink">
                {Math.round((data.score / data.total) * 100)}%
              </p>
            </div>
            <div className="rounded-bento border border-hairline/60 bg-white px-4 py-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">Nộp bài lúc</p>
              <p className="font-display text-lg font-semibold text-ink">
                {new Date(data.submittedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {data.results.map((result, index) => (
              <Card key={result.questionId}>
                <CardContent className="flex flex-col gap-2 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      Câu {index + 1}. {result.questionText}
                    </p>
                    {result.isCorrect ? (
                      <Badge variant="lime" className="shrink-0 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Đúng
                      </Badge>
                    ) : (
                      <Badge variant="coral" className="shrink-0 gap-1">
                        <XCircle className="h-3 w-3" /> Sai
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-soft">
                    <span>
                      Trả lời: <span className="font-semibold text-ink">{result.studentAnswer}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Thời gian làm: <span className="font-semibold text-ink">{formatDuration(result.timeSpentSeconds)}</span>
                    </span>
                    {!result.isCorrect && (
                      <span>
                        Đáp án đúng: <span className="font-semibold text-ink">{result.correctAnswer}</span>
                      </span>
                    )}
                    {result.rootCauseNodeName && (
                      <span>
                        Lỗ hổng kiến thức: <span className="font-semibold text-ink">{result.rootCauseNodeName}</span>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
