import { buildLinePath } from "@/lib/price-chart";
import type { PriceHistoryPoint } from "@/lib/catalog";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;

export default function PriceChart({ points }: { points: PriceHistoryPoint[] }) {
  const path = buildLinePath(points.map((point) => point.price), CHART_WIDTH, CHART_HEIGHT);

  return (
    <svg className="price-chart" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="가격 추이 차트">
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
    </svg>
  );
}
