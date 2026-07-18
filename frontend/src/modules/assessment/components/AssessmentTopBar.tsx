import { Clock3, Pause, Play } from "lucide-react";
import { formatCountdown } from "@/utils/format";

export interface AssessmentTopBarProps {
  sessionCode: string;
  remainingSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
}

export function AssessmentTopBar({
  sessionCode,
  remainingSeconds,
  isPaused,
  onTogglePause,
}: AssessmentTopBarProps) {
  return (
    <header className="mb-8 flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        <p className="font-serif text-2xl font-bold text-ember">G.A.R.Y</p>
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          Session: #{sessionCode}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 rounded-full bg-lavender-soft px-4 py-2 text-sm font-bold tabular-nums text-ember">
          <Clock3 className="h-4 w-4" />
          {formatCountdown(remainingSeconds)}
        </span>
        <button
          type="button"
          onClick={onTogglePause}
          aria-label={isPaused ? "Tiếp tục" : "Tạm dừng"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-white text-ink-soft transition-colors hover:bg-cream-100"
        >
          {isPaused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
