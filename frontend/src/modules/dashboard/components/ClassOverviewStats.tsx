import { BarChart3, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { HeatmapStudentRow } from '../types';

interface Stat {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
}

function buildStats(heatmap: HeatmapStudentRow[] | undefined): Stat[] {
  if (!heatmap || heatmap.length === 0) {
    return [
      { label: "TB thành thạo", value: "—", sub: "lớp", icon: BarChart3, accent: "bg-lavender-soft text-ink" },
      { label: "Đã kiểm tra", value: "—", sub: "học sinh", icon: CheckCircle2, accent: "bg-lime-soft text-[#5A7300]" },
      { label: "Lỗ hổng nền", value: "—", sub: "học sinh", icon: AlertCircle, accent: "bg-coral-soft/60 text-ember" },
      { label: "Xu hướng", value: "—", sub: "tuần này", icon: TrendingUp, accent: "bg-[#6d1f1a]/10 text-[#6d1f1a]" },
    ];
  }

  const avgMastery = heatmap.reduce((a, s) => a + s.avgMastery, 0) / heatmap.length;

  const assessed = heatmap.filter((s) => Object.values(s.cells).some((v) => v !== null)).length;
  const notAssessed = heatmap.length - assessed;

  const foundationGaps = heatmap.filter((s) => s.foundationGap).length;

  // Mock trend: compare avg mastery of top half vs bottom half
  const sorted = [...heatmap].sort((a, b) => a.avgMastery - b.avgMastery);
  const mid = Math.floor(sorted.length / 2);
  const bottomAvg = sorted.slice(0, mid).reduce((a, s) => a + s.avgMastery, 0) / mid;
  const topAvg = sorted.slice(mid).reduce((a, s) => a + s.avgMastery, 0) / (sorted.length - mid);
  const trendPct = Math.round(((topAvg - bottomAvg) / bottomAvg) * 100);

  return [
    {
      label: "TB thành thạo",
      value: `${Math.round(avgMastery * 100)}%`,
      sub: "cả lớp",
      icon: BarChart3,
      accent: avgMastery >= 0.6 ? "bg-lime-soft text-[#5A7300]" : avgMastery >= 0.4 ? "bg-lavender-soft text-ink" : "bg-coral-soft/60 text-ember",
    },
    {
      label: "Đã kiểm tra",
      value: assessed,
      sub: notAssessed > 0 ? `còn ${notAssessed} chưa kiểm tra` : "tất cả đã kiểm tra",
      icon: CheckCircle2,
      accent: "bg-lime-soft text-[#5A7300]",
    },
    {
      label: "Lỗ hổng nền",
      value: foundationGaps,
      sub: foundationGaps > 0 ? "cần ôn kiến thức nền" : "không có",
      icon: AlertCircle,
      accent: foundationGaps > 0 ? "bg-coral-soft/60 text-ember" : "bg-lime-soft text-[#5A7300]",
    },
    {
      label: "Xu hướng",
      value: trendPct > 0 ? `+${trendPct}%` : `${trendPct}%`,
      sub: "chênh lệch nhóm giỏi/yếu",
      icon: TrendingUp,
      accent: trendPct >= 30 ? "bg-lime-soft text-[#5A7300]" : "bg-lavender-soft text-ink",
    },
  ];
}

export interface ClassOverviewStatsProps {
  heatmap?: HeatmapStudentRow[];
  isLoading?: boolean;
}

export function ClassOverviewStats({ heatmap, isLoading }: ClassOverviewStatsProps) {
  const stats = buildStats(heatmap);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="rounded-bento border border-hairline/60 bg-white px-4 py-3"
        >
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <>
              <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.accent}`}>
                <s.icon className="h-3 w-3" />
                {s.label}
              </div>
              <div className="font-display text-2xl font-semibold text-ink">{s.value}</div>
              <div className="mt-0.5 text-[11px] text-ink-faint">{s.sub}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
