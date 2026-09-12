import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money } from '../../lib/format';

export const periods = ['1D', '1W', '1M', '3M', '6M', '1Y'];
export function EquityChart({
  period = '1M',
  compact = false,
  customData,
}: {
  period?: string;
  compact?: boolean;
  customData?: { label: string; value: number }[];
}) {
  const id = useId().replace(/:/g, '');
  const index = Math.max(0, periods.indexOf(period));
  const values = [
    20, 25, 22, 28, 23, 38, 34, 39, 32, 36, 45, 41, 52, 44, 49, 42, 57, 53, 64, 58, 70, 61, 72, 67,
    83, 76, 88, 83, 98, 91, 105,
  ];
  const data = values.map((v, i) => ({
    value: 10780 + v * (12 + index * 5) + Math.sin(i * (index + 1)) * 95,
    label:
      period === '1D'
        ? `${String(Math.floor((i * 23) / 30)).padStart(2, '0')}:00`
        : `${Math.floor((i * 29) / 30) + 1} ${index > 2 ? 'Aug' : 'Sep'}`,
  }));
  return (
    <div
      className={`equity-chart ${compact ? 'compact' : ''}`}
      role="img"
      aria-label={customData ? 'Grafik ekuitas berdasarkan transaksi' : `Grafik ekuitas demo periode ${period}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={customData || data} margin={{ top: 20, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6f3e9" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#f6f3e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ffffff12" strokeDasharray="4 6" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#95958f', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={65}
            dy={10}
          />
          <YAxis
            domain={['dataMin - 300', 'dataMax + 300']}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            tick={{ fill: '#95958f', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickCount={4}
          />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="chart-tooltip">
                  <small>{label}</small>
                  <strong>{money(Number(payload[0].value))}</strong>
                </div>
              ) : null
            }
            cursor={{ stroke: '#FF4D4D', strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#F3F1E9"
            strokeWidth={2.3}
            fill={`url(#${id})`}
            activeDot={{ r: 5, fill: '#FF4D4D', stroke: '#191919', strokeWidth: 3 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Sparkline({ points, negative = false }: { points: number[]; negative?: boolean }) {
  return (
    <svg className="sparkline" viewBox="0 0 100 42" aria-hidden="true">
      <polyline
        points={points.map((p, i) => `${i * 9},${42 - p * 0.65}`).join(' ')}
        fill="none"
        stroke={negative ? '#FF4D4D' : '#648c73'}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
