import { AlertTriangle, AlertCircle, Layers, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { HeatmapStudentRow, PriorityAlerts } from '../types';

interface DiagnosticStats {
  dangerStudents: { count: number; names: string[] };
  prereqGaps: number;
  polarization: { topAvg: number; bottomAvg: number; gap: number };
  growthRate: number;
}

function buildDiagnosticStats(heatmap: HeatmapStudentRow[] | undefined, alerts: PriorityAlerts | undefined): DiagnosticStats {
  if (!heatmap || heatmap.length === 0) {
    return {
      dangerStudents: { count: 0, names: [] },
      prereqGaps: 0,
      polarization: { topAvg: 0, bottomAvg: 0, gap: 0 },
      growthRate: 0,
    };
  }

  const allAlerts = [...(alerts?.ability ?? []), ...(alerts?.engagement ?? [])];
  const dangerNames = allAlerts.filter((a) => a.severity === 'critical').map((a) => a.name);
  const prereqGaps = heatmap.filter((s) => s.foundationGap).length;

  const sorted = [...heatmap].sort((a, b) => b.avgMastery - a.avgMastery);
  const chunk = Math.max(1, Math.floor(sorted.length * 0.2));
  const topAvg = sorted.slice(0, chunk).reduce((a, s) => a + s.avgMastery, 0) / chunk;
  const bottomAvg = sorted.slice(-chunk).reduce((a, s) => a + s.avgMastery, 0) / chunk;

  const lowAbility = heatmap.filter((s) => s.avgMastery < 0.4);
  const highAbility = heatmap.filter((s) => s.avgMastery >= 0.7);
  const lowAvg = lowAbility.length ? lowAbility.reduce((a, s) => a + s.avgMastery, 0) / lowAbility.length : 0;
  const highAvg = highAbility.length ? highAbility.reduce((a, s) => a + s.avgMastery, 0) / highAbility.length : 0;
  const growth = Math.round(((highAvg - lowAvg) / Math.max(lowAvg, 0.01)) * 100);

  return {
    dangerStudents: { count: dangerNames.length, names: dangerNames },
    prereqGaps,
    polarization: { topAvg: Math.round(topAvg * 100), bottomAvg: Math.round(bottomAvg * 100), gap: Math.round((topAvg - bottomAvg) * 100) },
    growthRate: growth,
  };
}

export interface ClassDiagnosticStatsProps {
  heatmap?: HeatmapStudentRow[];
  alerts?: PriorityAlerts;
  isLoading?: boolean;
}

export function ClassDiagnosticStats({ heatmap, alerts, isLoading }: ClassDiagnosticStatsProps) {
  const stats = buildDiagnosticStats(heatmap, alerts);

  return (
    <>
      <StatTile
        icon={AlertTriangle}
        label="Vùng nguy hiểm"
        value={stats.dangerStudents.count}
        detail={stats.dangerStudents.names.slice(0, 2).join(', ') || 'An toàn'}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        borderAccent="border-primary/30"
        isLoading={isLoading}
      />

      <StatTile
        icon={AlertCircle}
        label="Lỗ hổng nền"
        value={stats.prereqGaps}
        detail={stats.prereqGaps > 0 ? `${stats.prereqGaps} bạn thiếu nền` : 'Không có'}
        iconBg="bg-[#6d1f1a]/10"
        iconColor="text-ember"
        borderAccent="border-ember/30"
        isLoading={isLoading}
      />

      <StatTile
        icon={Layers}
        label="Phân cực"
        value={`${stats.polarization.gap}%`}
        detail={`Giỏi ${stats.polarization.topAvg}% · Yếu ${stats.polarization.bottomAvg}%`}
        iconBg="bg-lavender-soft"
        iconColor="text-lavender"
        borderAccent="border-lavender/30"
        isLoading={isLoading}
      />

      <StatTile
        icon={TrendingUp}
        label="Tăng trưởng"
        value={stats.growthRate > 0 ? `+${stats.growthRate}%` : `${stats.growthRate}%`}
        detail={stats.growthRate > 20 ? 'Phân hóa mạnh' : 'Ổn định'}
        iconBg="bg-lime-soft"
        iconColor="text-forest"
        borderAccent="border-forest/30"
        isLoading={isLoading}
      />
    </>
  );
}

function StatTile({ icon: Icon, label, value, detail, iconBg, iconColor, borderAccent, isLoading }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail: string;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
  isLoading: boolean;
}) {
  return (
    <div className={cn(
      'group flex flex-col rounded-bento border bg-white p-4 transition-shadow hover:shadow-md',
      borderAccent,
    )}>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <>
          <div className={cn('mb-4 flex h-9 w-9 items-center justify-center rounded-bento-sm', iconBg)}>
            <Icon className={cn('h-4.5 w-4.5', iconColor)} />
          </div>

          <div className="mt-auto flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{label}</span>
            <span className="font-display text-3xl font-bold leading-none text-ink">{value}</span>
            <span className="mt-1 text-[11px] text-ink-faint leading-snug">{detail}</span>
          </div>
        </>
      )}
    </div>
  );
}
