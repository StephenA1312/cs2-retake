"use client";

import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = Record<string, string | number>;

export function BarChart({
  data,
  categories,
  index,
  colors = ["#22c55e", "#ef4444"],
  height = 220,
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
        <RBarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey={index} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 10, fill: "currentColor", opacity: 0.6 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "rgb(var(--color-card) / 1)", border: "1px solid rgb(var(--color-border) / 1)", fontSize: 11 }}
            wrapperStyle={{ outline: "none" }}
            cursor={{ fill: "currentColor", fillOpacity: 0.05 }}
          />
          {categories.map((c, i) => (
            <Bar key={c} dataKey={c} fill={colors[i % colors.length]} isAnimationActive={false} />
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
