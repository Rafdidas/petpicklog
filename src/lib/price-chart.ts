export function buildLinePath(prices: number[], width: number, height: number, padding = 8): string {
  if (prices.length === 0) {
    return "";
  }

  if (prices.length === 1) {
    const y = height / 2;
    return `M ${padding},${y} L ${width - padding},${y}`;
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = prices.map((price, index) => {
    const x = padding + (index / (prices.length - 1)) * innerWidth;
    const fraction = range === 0 ? 0.5 : (price - min) / range;
    const y = padding + innerHeight - fraction * innerHeight;
    return { x, y };
  });

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}
