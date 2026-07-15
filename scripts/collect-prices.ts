import "dotenv/config";
import { searchShoppingProducts } from "../src/lib/naver-shopping";
import { buildDiscoveryRows } from "./lib/discovery";
import { findMatchingProduct } from "./lib/match";
import { createAdminSupabaseClient } from "./lib/supabase-admin";
import { seedCategories } from "./seeds";

const isDryRun = process.argv.includes("--dry-run");
const REQUEST_DELAY_MS = 150;

type SupabaseAdminClient = ReturnType<typeof createAdminSupabaseClient>;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDiscovery(supabase: SupabaseAdminClient) {
  let discovered = 0;

  for (const category of seedCategories) {
    for (const keyword of category.keywords) {
      const products = await searchShoppingProducts(keyword, { scoped: false });
      const rows = buildDiscoveryRows(products, category.slug, category.petType);

      if (rows.length && !isDryRun) {
        const { error } = await supabase.from("external_products").upsert(rows, { onConflict: "source,external_id" });

        if (error) {
          throw new Error(`발굴 저장 실패 (${keyword}): ${error.message}`);
        }
      }

      discovered += rows.length;
      await sleep(REQUEST_DELAY_MS);
    }
  }

  return discovered;
}

async function runRefresh(supabase: SupabaseAdminClient) {
  const { data: trackedProducts, error } = await supabase
    .from("external_products")
    .select("id, external_id, title")
    .eq("is_tracked", true);

  if (error) {
    throw new Error(`추적 상품 조회 실패: ${error.message}`);
  }

  let refreshed = 0;
  let failedMatch = 0;

  for (const product of trackedProducts ?? []) {
    const candidates = await searchShoppingProducts(product.title as string, { scoped: false });
    const matched = findMatchingProduct(candidates, product.external_id as string);

    if (!matched) {
      failedMatch += 1;
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    if (!isDryRun) {
      const { error: updateError } = await supabase
        .from("external_products")
        .update({ latest_price: matched.latestPrice, last_synced_at: matched.lastSyncedAt })
        .eq("id", product.id as string);

      if (updateError) {
        throw new Error(`상품 갱신 실패 (${product.title}): ${updateError.message}`);
      }

      const { error: historyError } = await supabase.from("price_histories").upsert(
        {
          external_product_id: product.id as string,
          source: matched.source,
          mall_name: matched.mallName,
          price: matched.latestPrice,
          product_url: matched.productUrl
        },
        { onConflict: "external_product_id,checked_date" }
      );

      if (historyError) {
        throw new Error(`가격 기록 저장 실패 (${product.title}): ${historyError.message}`);
      }
    }

    refreshed += 1;
    await sleep(REQUEST_DELAY_MS);
  }

  return { refreshed, failedMatch };
}

async function main() {
  console.log(isDryRun ? "[dry-run] 가격 수집을 시작합니다." : "가격 수집을 시작합니다.");

  const supabase = createAdminSupabaseClient();
  const discovered = await runDiscovery(supabase);
  const { refreshed, failedMatch } = await runRefresh(supabase);

  console.log(`발굴 ${discovered}건 / 스냅샷 ${refreshed}건 / 매칭 실패 ${failedMatch}건`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
