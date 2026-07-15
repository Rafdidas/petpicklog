import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductPriceStats } from "@/lib/price-stats";

type StatsRow = {
  external_product_id: string;
  title: string;
  category_slug: string | null;
  pet_type: string | null;
  mall_name: string | null;
  product_url: string;
  image_url: string | null;
  current_price: number;
  last_checked_at: string;
  max_price_14d: number;
  drop_pct: number;
  min_price_all: number;
};

function mapStatsRow(row: StatsRow): ProductPriceStats {
  return {
    externalProductId: row.external_product_id,
    title: row.title,
    categorySlug: row.category_slug,
    petType: row.pet_type,
    mallName: row.mall_name,
    productUrl: row.product_url,
    imageUrl: row.image_url,
    currentPrice: row.current_price,
    lastCheckedAt: row.last_checked_at,
    maxPrice14d: row.max_price_14d,
    dropPct: row.drop_pct,
    minPriceAll: row.min_price_all
  };
}

export async function fetchTopDrops(limit: number): Promise<ProductPriceStats[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("product_price_stats")
    .select("*")
    .gt("drop_pct", 0)
    .order("drop_pct", { ascending: false })
    .limit(limit);

  return ((data ?? []) as StatsRow[]).map(mapStatsRow);
}

export type CatalogSummary = {
  trackedCount: number;
  historyCount: number;
  lastCollectedAt: string | null;
};

export async function fetchCatalogSummary(): Promise<CatalogSummary> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { trackedCount: 0, historyCount: 0, lastCollectedAt: null };
  }

  const [trackedResult, historyResult, lastResult] = await Promise.all([
    supabase.from("external_products").select("id", { count: "exact", head: true }).eq("is_tracked", true),
    supabase.from("price_histories").select("id", { count: "exact", head: true }),
    supabase.from("price_histories").select("checked_at").order("checked_at", { ascending: false }).limit(1).maybeSingle()
  ]);

  return {
    trackedCount: trackedResult.count ?? 0,
    historyCount: historyResult.count ?? 0,
    lastCollectedAt: (lastResult.data as { checked_at: string } | null)?.checked_at ?? null
  };
}
