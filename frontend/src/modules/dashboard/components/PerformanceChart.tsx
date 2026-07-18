import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { PerformancePoint } from '../types';

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-bento-sm border border-hairline bg-white px-3 py-2 shadow-floating">
      <p className="mb-1 text-xs font-semibold text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold text-ink">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export interface PerformanceChartProps {
  data: PerformancePoint[];
  height?: number;
  showLegend?: boolean;
}

export function PerformanceChart({ data, height = 240, showLegend = true }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF4F12" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#FF4F12" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="classFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#DBC6FF" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#DBC6FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EAE6DB" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#8C8A94', fontSize: 12 }}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8C8A94', fontSize: 12 }} width={32} />
        <Tooltip content={<ChartTooltip />} />
        {showLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#52505C' }} />}
        <Area
          type="monotone"
          dataKey="classAverage"
          name="Trung bình lớp"
          stroke="#B497E0"
          strokeWidth={2}
          fill="url(#classFill)"
        />
        <Area
          type="monotone"
          dataKey="score"
          name="Học sinh"
          stroke="#FF4F12"
          strokeWidth={2.5}
          fill="url(#scoreFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
