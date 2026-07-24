import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductPriceStats } from "@/lib/price-stats";
import { categories } from "@/lib/categories";

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

export type SitemapProduct = {
  externalProductId: string;
  lastCheckedAt: string;
};

export async function fetchSitemapProducts(): Promise<SitemapProduct[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("product_price_stats")
    .select("external_product_id,last_checked_at")
    .not("last_checked_at", "is", null)
    .order("last_checked_at", { ascending: false });

  return ((data ?? []) as { external_product_id: string; last_checked_at: string }[]).map((row) => ({
    externalProductId: row.external_product_id,
    lastCheckedAt: row.last_checked_at
  }));
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

export type CategoryTopMap = Record<string, ProductPriceStats[]>;

export async function fetchCategoryTopDrops(limit: number): Promise<CategoryTopMap> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return {};
  }

  const entries = await Promise.all(
    categories.map(async (category) => {
      const { data } = await supabase
        .from("product_price_stats")
        .select("*")
        .eq("category_slug", category.slug)
        .order("drop_pct", { ascending: false })
        .limit(limit);

      return [category.slug, ((data ?? []) as StatsRow[]).map(mapStatsRow)] as const;
    })
  );

  return Object.fromEntries(entries);
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

export type CatalogSort = "drop" | "price" | "price_desc" | "recent";

export type CatalogFilters = {
  query?: string;
  categorySlug?: string;
  petType?: string;
  maxPrice?: number;
  minDropPct?: number;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};

export async function fetchCatalogPage(filters: CatalogFilters): Promise<{ items: ProductPriceStats[]; total: number }> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { items: [], total: 0 };
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize ?? 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("product_price_stats").select("*", { count: "exact" });

  if (filters.query) {
    query = query.ilike("title", `%${filters.query}%`);
  }
  if (filters.categorySlug) {
    query = query.eq("category_slug", filters.categorySlug);
  }
  if (filters.petType) {
    query = query.in("pet_type", [filters.petType, "both"]);
  }
  if (filters.maxPrice) {
    query = query.lte("current_price", filters.maxPrice);
  }
  if (filters.minDropPct) {
    query = query.gt("drop_pct", filters.minDropPct - 1);
  }

  if (filters.sort === "price") {
    query = query.order("current_price", { ascending: true });
  } else if (filters.sort === "price_desc") {
    query = query.order("current_price", { ascending: false });
  } else if (filters.sort === "recent") {
    query = query.order("last_checked_at", { ascending: false });
  } else {
    query = query.order("drop_pct", { ascending: false });
  }

  const { data, count } = await query.range(from, to);

  return { items: ((data ?? []) as StatsRow[]).map(mapStatsRow), total: count ?? 0 };
}

export async function fetchProductStats(externalProductId: string): Promise<ProductPriceStats | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("product_price_stats")
    .select("*")
    .eq("external_product_id", externalProductId)
    .maybeSingle();

  return data ? mapStatsRow(data as StatsRow) : null;
}

export type PriceHistoryPoint = { price: number; checkedAt: string; mallName: string | null };

export async function fetchPriceHistory(externalProductId: string, limit: number): Promise<PriceHistoryPoint[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("price_histories")
    .select("price, checked_at, mall_name")
    .eq("external_product_id", externalProductId)
    .order("checked_at", { ascending: true })
    .limit(limit);

  return ((data ?? []) as { price: number; checked_at: string; mall_name: string | null }[]).map((row) => ({
    price: row.price,
    checkedAt: row.checked_at,
    mallName: row.mall_name
  }));
}

export type ExternalProductRow = {
  id: string;
  source: string;
  title: string;
  category: string | null;
  mall_name: string | null;
  product_url: string;
  image_url: string | null;
  latest_price: number | null;
  last_synced_at: string | null;
};

export async function fetchExternalProduct(id: string): Promise<ExternalProductRow | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("external_products")
    .select("id, source, title, category, mall_name, product_url, image_url, latest_price, last_synced_at")
    .eq("id", id)
    .maybeSingle();

  return (data as ExternalProductRow | null) ?? null;
}

export type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  repurchase_intent: boolean | null;
  content: string;
  created_at: string;
};

export async function fetchProductReviews(id: string): Promise<ReviewRow[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("product_reviews")
    .select("id, user_id, rating, repurchase_intent, content, created_at")
    .eq("external_product_id", id)
    .order("created_at", { ascending: false });

  return (data ?? []) as ReviewRow[];
}
