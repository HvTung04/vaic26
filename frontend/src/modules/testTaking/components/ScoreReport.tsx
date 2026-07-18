import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnswerBreakdown } from './AnswerBreakdown';
import type { SubmissionResult } from '../types';

function ScoreMeter({ percent }: { percent: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg width="192" height="192" className="-rotate-90">
        <circle cx="96" cy="96" r={radius} stroke="#eae6db" strokeWidth="14" fill="none" />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#C1440E"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-serif text-4xl font-bold text-ink">{percent}%</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Điểm số</span>
      </div>
    </div>
  );
}

function scoreTier(percent: number) {
  if (percent >= 90) return { heading: 'Xuất sắc! 🎉', subtitle: 'Bạn đã nắm rất vững nội dung bài này.' };
  if (percent >= 75) return { heading: 'Làm tốt lắm! 👏', subtitle: 'Nắm chắc phần lớn kiến thức, chỉ còn vài lỗ hổng nhỏ.' };
  if (percent >= 50) return { heading: 'Cố gắng hơn nhé! 💪', subtitle: 'Bạn đang tiến bộ, hãy ôn lại các câu sai bên dưới.' };
  return { heading: 'Cần ôn tập thêm 🌱', subtitle: 'Xem lại từng câu bên dưới để hiểu rõ lỗ hổng kiến thức.' };
}

export interface ScoreReportProps {
  report: SubmissionResult;
  onContinue: () => void;
  redirectSeconds?: number;
}

export function ScoreReport({ report, onContinue, redirectSeconds = 10 }: ScoreReportProps) {
  const [countdown, setCountdown] = useState(redirectSeconds);

  useEffect(() => {
    if (report.status !== 'graded') return;
    if (countdown <= 0) {
      onContinue();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onContinue, report.status]);

  if (report.status === 'grading') {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-ember" />
        <p className="font-serif text-xl font-semibold text-ink">Đang chấm bài...</p>
        <p className="text-sm text-ink-soft">Hệ thống đang phân tích lỗ hổng kiến thức từ bài làm của bạn.</p>
      </div>
    );
  }

  const percent = report.total > 0 ? Math.round((report.score / report.total) * 100) : 0;
  const tier = scoreTier(percent);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-6">
      <div className="overflow-hidden rounded-bento-lg border border-hairline bg-white shadow-bento">
        <div className="flex flex-col items-center gap-3 bg-cream-100 px-8 py-10 text-center">
          <h1 className="font-serif text-2xl font-bold text-ember">{tier.heading}</h1>
          <p className="max-w-md text-sm text-ink-soft">{tier.subtitle}</p>
          <ScoreMeter percent={percent} />
        </div>
        <div className="grid grid-cols-2 divide-x divide-hairline border-t border-hairline">
          <div className="flex flex-col items-center gap-1.5 px-4 py-6">
            <CheckCircle2 className="h-5 w-5 text-ember" />
            <p className="font-serif text-lg font-bold text-ink">
              {report.score}/{report.total}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Câu đúng</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-4 py-6">
            <ShieldCheck className="h-5 w-5 text-[#5A7300]" />
            <p className="font-serif text-lg font-bold text-ink">{report.graphUpdates.length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Node kiến thức cập nhật</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-bold text-ink">Chi tiết từng câu</h2>
        <AnswerBreakdown results={report.results} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button variant="primary" size="lg" onClick={onContinue}>
          Về trang chủ
        </Button>
        <p className="text-xs text-ink-faint">Tự động chuyển hướng sau {countdown}s...</p>
      </div>
    </div>
  );
}
