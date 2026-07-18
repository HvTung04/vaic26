import { useMemo, useState } from 'react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { KnowledgeGapTopic } from '../types';

interface GapTreemapDatum extends KnowledgeGapTopic {
  [key: string]: unknown;
}

const severityFill: Record<KnowledgeGapTopic['severity'], string> = {
  critical: '#6d1f1a',
  watch: '#ffe9e2',
  onTrack: '#234d2f',
};

const severityTextColor: Record<KnowledgeGapTopic['severity'], string> = {
  critical: '#ffffff',
  watch: '#7a2e17',
  onTrack: '#ffffff',
};

const severityLegend: { severity: KnowledgeGapTopic['severity']; label: string; swatch: string }[] = [
  { severity: 'critical', label: 'Ưu tiên cao', swatch: 'bg-maroon' },
  { severity: 'watch', label: 'Cần theo dõi', swatch: 'bg-coral-soft' },
  { severity: 'onTrack', label: 'Đạt yêu cầu', swatch: 'bg-forest' },
];

interface GapTileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string;
  passRate?: number;
  severity?: KnowledgeGapTopic['severity'];
  studentsAffected?: number;
}

function GapTile({ x = 0, y = 0, width = 0, height = 0, label, passRate, severity, studentsAffected }: GapTileProps) {
  if (!severity || width <= 0 || height <= 0) return null;
  const textColor = severityTextColor[severity];
  const showLabel = width > 56 && height > 36;
  const showMeta = showLabel && width > 92 && height > 60;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={12} ry={12} fill={severityFill[severity]} />
      {showLabel && (
        <foreignObject x={x + 10} y={y + 8} width={Math.max(width - 20, 0)} height={Math.max(height - 16, 0)}>
          <div className="flex h-full flex-col justify-between" style={{ color: textColor }}>
            <p
              className="text-xs font-semibold leading-snug"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {label}
            </p>
            <div className="flex items-end justify-between gap-2">
              <span className="text-xl font-bold">{passRate}%</span>
              {showMeta && (
                <span className="pb-0.5 text-[11px] font-medium opacity-80 whitespace-nowrap">
                  {studentsAffected} HS
                </span>
              )}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

function GapTooltip({ active, payload }: { active?: boolean; payload?: { payload: KnowledgeGapTopic }[] }) {
  if (!active || !payload?.length) return null;
  const topic = payload[0].payload;
  return (
    <div className="rounded-bento-sm border border-hairline bg-white px-3 py-2 shadow-floating">
      <p className="mb-1 text-xs font-semibold text-ink">{topic.label}</p>
      <p className="text-xs text-ink-soft">
        Tỷ lệ đạt: <span className="font-semibold text-ink">{topic.passRate}%</span>
      </p>
      <p className="text-xs text-ink-soft">
        Học sinh đang gặp khó khăn: <span className="font-semibold text-ink">{topic.studentsAffected}</span>
      </p>
    </div>
  );
}

export interface ClassKnowledgeGapsProps {
  topics?: KnowledgeGapTopic[];
  moreCount?: number;
  isLoading?: boolean;
}

export function ClassKnowledgeGaps({ topics, moreCount = 0, isLoading }: ClassKnowledgeGapsProps) {
  const [view, setView] = useState('overview');
  const rankedTopics = useMemo(
    () => [...(topics ?? [])].sort((a, b) => b.studentsAffected - a.studentsAffected) as GapTreemapDatum[],
    [topics],
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Lỗ hổng Kiến thức</CardTitle>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="grouped">Theo nhóm</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <Treemap
              data={rankedTopics}
              dataKey="studentsAffected"
              nameKey="label"
              aspectRatio={4 / 3}
              nodeGap={4}
              isAnimationActive={false}
              content={<GapTile />}
            >
              <Tooltip content={<GapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        )}
        {!isLoading && moreCount > 0 && (
          <p className="text-xs text-ink-faint">+{moreCount} chủ đề khác chưa đủ dữ liệu để hiển thị</p>
        )}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-ink-soft">
          {severityLegend.map(({ severity, label, swatch }) => (
            <span key={severity} className="flex items-center gap-1.5">
              <span className={cn('h-2.5 w-2.5 rounded-sm', swatch)} /> {label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
