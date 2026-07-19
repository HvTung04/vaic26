import { useMemo, useState } from 'react';
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Send, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';
import type { KnowledgeGapTopic, GapSeverity } from '../types';

const SEVERITY_CONFIG: Record<GapSeverity, { color: string; label: string; icon: typeof AlertTriangle }> = {
  critical: { color: '#6d1f1a', label: 'Ưu tiên cao', icon: AlertTriangle },
  watch: { color: '#e87c4f', label: 'Cần theo dõi', icon: Eye },
  onTrack: { color: '#234d2f', label: 'Đạt yêu cầu', icon: CheckCircle2 },
};

function generateInsight(topics: KnowledgeGapTopic[] | undefined): string {
  if (!topics || topics.length === 0) return 'Chưa có đủ dữ liệu để phân tích. Em có thể quay lại sau khi có thêm dữ liệu bài kiểm tra.';

  const critical = topics.filter((t) => t.severity === 'critical');
  const watch = topics.filter((t) => t.severity === 'watch');
  const onTrack = topics.filter((t) => t.severity === 'onTrack');
  const criticalStudents = critical.reduce((a, t) => a + t.studentsAffected, 0);
  const avgPassRate = Math.round(topics.reduce((a, t) => a + t.passRate, 0) / topics.length);

  let msg = `Xin chào thầy/cô! Em là G.A.R.Y AI — trợ lý phân tích kiến thức.\n\n`;
  msg += `📊 **Tình hình lớp:** Lớp có ${topics.length} chủ đề đang được theo dõi. `;
  msg += `Tỷ lệ đạt trung bình là ${avgPassRate}%. `;
  if (onTrack.length > 0) msg += `${onTrack.length} chủ đề đạt yêu cầu. `;
  if (watch.length > 0) msg += `${watch.length} chủ đề cần theo dõi. `;

  if (critical.length > 0) {
    const sorted = [...critical].sort((a, b) => a.passRate - b.passRate);
    msg += `\n\n⚠️ **Cảnh báo:** ${critical.length} chủ đề cần ưu tiên xử lý ngay. `;
    msg += `"${sorted[0].label}" có tỷ lệ đạt thấp nhất (${sorted[0].passRate}%), ảnh hưởng ${sorted[0].studentsAffected} học sinh. `;
    if (criticalStudents > 0) {
      msg += `Tổng cộng ${criticalStudents} học sinh đang ở vùng nguy hiểm.`;
    }
  } else if (watch.length > 0) {
    msg += `\n\n👀 **Lưu ý:** Không có chủ đề nào ở mức nghiêm trọng, nhưng vẫn có ${watch.length} chủ đề cần theo dõi.`;
  } else {
    msg += `\n\n✅ **Tin tốt:** Lớp đang ổn định. Thầy cô có thể tập trung mở rộng nâng cao.`;
  }

  msg += `\n\n💡 Em có thể giúp thầy/cô:`;
  if (critical.length > 0) {
    const topCritical = [...critical].sort((a, b) => a.passRate - b.passRate).slice(0, 3);
    msg += `\n• Phân tích sâu lỗ hổng "${topCritical[0].label}" và gợi ý bài ôn tập`;
    if (topCritical.length > 1) msg += `\n• Tạo bài kiểm tra remedial cho ${topCritical.length} chủ đề yếu`;
  }
  msg += `\n• Gợi ý phân nhóm học sinh theo năng lực`;
  msg += `\n• Lập kế hoạch giảng dạy tuần tới`;

  msg += `\n\nThầy/cô muốn em hỗ trợ phần nào ạ?`;

  return msg;
}

interface SeverityPieTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}

function SeverityPieTooltip({ active, payload }: SeverityPieTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-bento-sm border border-hairline bg-white px-3 py-2 shadow-floating">
      <p className="text-xs font-semibold text-ink">{d.name}</p>
      <p className="text-xs text-ink-soft">
        {d.value} chủ đề
      </p>
    </div>
  );
}

interface BarTooltipProps {
  active?: boolean;
  payload?: { payload: KnowledgeGapTopic }[];
}

function TopicBarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  const t = payload[0].payload;
  return (
    <div className="rounded-bento-sm border border-hairline bg-white px-3 py-2 shadow-floating">
      <p className="mb-1 text-xs font-semibold text-ink">{t.label}</p>
      <p className="text-xs text-ink-soft">
        Tỷ lệ đạt: <span className="font-semibold text-ink">{t.passRate}%</span>
      </p>
      <p className="text-xs text-ink-soft">
        Học sinh khó khăn: <span className="font-semibold text-ink">{t.studentsAffected}</span>
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
  const [input, setInput] = useState('');

  const { pieData, weakTopics, severityCounts, avgPassRate } = useMemo(() => {
    const list = topics ?? [];
    const counts: Record<GapSeverity, number> = { critical: 0, watch: 0, onTrack: 0 };
    list.forEach((t) => { counts[t.severity]++; });

    const pie = (['critical', 'watch', 'onTrack'] as GapSeverity[])
      .filter((s) => counts[s] > 0)
      .map((s) => ({
        name: SEVERITY_CONFIG[s].label,
        value: counts[s],
        color: SEVERITY_CONFIG[s].color,
      }));

    const weak = [...list]
      .sort((a, b) => a.passRate - b.passRate)
      .slice(0, 6);

    const avg = list.length > 0
      ? Math.round(list.reduce((a, t) => a + t.passRate, 0) / list.length)
      : 0;

    return { pieData: pie, weakTopics: weak, severityCounts: counts, avgPassRate: avg };
  }, [topics]);

  const insightMessage = useMemo(() => generateInsight(topics), [topics]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Lỗ hổng Kiến thức</CardTitle>
        <div className="flex items-center gap-3 text-xs text-ink-soft">
          <span>Trung bình: <span className="font-bold text-ink">{avgPassRate}%</span></span>
          {moreCount > 0 && <span className="text-ink-faint">+{moreCount} chưa đủ dữ liệu</span>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {(['critical', 'watch', 'onTrack'] as GapSeverity[]).map((s) => {
                const cfg = SEVERITY_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <div key={s} className="flex items-center gap-2 rounded-bento-sm border border-hairline/60 bg-white px-3 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: cfg.color + '18' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-tight text-ink">{severityCounts[s]}</p>
                      <p className="text-[10px] font-medium text-ink-faint">{cfg.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts row */}
            <div className="grid gap-6 sm:grid-cols-[1fr_1.4fr]">
              {/* Donut chart — severity distribution */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Phân bố mức độ</p>
                <div className="relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<SeverityPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xl font-bold text-ink">{topics?.length ?? 0}</p>
                      <p className="text-[10px] text-ink-faint">chủ đề</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 text-[10px] text-ink-soft">
                  {pieData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </div>

              {/* Horizontal bar chart — weakest topics */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Chủ đề yếu nhất (tỷ lệ đạt)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weakTopics} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={110}
                      tick={{ fontSize: 11, fill: '#374151' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<TopicBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="passRate" radius={[0, 6, 6, 0]} barSize={18}>
                      {weakTopics.map((t) => (
                        <Cell key={t.id} fill={SEVERITY_CONFIG[t.severity].color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Chatbot — full width, distinct background */}
            <div className="flex flex-col overflow-hidden rounded-bento-lg border border-lavender/40 bg-gradient-to-br from-[#f5f0ff] via-[#faf8ff] to-[#f0f4ff] shadow-sm">
              {/* Chat header */}
              <div className="flex items-center gap-2.5 border-b border-lavender/20 bg-white/70 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lavender text-[#6B3FCB] shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">G.A.R.Y AI</p>
                  <p className="text-[10px] text-ink-faint">Trợ lý phân tích kiến thức</p>
                </div>
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-1 text-[10px] font-semibold text-forest">
                  <span className="h-1.5 w-1.5 rounded-full bg-forest animate-pulse" /> Đang hoạt động
                </span>
              </div>

              {/* Chat messages */}
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-thin min-h-[200px]">
                {/* AI welcome message */}
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lavender text-[#6B3FCB] shadow-sm">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm border border-white/60">
                    {insightMessage.split('\n').map((line, i) => (
                      <p key={i} className="text-[13px] leading-relaxed text-ink whitespace-pre-wrap">
                        {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat input */}
              <div className="flex items-center gap-3 border-t border-lavender/20 bg-white/70 px-4 py-3 backdrop-blur-sm">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn cho G.A.R.Y AI..."
                  className="flex-1 rounded-full border border-hairline/60 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-lavender/60 focus:outline-none focus:ring-2 focus:ring-lavender/20"
                />
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6B3FCB] text-white shadow-md transition-all hover:bg-[#5B33C4] hover:shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
