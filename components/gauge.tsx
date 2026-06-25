'use client';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface Props {
  value: number;
  target: number;
  label: string;
  sublabel?: string;
  color?: string;
}

export function Gauge({ value, target, label, sublabel, color = '#D4B96A' }: Props) {
  const pct = Math.max(0, Math.min(1, target ? value / target : 0));
  const data = [{ value: pct * 100 }];
  const tone = pct >= 1 ? '#10B981' : pct >= 0.9 ? '#F59E0B' : pct >= 0.5 ? '#F97316' : '#EF4444';

  const displayValue = value <= 1 ? `${(value * 100).toFixed(0)}%` : value.toLocaleString();
  const displayTarget = target <= 1 ? `${(target * 100).toFixed(0)}%` : target.toLocaleString();

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <ResponsiveContainer>
          <RadialBarChart innerRadius="75%" outerRadius="100%" data={data} startAngle={210} endAngle={-30}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={10} fill={tone} background={{ fill: 'rgba(255,255,255,0.08)' }} isAnimationActive={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div className="text-2xl font-serif font-medium text-white tabular-nums">{displayValue}</div>
          <div className="text-[10px] uppercase tracking-wider text-white/45">/ {displayTarget}</div>
        </div>
        {/* Glow under the gauge */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full blur-2xl opacity-30"
          style={{ background: tone }}
        />
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium text-white">{label}</div>
        {sublabel && <div className="text-xs text-white/55 mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}
