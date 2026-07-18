import { useEffect, useState } from "react";
import { Clock, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimeSpent } from "@/utils/format";
import { QuestionBreakdown } from "./QuestionBreakdown";
import type { ScoreReportData } from "../types";

function ScoreMeter({ percent }: { percent: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg width="192" height="192" className="-rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#eae6db"
          strokeWidth="14"
          fill="none"
        />
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
        <span className="font-serif text-4xl font-bold text-ink">
          {percent}%
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Final Score
        </span>
      </div>
    </div>
  );
}

function scoreTier(accuracy: number) {
  if (accuracy >= 90) {
    return {
      heading: "Exceptional Work! 🎉",
      subtitle:
        "You've mastered the fundamentals. Your conceptual understanding is far above average.",
    };
  }
  if (accuracy >= 75) {
    return {
      heading: "Great Job! 👏",
      subtitle:
        "Solid grasp of the material, with just a few gaps left to close.",
    };
  }
  if (accuracy >= 50) {
    return {
      heading: "Good Effort! 💪",
      subtitle:
        "You're making progress — a bit more practice will get you there.",
    };
  }
  return {
    heading: "Keep Practicing! 🌱",
    subtitle:
      "Review the questions below to strengthen the concepts you missed.",
  };
}

export interface ScoreReportProps {
  report: ScoreReportData;
  onContinue: () => void;
  redirectSeconds?: number;
}

export function ScoreReport({
  report,
  onContinue,
  redirectSeconds = 8,
}: ScoreReportProps) {
  const [countdown, setCountdown] = useState(redirectSeconds);

  useEffect(() => {
    if (countdown <= 0) {
      onContinue();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onContinue]);

  const tier = scoreTier(report.accuracy);

  console.log({ report, tier, redirectSeconds, countdown });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-6">
      <div className="overflow-hidden rounded-bento-lg border border-hairline bg-white shadow-bento">
        <div className="flex flex-col items-center gap-3 bg-cream-100 px-8 py-10 text-center">
          <h1 className="font-serif text-2xl font-bold text-ember">
            {tier.heading}
          </h1>
          <p className="max-w-md text-sm text-ink-soft">{tier.subtitle}</p>
          <ScoreMeter percent={report.finalScorePercent} />
        </div>
        <div className="grid grid-cols-3 divide-x divide-hairline border-t border-hairline">
          <div className="flex flex-col items-center gap-1.5 px-4 py-6">
            <ShieldCheck className="h-5 w-5 text-ember" />
            <p className="font-serif text-lg font-bold text-ink">
              {report.accuracy}%
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Accuracy
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-4 py-6">
            <Clock className="h-5 w-5 text-[#5A7300]" />
            <p className="font-serif text-lg font-bold text-ink">
              {formatTimeSpent(report.durationSeconds)}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Duration
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-4 py-6">
            <Trophy className="h-5 w-5 text-[#6B3FCB]" />
            <p className="font-serif text-lg font-bold text-ink">
              #{report.classRank}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Global Standing
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-bold text-ink">
          Question Breakdown
        </h2>
        <QuestionBreakdown results={report.questionResults} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button variant="primary" size="lg" onClick={onContinue}>
          Back to Dashboard
        </Button>
        <p className="text-xs text-ink-faint">
          Tự động chuyển hướng sau {countdown}s...
        </p>
      </div>
    </div>
  );
}
