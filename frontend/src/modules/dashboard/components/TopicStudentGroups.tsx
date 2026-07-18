import { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { HeatmapStudentRow, HeatmapTopic } from '../types';

const TOPIC_MAP: Record<string, string> = {};
const TOPIC_ORDER: string[] = [];

function ensureTopicMap(topics?: HeatmapTopic[]) {
  if (!topics || Object.keys(TOPIC_MAP).length > 0) return;
  for (const t of topics) {
    TOPIC_MAP[t.key] = t.label;
    TOPIC_ORDER.push(t.key);
  }
}

interface TopicGroup {
  topicKey: string;
  topicLabel: string;
  students: { id: string; name: string; mastery: number }[];
  avgMastery: number;
}

function buildGroups(heatmap: HeatmapStudentRow[] | undefined): TopicGroup[] {
  if (!heatmap) return [];
  const map = new Map<string, { id: string; name: string; mastery: number }[]>();

  for (const s of heatmap) {
    for (const [key, val] of Object.entries(s.cells)) {
      if (val === null || val >= 0.5) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ id: s.id, name: s.name, mastery: val });
    }
  }

  return TOPIC_ORDER
    .filter((k) => map.has(k))
    .map((k) => {
      const students = map.get(k)!.sort((a, b) => a.mastery - b.mastery);
      const avg = students.reduce((a, b) => a + b.mastery, 0) / students.length;
      return { topicKey: k, topicLabel: TOPIC_MAP[k] ?? k, students, avgMastery: Math.round(avg * 100) / 100 };
    })
    .sort((a, b) => b.students.length - a.students.length);
}

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();
}

export interface TopicStudentGroupsProps {
  heatmap?: HeatmapStudentRow[];
  topics?: HeatmapTopic[];
  isLoading?: boolean;
  onSelectStudent?: (id: string) => void;
  highlightStudentId?: string | null;
  onHoverGroup?: (studentIds: string[] | null) => void;
}

export function TopicStudentGroups({ heatmap, topics, isLoading, onSelectStudent, highlightStudentId, onHoverGroup }: TopicStudentGroupsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  ensureTopicMap(topics);
  const groups = buildGroups(heatmap);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-maroon" />
          Phân nhóm theo chủ đề
        </CardTitle>
        {!isLoading && groups.length > 0 && (
          <span className="text-xs text-ink-faint">{groups.length} chủ đề</span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : groups.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-faint">Tất cả học sinh đều ổn.</p>
        ) : (
          <div className="flex max-h-[400px] flex-col gap-1 overflow-y-auto pr-1 scrollbar-thin">
            {groups.map((g) => {
              const isOpen = expanded === g.topicKey;
              const isHighlighted = highlightStudentId != null && g.students.some((s) => s.id === highlightStudentId);
              return (
                <div
                  key={g.topicKey}
                  onMouseEnter={() => onHoverGroup?.(g.students.map((s) => s.id))}
                  onMouseLeave={() => onHoverGroup?.(null)}
                  className={cn(
                    'rounded-bento-sm border overflow-hidden transition-all duration-200',
                    isHighlighted
                      ? 'border-maroon/40 bg-maroon/5 shadow-sm ring-1 ring-maroon/20'
                      : 'border-hairline/50 bg-cream/50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : g.topicKey)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-cream-100"
                  >
                    {/* Avatar stack */}
                    <div className="flex -space-x-1.5 shrink-0">
                      {g.students.slice(0, 4).map((s) => (
                        <span
                          key={s.id}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-lavender-soft text-[8px] font-bold text-ink"
                        >
                          {initials(s.name)}
                        </span>
                      ))}
                      {g.students.length > 4 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-cream-200 text-[8px] font-bold text-ink-faint">
                          +{g.students.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Topic info */}
                    <div className="flex flex-1 min-w-0 flex-col">
                      <span title={g.topicLabel} className="truncate text-sm font-semibold text-ink">{g.topicLabel}</span>
                      <span className="text-[10px] text-ink-faint">{g.students.length} học sinh yếu · TB {g.avgMastery * 100}%</span>
                    </div>

                    <ChevronDown className={cn('h-4 w-4 text-ink-faint transition-transform shrink-0', isOpen && 'rotate-180')} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-hairline/50 bg-white px-3 py-2">
                      {g.students.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onSelectStudent?.(s.id)}
                          className="flex w-full items-center gap-2.5 rounded-bento-sm px-2 py-1.5 text-left transition-colors hover:bg-cream-100"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lavender-soft text-[8px] font-bold text-ink">
                            {initials(s.name)}
                          </span>
                          <span title={s.name} className="flex-1 truncate text-xs font-medium text-ink">{s.name}</span>
                          <span className="text-[10px] font-bold text-primary">{Math.round(s.mastery * 100)}%</span>
                        </button>
                      ))}
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
