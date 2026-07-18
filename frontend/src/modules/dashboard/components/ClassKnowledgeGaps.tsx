import { useMemo, useState } from 'react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Send } from 'lucide-react';
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

function generateInsight(topics: KnowledgeGapTopic[] | undefined): string[] {
  if (!topics || topics.length === 0) return ['Chưa có đủ dữ liệu để phân tích.'];

  const critical = topics.filter((t) => t.severity === 'critical');
  const watch = topics.filter((t) => t.severity === 'watch');
  const onTrack = topics.filter((t) => t.severity === 'onTrack');
  const totalStudents = topics.reduce((a, t) => a + t.studentsAffected, 0);
  const criticalStudents = critical.reduce((a, t) => a + t.studentsAffected, 0);

  const parts: string[] = [];

  parts.push(
    `Tổng quan: Lớp có ${topics.length} chủ đề kiến thức đang được theo dõi, trong đó ${onTrack.length} chủ đề đạt yêu cầu, ${watch.length} cần theo dõi và ${critical.length} cần ưu tiên xử lý.`,
  );

  if (critical.length > 0) {
    const sorted = [...critical].sort((a, b) => a.passRate - b.passRate);
    parts.push(
      `Cảnh báo: Chủ đề "${sorted[0].label}" có tỷ lệ đạt thấp nhất chỉ ${sorted[0].passRate}%, ảnh hưởng đến ${sorted[0].studentsAffected} học sinh. Đây là lỗ hổng lớn nhất cần được xử lý ngay.`,
    );
  }

  if (criticalStudents > 0) {
    parts.push(
      `Hành động đề xuất: Giáo viên nên ôn tập lại nền tảng cho ${criticalStudents} học sinh nằm ở vùng nguy hiểm trước khi tiếp tục bài giảng mới. Nên chia nhóm học tập phân biệt theo năng lực.`,
    );
  }

  if (critical.length === 0 && watch.length === 0) {
    parts.push('Lớp đang ổn định, giáo viên có thể tập trung mở rộng nâng cao.');
  }

  return parts;
}

export interface ClassKnowledgeGapsProps {
  topics?: KnowledgeGapTopic[];
  moreCount?: number;
  isLoading?: boolean;
}

export function ClassKnowledgeGaps({ topics, moreCount = 0, isLoading }: ClassKnowledgeGapsProps) {
  const [view, setView] = useState('overview');
  const [input, setInput] = useState('');
  const rankedTopics = useMemo(
    () => [...(topics ?? [])].sort((a, b) => b.studentsAffected - a.studentsAffected) as GapTreemapDatum[],
    [topics],
  );

  const insightLines = useMemo(() => generateInsight(topics), [topics]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
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
          <div className="grid gap-8 sm:grid-cols-[2fr_3fr]">
            {/* Treemap - 4/10 */}
            <div className="flex flex-col gap-3">
              <ResponsiveContainer width="100%" height={220}>
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

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[11px] text-ink-soft">
                {severityLegend.map(({ severity, label, swatch }) => (
                  <span key={severity} className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-sm', swatch)} /> {label}
                  </span>
                ))}
              </div>

              {moreCount > 0 && (
                <p className="text-[11px] text-ink-faint">+{moreCount} chủ đề khác chưa đủ dữ liệu</p>
              )}
            </div>

            {/* AI Chatbox - 6/10 */}
            <div className="flex flex-col rounded-bento border border-hairline/60 bg-cream/40">
              {/* Chat header */}
              <div className="flex items-center gap-2 border-b border-hairline/50 px-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-lavender-soft">
                  <Bot className="h-3.5 w-3.5 text-lavender" />
                </div>
                <span className="text-xs font-semibold text-ink">G.A.R.Y AI</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-forest">
                  <span className="h-1.5 w-1.5 rounded-full bg-forest" /> Đang hoạt động
                </span>
              </div>

              {/* Chat messages */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 scrollbar-thin">
                {/* AI message */}
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lavender-soft">
                    <Bot className="h-3 w-3 text-lavender" />
                  </div>
                  <div className="flex-1 rounded-bento-sm rounded-tl-none bg-white p-3 shadow-sm">
                    {insightLines.map((line, i) => (
                      <p key={i} className="text-[13px] leading-relaxed text-ink">
                        {line}
                        {i < insightLines.length - 1 && <br />}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat input */}
              <div className="flex items-center gap-2 border-t border-hairline/50 px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi AI về lỗ hổng kiến thức..."
                  className="flex-1 bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
                />
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-cream transition-colors hover:bg-ink/80"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
