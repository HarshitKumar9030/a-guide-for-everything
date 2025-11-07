"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface UsageSlice {
  name: string;
  value: number;
}

interface Props {
  data: UsageSlice[];
}

const COLORS = ['#f97316', '#38bdf8', '#a855f7'];

const tooltipStyle = {
  backgroundColor: 'rgba(10, 14, 28, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fffff',
  fontSize: '0.75rem',
  padding: '8px 10px',
};

export default function UsageCompositionChart({ data }: Props) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-white/60">
        No usage recorded yet.
      </div>
    );
  }

  const normalized = data.filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend verticalAlign="bottom" wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }} />
        <Pie
          data={normalized}
          dataKey="value"
          nameKey="name"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={4}
          stroke="none"
        >
          {normalized.map((entry, index) => (
            <Cell
              key={`slice-${entry.name}`}
              fill={COLORS[index % COLORS.length]}
              className="[filter:drop-shadow(0_6px_16px_rgba(0,0,0,0.35))]"
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
