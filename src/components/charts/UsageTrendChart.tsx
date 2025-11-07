"use client";

import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface UsageTrendPoint {
  date: string;
  total: number;
  text: number;
  images: number;
  tokens: number;
}

interface Props {
  data: UsageTrendPoint[];
}

const tooltipStyle = {
  backgroundColor: 'rgba(10, 14, 28, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '0.75rem',
  padding: '8px 10px',
};

export default function UsageTrendChart({ data }: Props) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="usageText" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#facc15" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#facc15" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="usageImages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.45)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="rgba(255,255,255,0.45)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }} />
          <Area type="monotone" dataKey="text" name="Text" stroke="#facc15" strokeWidth={2} fill="url(#usageText)" />
          <Area type="monotone" dataKey="images" name="Images" stroke="#38bdf8" strokeWidth={2} fill="url(#usageImages)" />
          <Line type="monotone" dataKey="tokens" name="Tokens" stroke="#a855f7" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
