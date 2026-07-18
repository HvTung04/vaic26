import { useState } from 'react';
import { AlertTriangle, TrendingDown, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { PriorityAlerts as PriorityAlertsData, NeedGroup } from '../types';

function initials(name: string) {
  return name.split(' ').slice(-2).map((p) => p[0]).join('').toUpperCase();
}

interface MergedRow {
  studentId: string;
  name: string;
  severity: 'critical' | 'watch';
  reason: string;
  weakTopics: string[];
}

function buildMergedRows(alerts: PriorityAlertsData | undefined, groups: NeedGroup[] | undefined): MergedRow[] {
  if (!alerts) return [];
  // Build a map: studentId → weak topics from groups
  const topicMap = new Map<string, string[]>();
  for (const g of groups ?? []) {
    for (const s of g.students) {
      const existing = topicMap.get(s.id) ?? [];
      if (!existing.includes(g.topicLabel)) existing.push(g.topicLabel);
      topicMap.set(s.id, existing);
    }
  }
  // Merge ability + engagement alerts
  const all = [...alerts.ability, ...alerts.engagement];
  return all
    .map((a) => ({
      studentId: a.id,
      name: a.name,
      severity: a.severity,
      reason: a.reason,
      weakTopics: topicMap.get(a.id) ?? [],
    }))
    .sort((a, b) => (a.severity === 'critical' && b.severity !== 'critical' ? -1 : a.severity !== 'critical' && b.severity === 'critical' ? 1 : 0));
}

export interface StudentPriorityBoardProps {
  alerts?: PriorityAlertsData;
  groups?: NeedGroup[];
  isLoading?: boolean;
  onSelectStudent?: (id: string) => void;
  onCreateGroup?: (topicKey: string) => void;
}

export function StudentPriorityBoard({ alerts, groups, isLoading, onSelectStudent, onCreateGroup }: StudentPriorityBoardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = buildMergedRows(alerts, groups);
  const urgentCount = alerts?.urgentCount ?? 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-primary" />
          Học sinh cần hỗ trợ
        </CardTitle>
        {isLoading ? (
          <Skeleton className="h-6 w-20 rounded-full" />
        ) : (
          <Badge variant="urgent">{urgentCount} khẩn cấp</Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !rows.length ? (
          <p className="py-8 text-center text-sm text-ink-faint">Lớp ổn định, không có cảnh báo.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {/* Header */}
            <div className="flex items-center gap-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
              <span className="w-6" />
              <span className="flex-1 min-w-0">Học sinh</span>
              <span className="w-20 text-center">Lý do</span>
              <span className="w-40 text-right">Chủ đề yếu</span>
              <span className="w-20" />
            </div>
            {/* Rows */}
            {rows.map((r) => {
              const isOpen = expanded === r.studentId;
              const topicBadges = r.weakTopics.slice(0, 3);
              const moreTopics = r.weakTopics.length - 3;
              return (
                <div key={r.studentId} className="rounded-bento-sm border border-hairline/50 bg-cream/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : r.studentId)}
                    className="flex w-full items-center gap-3 px-2 py-2 text-left transition-colors hover:bg-cream-100"
                  >
                    {/* Severity dot */}
                    <span className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                      r.severity === 'critical' ? 'bg-primary/15 text-primary' : 'bg-lavender-soft text-ink',
                    )}>
                      {initials(r.name)}
                    </span>
                    {/* Name */}
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold text-ink">{r.name}</span>
                    {/* Reason */}
                    <span className="flex w-20 items-center justify-center gap-1 text-[11px] text-ink-faint">
                      <TrendingDown className="h-3 w-3" />
                      <span className="truncate">{r.reason}</span>
                    </span>
                    {/* Topic badges */}
                    <div className="flex w-40 items-center justify-end gap-1">
                      {topicBadges.map((t) => (
                        <span key={t} className="rounded-full bg-maroon/10 px-1.5 py-0.5 text-[9px] font-semibold text-maroon truncate max-w-[80px]">
                          {t}
                        </span>
                      ))}
                      {moreTopics > 0 && (
                        <span className="text-[10px] text-ink-faint">+{moreTopics}</span>
                      )}
                    </div>
                    {/* Chevron */}
                    <ChevronDown className={cn('h-4 w-4 text-ink-faint transition-transform shrink-0', isOpen && 'rotate-180')} />
                  </button>

                  {/* Expanded: show all weak topics + action */}
                  {isOpen && (
                    <div className="border-t border-hairline/50 bg-white px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {r.weakTopics.map((t) => (
                          <span key={t} className="rounded-full bg-maroon/10 px-2 py-0.5 text-[10px] font-semibold text-maroon">
                            {t}
                          </span>
                        ))}
                        {!r.weakTopics.length && (
                          <span className="text-[11px] text-ink-faint">Không có dữ liệu chủ đề yếu</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onSelectStudent?.(r.studentId)}
                        >
                          Xem chi tiết
                        </Button>
                        {r.weakTopics.length > 0 && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => onCreateGroup?.(r.studentId)}
                          >
                            Tạo nhóm <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
