// Lightweight SVG area chart (replaces recharts to keep the bundle small on mobile data).
import { useId } from "react";

export default function AreaChart({ data, height = 140 }: { data: { date: string; value: number }[]; height?: number }) {
  const fillId = `area${useId().replace(/:/g, "")}`;
  if (data.length === 0) return null;
  // Start from zero so a single trade still draws a line
  const values = [0, ...data.map((d) => d.value)];
  const w = 300;
  const pad = 6;
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const x = (i: number) => (i / (values.length - 1)) * w;
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2);

  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${w},${y(min)} L0,${y(min)} Z`;
  const up = values[values.length - 1] >= 0;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={`w-full ${up ? "text-income" : "text-expense"}`} style={{ height }} role="img" aria-label="Cumulative profit and loss">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke="rgb(var(--line))" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <path d={area} fill={`url(#${fillId})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
