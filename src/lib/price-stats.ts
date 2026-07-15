export type ProductPriceStats = {
  externalProductId: string;
  title: string;
  categorySlug: string | null;
  petType: string | null;
  mallName: string | null;
  productUrl: string;
  imageUrl: string | null;
  currentPrice: number;
  lastCheckedAt: string;
  maxPrice14d: number;
  dropPct: number;
  minPriceAll: number;
};

export function hasPriceDrop(stats: Pick<ProductPriceStats, "dropPct">) {
  return stats.dropPct > 0;
}

export function formatDropLabel(dropPct: number) {
  if (dropPct <= 0) {
    return "";
  }

  return `-${dropPct}%`;
}

export function isNearAllTimeLow(stats: Pick<ProductPriceStats, "currentPrice" | "minPriceAll">, thresholdPct = 5) {
  if (stats.minPriceAll <= 0) {
    return false;
  }

  const diffPct = ((stats.currentPrice - stats.minPriceAll) / stats.minPriceAll) * 100;
  return diffPct <= thresholdPct;
}
