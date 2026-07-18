import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { HeatmapStudentRow, HeatmapTopic } from '../types';

const TOPIC_MAP: Record<string, string> = {};

function ensureTopicMap(topics?: HeatmapTopic[]) {
  if (!topics || Object.keys(TOPIC_MAP).length > 0) return;
  for (const t of topics) TOPIC_MAP[t.key] = t.label;
}

interface LeaderboardStudent {
  rank: number;
  name: string;
  id: string;
  avgMastery: number;
  trend: 'up' | 'down' | 'stable';
  weakTopics: { label: string; mastery: number }[];
}

function buildLeaderboard(heatmap: HeatmapStudentRow[] | undefined): LeaderboardStudent[] {
  if (!heatmap) return [];
  const sorted = [...heatmap].sort((a, b) => b.avgMastery - a.avgMastery);
  return sorted.map((s, i) => {
    const weakTopics = Object.entries(s.cells)
      .filter((entry): entry is [string, number] => entry[1] !== null && entry[1] < 0.5)
      .map(([key, mastery]) => ({ label: TOPIC_MAP[key] ?? key, mastery }))
      .sort((a, b) => a.mastery - b.mastery);
    return {
      rank: i + 1,
      name: s.name,
      id: s.id,
      avgMastery: s.avgMastery,
      trend: s.avgMastery > 0.65 ? 'up' : s.avgMastery < 0.45 ? 'down' : 'stable',
      weakTopics,
    };
  });
}

export interface ClassLeaderboardProps {
  heatmap?: HeatmapStudentRow[];
  topics?: HeatmapTopic[];
  isLoading?: boolean;
  onSelectStudent?: (id: string) => void;
  onHoverStudent?: (id: string | null) => void;
  highlightStudentIds?: string[] | null;
}

export function ClassLeaderboard({ heatmap, topics, isLoading, onSelectStudent, onHoverStudent, highlightStudentIds }: ClassLeaderboardProps) {
  ensureTopicMap(topics);
  const leaderboard = buildLeaderboard(heatmap);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-amber-500" />
          Bảng xếp hạng lớp
        </CardTitle>
        {!isLoading && leaderboard.length > 0 && (
          <span className="text-xs text-ink-faint">{leaderboard.length} học sinh</span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-faint">Chưa có dữ liệu xếp hạng.</p>
        ) : (
          <div className="flex max-h-[360px] flex-col gap-1 overflow-y-auto pr-1 scrollbar-thin">
            {leaderboard.map((s) => {
              const isHighlighted = highlightStudentIds != null && highlightStudentIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  className={cn(
                    'relative group rounded-bento-sm transition-all duration-200',
                    isHighlighted && 'bg-lavender-soft/60 ring-1 ring-lavender/40',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectStudent?.(s.id)}
                    onMouseEnter={() => onHoverStudent?.(s.id)}
                    onMouseLeave={() => onHoverStudent?.(null)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-cream-100"
                  >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-200 text-[10px] font-bold text-ink-faint">
                    {s.rank}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-ink">{s.name}</span>
                  <span className="text-sm font-bold text-ink tabular-nums">{Math.round(s.avgMastery * 100)}%</span>
                  {s.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-forest" />}
                  {s.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-primary" />}
                  {s.trend === 'stable' && <Minus className="h-3.5 w-3.5 text-ink-faint" />}
                </button>

                {/* Hover tooltip */}
                {s.weakTopics.length > 0 && (
                  <div className="pointer-events-none absolute left-1/2 top-full z-50 mb-2 w-56 -translate-x-1/2 rounded-bento border border-hairline/60 bg-white p-2.5 shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-faint">Chủ đề cần lưu ý</p>
                    <div className="flex flex-col gap-1">
                      {s.weakTopics.map((t) => (
                        <div key={t.label} className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium text-ink">{t.label}</span>
                          <span className="shrink-0 text-[10px] font-bold text-primary">{Math.round(t.mastery * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
