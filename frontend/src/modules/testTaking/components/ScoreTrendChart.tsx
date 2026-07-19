import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { StudentResultHistoryItem } from '../types';

interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-bento-sm border border-hairline bg-white px-3 py-2 shadow-floating">
      <p className="mb-1 text-xs font-semibold text-ink">{label}</p>
      <p className="text-xs text-ink-soft">
        Điểm: <span className="font-semibold text-ink">{payload[0].value}%</span>
      </p>
    </div>
  );
}

export interface ScoreTrendChartProps {
  history: StudentResultHistoryItem[];
  height?: number;
}

export function ScoreTrendChart({ history, height = 190 }: ScoreTrendChartProps) {
  const data = [...history]
    .sort((a, b) => (a.submittedAt < b.submittedAt ? -1 : 1))
    .map((item) => ({
      date: new Date(item.submittedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      score: item.total > 0 ? Math.round((item.score / item.total) * 100) : 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF4F12" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#FF4F12" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EAE6DB" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8C8A94', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8C8A94', fontSize: 12 }} width={32} domain={[0, 100]} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="score" name="Điểm" stroke="#FF4F12" strokeWidth={2.5} fill="url(#scoreTrendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
