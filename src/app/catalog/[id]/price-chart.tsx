"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis } from "recharts";
import type { PriceHistoryPoint } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export default function PriceChart({ points }: { points: PriceHistoryPoint[] }) {
  const data = points.slice(-7).map((point) => ({
    date: new Date(point.checkedAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }),
    price: point.price
  }));
  const lastIndex = data.length - 1;

  return (
    <div className="price-history-chart">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 24, left: 8, right: 8 }}>
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-3)" }} />
          <Bar dataKey="price" radius={[10, 10, 4, 4]} maxBarSize={52} isAnimationActive>
            {data.map((entry, index) => (
              <Cell key={entry.date} fill={index === lastIndex ? "var(--color-accent)" : "var(--color-chart-bar)"} />
            ))}
            <LabelList
              dataKey="price"
              position="top"
              formatter={(value: string | number | boolean | null | undefined) => formatPrice(Number(value ?? 0))}
              style={{ fontSize: 11.5, fontWeight: 700, fill: "var(--color-accent-deep)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
