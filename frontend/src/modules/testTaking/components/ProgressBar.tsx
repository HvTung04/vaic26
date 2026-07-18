export interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="mb-6">
      <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-ink-faint">
        <span>Tiến độ làm bài</span>
        <span className="tabular-nums text-ember">{clamped}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 w-full overflow-hidden rounded-full bg-cream-100"
      >
        <div
          className="h-full rounded-full bg-ember transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
