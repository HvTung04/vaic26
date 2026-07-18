import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { HeatmapTopic, HeatmapStudentRow } from '../types';

type Band = 'mastered' | 'developing' | 'gap' | 'untested';

function bandOf(m: number | null): Band {
  if (m === null) return 'untested';
  if (m >= 0.6) return 'mastered';
  if (m >= 0.4) return 'developing';
  return 'gap';
}

const CELL: Record<Band, { cls: string; sym: string }> = {
  mastered: { cls: 'bg-forest text-white', sym: '✓' },
  developing: { cls: 'bg-lime-soft text-ink', sym: '~' },
  gap: { cls: 'bg-coral text-white', sym: '!' },
  untested: { cls: 'bg-cream-100 text-ink-faint', sym: '·' },
};

export interface StudentWeakHeatmapProps {
  topics?: HeatmapTopic[];
  rows?: HeatmapStudentRow[];
  isLoading?: boolean;
  onSelectStudent?: (id: string) => void;
}

export function StudentWeakHeatmap({ topics, rows, isLoading, onSelectStudent }: StudentWeakHeatmapProps) {
  // Only show weakest students (avgMastery < 0.6), sorted weakest first, max 8
  const weakRows = (rows ?? [])
    .filter((r) => r.avgMastery < 0.6)
    .slice(0, 8);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Học sinh yếu theo chủ đề</CardTitle>
          <p className="mt-0.5 text-[11px] text-ink-faint">Top {weakRows.length} HS cần hỗ trợ · click để xem chi tiết</p>
        </div>
        <div className="hidden sm:flex items-center gap-2.5 text-[10px] text-ink-soft">
          {Object.entries(CELL).map(([key, v]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded text-[8px] font-bold', v.cls)}>{v.sym}</span>
              {key === 'mastered' ? 'Vững' : key === 'developing' ? 'Đang tiến' : key === 'gap' ? 'Yếu' : 'Chưa'}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !weakRows.length || !topics?.length ? (
          <p className="py-8 text-center text-sm text-ink-faint">Không có học sinh yếu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0.5">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white pb-1 pr-2 text-left text-[10px] font-semibold uppercase tracking-wide text-ink-faint w-28">
                    Học sinh
                  </th>
                  {topics.map((t) => (
                    <th key={t.key} className="px-0.5 pb-1 text-center">
                      <span
                        className={cn(
                          'block text-[9px] font-semibold leading-tight text-ink-soft',
                          t.isCurrentLesson && 'text-primary font-bold',
                        )}
                        title={`${t.label} (L${t.grade})`}
                      >
                        {t.label.length > 10 ? t.label.slice(0, 10) + '…' : t.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weakRows.map((r) => (
                  <tr key={r.id} className="group">
                    <td className="sticky left-0 z-10 bg-white py-0.5 pr-2">
                      <button
                        type="button"
                        onClick={() => onSelectStudent?.(r.id)}
                        className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left transition hover:bg-cream-100"
                      >
                        <span className="truncate text-[11px] font-medium text-ink group-hover:text-primary">{r.name}</span>
                        <span className="text-[9px] text-ink-faint">{Math.round(r.avgMastery * 100)}%</span>
                      </button>
                    </td>
                    {topics.map((t) => {
                      const m = r.cells[t.key] ?? null;
                      const b = bandOf(m);
                      return (
                        <td key={t.key} className="p-0 text-center">
                          <div
                            title={m === null ? 'chưa test' : `${Math.round(m * 100)}%`}
                            className={cn(
                              'mx-auto flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold',
                              CELL[b].cls,
                              t.isCurrentLesson && 'ring-1 ring-inset ring-primary/30',
                            )}
                          >
                            {m === null ? '·' : `${Math.round(m * 100)}`}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
