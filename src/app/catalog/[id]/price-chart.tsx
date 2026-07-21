"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { PriceHistoryPoint } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export default function PriceChart({ points }: { points: PriceHistoryPoint[] }) {
  const trimmed = points.slice(-7);
  const lastIndex = trimmed.length - 1;
  // Recharts 3.x에서 Cell은 deprecated이므로 per-bar 색상은 각 데이터 포인트의 fill 필드로 지정한다.
  const data = trimmed.map((point, index) => ({
    date: new Date(point.checkedAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }),
    price: point.price,
    fill: index === lastIndex ? "var(--color-accent)" : "var(--color-chart-bar)"
  }));
  const prices = data.map((entry) => entry.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // 막대 높이 차이가 보이도록 도메인 하단을 최저가보다 낮게 잡는다(모든 값이 같으면 5% 여백).
  const span = maxPrice - minPrice || Math.round(maxPrice * 0.05) || 1;

  return (
    <div className="price-history-chart">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 24, left: 8, right: 8 }}>
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-3)" }} />
          <YAxis hide domain={[minPrice - span, maxPrice + Math.round(span * 0.3)]} />
          <Bar dataKey="price" maxBarSize={52} radius={[10, 10, 4, 4]} isAnimationActive={false}>
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
