"use client";

import {
  Area,
  AreaChart as RAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = Record<string, string | number>;

export function AreaChart({
  data,
  categories,
  index,
  colors = ["#22c55e", "#ef4444", "#3b82f6", "#eab308"],
  height = 240,
}: {
  data: Point[];
  categories: string[];
  index: string;
  colors?: string[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RAreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {categories.map((c, i) => (
              <linearGradient key={c} id={`grad-${c}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey={index} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "rgb(var(--color-card) / 1)", border: "1px solid rgb(var(--color-border) / 1)", fontSize: 11 }}
            wrapperStyle={{ outline: "none" }}
            cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
          />
          {categories.map((c, i) => (
            <Area
              key={c}
              type="monotone"
              dataKey={c}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              fill={`url(#grad-${c})`}
              isAnimationActive={false}
            />
          ))}
        </RAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
