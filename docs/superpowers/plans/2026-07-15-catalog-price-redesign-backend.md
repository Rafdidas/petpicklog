# 카탈로그 가격추적 백엔드 파이프라인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 반려용품 카탈로그를 매일 자동으로 발굴·갱신하는 가격 수집 파이프라인을 만든다 — 시드 키워드 기반 카탈로그 자동 구축, 일일 가격 스냅샷 저장, 급락 특가 계산을 위한 DB 뷰까지.

**Architecture:** Supabase(Postgres) 스키마를 확장(`is_tracked`/`category_slug`/`pet_type` 컬럼 + `product_price_stats` 뷰)하고, 리포 내 `scripts/collect-prices.ts`가 기존 `src/lib/naver-shopping.ts`를 재사용해 네이버 쇼핑 API로 카탈로그를 발굴·가격을 갱신한다. GitHub Actions가 매일 이 스크립트를 직접 실행하므로 앱 배포 상태와 무관하게 동작한다.

**Tech Stack:** Next.js 16 / TypeScript / Supabase(`@supabase/supabase-js`) / vitest(단위 테스트) / tsx(스크립트 실행) / GitHub Actions

## Global Constraints

- 참조 스펙: `docs/superpowers/specs/2026-07-15-catalog-price-redesign-design.md` §3(데이터 모델), §4(수집 파이프라인), §7(테스트)
- 새 테이블을 만들지 않는다 — 기존 `external_products`/`price_histories`만 확장한다.
- 시드 키워드는 DB가 아닌 리포 파일(`scripts/seeds.ts`)로 관리한다.
- 수집 스크립트는 Supabase **service-role** 키를 사용한다(RLS 우회). 이 키는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
- 네이버 API 호출 사이 150ms 대기(레이트리밋 보호).
- 이 플랜은 백엔드/데이터 파이프라인만 다룬다. 프론트엔드(디자인 토큰, 페이지)는 별도 플랜(`2026-07-15-catalog-price-redesign-frontend.md`)에서 다루며, 이 플랜이 만드는 `is_tracked`/`category_slug`/`pet_type` 컬럼과 `product_price_stats` 뷰에 의존한다. 이 플랜부터 완료해야 한다.

---

### Task 1: DB 마이그레이션 — 카탈로그 컬럼 + 가격 스탯 뷰

**Files:**
- Create: `supabase/patches/004_catalog_tracking.sql`

**Interfaces:**
- Produces: `external_products.is_tracked (boolean)`, `external_products.category_slug (text)`, `external_products.pet_type (text)`, `price_histories.checked_date (date)`, `public.product_price_stats` 뷰(컬럼: `external_product_id, title, category_slug, pet_type, mall_name, product_url, image_url, current_price, last_checked_at, max_price_14d, drop_pct, min_price_all`)

이 프로젝트의 기존 패턴(`supabase/patches/001~003`)을 따라 SQL 패치 파일만 작성한다. 자동 마이그레이션 러너가 없으므로 Supabase SQL Editor에서 수동 실행하는 것이 이 프로젝트의 배포 방식이다.

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
alter table public.external_products
  add column if not exists is_tracked boolean not null default false,
  add column if not exists category_slug text,
  add column if not exists pet_type text;

create index if not exists external_products_tracked_category_idx
  on public.external_products (is_tracked, category_slug);

alter table public.price_histories
  add column if not exists checked_date date not null default ((now() at time zone 'Asia/Seoul')::date);

create unique index if not exists price_histories_product_date_idx
  on public.price_histories (external_product_id, checked_date);

create or replace view public.product_price_stats
with (security_invoker = true) as
select
  ep.id as external_product_id,
  ep.title,
  ep.category_slug,
  ep.pet_type,
  ep.mall_name,
  ep.product_url,
  ep.image_url,
  latest.price as current_price,
  latest.checked_at as last_checked_at,
  coalesce(max14.max_price, latest.price) as max_price_14d,
  case
    when coalesce(max14.max_price, 0) > 0
      then round(((max14.max_price - latest.price)::numeric / max14.max_price) * 100)
    else 0
  end as drop_pct,
  coalesce(allmin.min_price, latest.price) as min_price_all
from public.external_products ep
join lateral (
  select price, checked_at
  from public.price_histories ph
  where ph.external_product_id = ep.id
  order by ph.checked_at desc
  limit 1
) latest on true
left join lateral (
  select max(price) as max_price
  from public.price_histories ph
  where ph.external_product_id = ep.id
    and ph.checked_at >= now() - interval '14 days'
) max14 on true
left join lateral (
  select min(price) as min_price
  from public.price_histories ph
  where ph.external_product_id = ep.id
) allmin on true
where ep.is_tracked = true;

grant select on public.product_price_stats to anon, authenticated;
```

참고: `price_histories.external_product_id`는 nullable(리뷰/찜이 `products` 테이블을 참조하는 경우 null일 수 있음)이지만, Postgres 유니크 인덱스는 NULL을 서로 다른 값으로 취급하므로 `(external_product_id, checked_date)`에 부분 인덱스(`where ... is not null`) 없이도 null 행끼리는 절대 충돌하지 않는다. 그래서 `ON CONFLICT (external_product_id, checked_date)`를 PostgREST/Supabase 클라이언트에서 별도 조건 없이 바로 쓸 수 있다.

- [ ] **Step 2: Supabase SQL Editor에서 실행 후 검증**

Supabase 대시보드 → SQL Editor에서 `supabase/patches/004_catalog_tracking.sql` 전체를 붙여넣고 실행한다. 실행 후 아래 쿼리로 컬럼과 뷰가 만들어졌는지 확인한다:

```sql
select column_name from information_schema.columns
where table_name = 'external_products' and column_name in ('is_tracked', 'category_slug', 'pet_type');
-- 3 rows 기대

select column_name from information_schema.columns
where table_name = 'price_histories' and column_name = 'checked_date';
-- 1 row 기대

select * from public.product_price_stats limit 1;
-- 에러 없이 실행되면 통과 (아직 is_tracked=true 데이터가 없으면 0 rows)
```

- [ ] **Step 3: Commit**

```bash
git add supabase/patches/004_catalog_tracking.sql
git commit -m "feat: 카탈로그 추적 컬럼과 가격 통계 뷰 추가"
```

---

### Task 2: 테스트 도구(vitest) 설정 + `price-stats.ts` 순수 함수

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/price-stats.ts`
- Test: `src/lib/price-stats.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `ProductPriceStats` 타입, `hasPriceDrop(stats)`, `formatDropLabel(dropPct)`, `isNearAllTimeLow(stats, thresholdPct?)` — Task 1의 `product_price_stats` 뷰 행 형태를 그대로 소비하는 프론트엔드 전용 포맷/판정 유틸(§7 "하락률 계산" 대응). 나중에 프론트엔드 플랜의 카탈로그/특가/상세 페이지가 이 함수들을 import한다.

- [ ] **Step 1: vitest·tsx·dotenv 설치**

```bash
npm install -D vitest tsx dotenv
```

- [ ] **Step 2: vitest 설정 파일 작성**

```typescript
// vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
```

- [ ] **Step 3: `package.json`에 스크립트 추가**

`scripts` 블록에 다음 두 항목을 추가한다 (기존 `dev`/`build`/`lint`는 유지):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 실패하는 테스트 작성**

```typescript
// src/lib/price-stats.test.ts
import { describe, expect, it } from "vitest";
import { formatDropLabel, hasPriceDrop, isNearAllTimeLow } from "./price-stats";

describe("hasPriceDrop", () => {
  it("dropPct가 양수면 true를 반환한다", () => {
    expect(hasPriceDrop({ dropPct: 23 })).toBe(true);
  });

  it("dropPct가 0이거나 음수면 false를 반환한다", () => {
    expect(hasPriceDrop({ dropPct: 0 })).toBe(false);
    expect(hasPriceDrop({ dropPct: -5 })).toBe(false);
  });
});

describe("formatDropLabel", () => {
  it("하락률을 -N% 형태로 포맷한다", () => {
    expect(formatDropLabel(23)).toBe("-23%");
  });

  it("하락이 없으면 빈 문자열을 반환한다", () => {
    expect(formatDropLabel(0)).toBe("");
    expect(formatDropLabel(-5)).toBe("");
  });
});

describe("isNearAllTimeLow", () => {
  it("현재가가 역대 최저가와 같으면 true를 반환한다", () => {
    expect(isNearAllTimeLow({ currentPrice: 10000, minPriceAll: 10000 })).toBe(true);
  });

  it("현재가가 역대 최저가 대비 임계값(기본 5%) 이내면 true를 반환한다", () => {
    expect(isNearAllTimeLow({ currentPrice: 10400, minPriceAll: 10000 })).toBe(true);
  });

  it("현재가가 역대 최저가 대비 임계값을 초과하면 false를 반환한다", () => {
    expect(isNearAllTimeLow({ currentPrice: 11000, minPriceAll: 10000 })).toBe(false);
  });

  it("minPriceAll이 0 이하이면 false를 반환한다", () => {
    expect(isNearAllTimeLow({ currentPrice: 10000, minPriceAll: 0 })).toBe(false);
  });
});
```

- [ ] **Step 5: 테스트 실패 확인**

Run: `npm run test`
Expected: FAIL — `src/lib/price-stats.ts`를 찾을 수 없다는 에러

- [ ] **Step 6: `price-stats.ts` 구현**

```typescript
// src/lib/price-stats.ts
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
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `npm run test`
Expected: PASS — 8개 테스트 모두 통과

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/price-stats.ts src/lib/price-stats.test.ts
git commit -m "test: vitest 설정과 가격 통계 포맷 유틸 추가"
```

---

### Task 3: 재검색 결과 매칭 유틸 (`scripts/lib/match.ts`)

**Files:**
- Create: `scripts/lib/match.ts`
- Test: `scripts/lib/match.test.ts`

**Interfaces:**
- Consumes: `ExternalProduct` 타입 (`src/types/product.ts:1-12` — `externalId`, `title`, `latestPrice` 등)
- Produces: `findMatchingProduct(candidates: ExternalProduct[], externalId: string): ExternalProduct | null` — Task 6(`collect-prices.ts`)의 갱신 단계가 사용

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// scripts/lib/match.test.ts
import { describe, expect, it } from "vitest";
import type { ExternalProduct } from "@/types/product";
import { findMatchingProduct } from "./match";

function buildProduct(overrides: Partial<ExternalProduct> = {}): ExternalProduct {
  return {
    externalId: "1000",
    title: "테스트 사료",
    brand: null,
    category: "사료",
    imageUrl: "https://example.com/a.jpg",
    productUrl: "https://example.com/a",
    mallName: "테스트몰",
    latestPrice: 10000,
    source: "NAVER",
    lastSyncedAt: "2026-07-15T00:00:00.000Z",
    ...overrides
  };
}

describe("findMatchingProduct", () => {
  it("externalId가 일치하는 상품을 반환한다", () => {
    const target = buildProduct({ externalId: "2000", title: "다른 상품" });
    const candidates = [buildProduct({ externalId: "1000" }), target, buildProduct({ externalId: "3000" })];

    expect(findMatchingProduct(candidates, "2000")).toEqual(target);
  });

  it("일치하는 상품이 없으면 null을 반환한다", () => {
    const candidates = [buildProduct({ externalId: "1000" })];
    expect(findMatchingProduct(candidates, "9999")).toBeNull();
  });

  it("후보 목록이 비어 있으면 null을 반환한다", () => {
    expect(findMatchingProduct([], "1000")).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test scripts/lib/match.test.ts`
Expected: FAIL — `./match`를 찾을 수 없다는 에러

- [ ] **Step 3: 구현**

```typescript
// scripts/lib/match.ts
import type { ExternalProduct } from "@/types/product";

export function findMatchingProduct(candidates: ExternalProduct[], externalId: string): ExternalProduct | null {
  return candidates.find((candidate) => candidate.externalId === externalId) ?? null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test scripts/lib/match.test.ts`
Expected: PASS — 3개 테스트 모두 통과

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/match.ts scripts/lib/match.test.ts
git commit -m "test: 가격 갱신용 상품 매칭 유틸 추가"
```

---

### Task 4: 발굴 결과 → upsert 페이로드 변환 (`scripts/lib/discovery.ts`)

**Files:**
- Create: `scripts/lib/discovery.ts`
- Test: `scripts/lib/discovery.test.ts`

**Interfaces:**
- Consumes: `ExternalProduct` (`src/types/product.ts`)
- Produces: `DiscoveryRow` 타입, `buildDiscoveryRows(products: ExternalProduct[], categorySlug: string, petType: string): DiscoveryRow[]` — Task 6이 사용

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// scripts/lib/discovery.test.ts
import { describe, expect, it } from "vitest";
import type { ExternalProduct } from "@/types/product";
import { buildDiscoveryRows } from "./discovery";

function buildProduct(overrides: Partial<ExternalProduct> = {}): ExternalProduct {
  return {
    externalId: "1000",
    title: "테스트 사료",
    brand: "테스트브랜드",
    category: "사료 > 건식",
    imageUrl: "https://example.com/a.jpg",
    productUrl: "https://example.com/a",
    mallName: "테스트몰",
    latestPrice: 10000,
    source: "NAVER",
    lastSyncedAt: "2026-07-15T00:00:00.000Z",
    ...overrides
  };
}

describe("buildDiscoveryRows", () => {
  it("상품을 upsert 행으로 변환하고 카테고리/펫타입을 채운다", () => {
    const rows = buildDiscoveryRows([buildProduct()], "food", "dog");

    expect(rows).toEqual([
      {
        source: "NAVER",
        external_id: "1000",
        title: "테스트 사료",
        brand: "테스트브랜드",
        category: "사료 > 건식",
        image_url: "https://example.com/a.jpg",
        product_url: "https://example.com/a",
        mall_name: "테스트몰",
        latest_price: 10000,
        raw_data: buildProduct(),
        last_synced_at: "2026-07-15T00:00:00.000Z",
        is_tracked: true,
        category_slug: "food",
        pet_type: "dog"
      }
    ]);
  });

  it("가격이 0 이하인 상품은 제외한다", () => {
    const rows = buildDiscoveryRows([buildProduct({ latestPrice: 0 })], "food", "dog");
    expect(rows).toHaveLength(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test scripts/lib/discovery.test.ts`
Expected: FAIL — `./discovery`를 찾을 수 없다는 에러

- [ ] **Step 3: 구현**

```typescript
// scripts/lib/discovery.ts
import type { ExternalProduct } from "@/types/product";

export type DiscoveryRow = {
  source: ExternalProduct["source"];
  external_id: string;
  title: string;
  brand: string | null;
  category: string;
  image_url: string;
  product_url: string;
  mall_name: string;
  latest_price: number;
  raw_data: ExternalProduct;
  last_synced_at: string;
  is_tracked: true;
  category_slug: string;
  pet_type: string;
};

export function buildDiscoveryRows(products: ExternalProduct[], categorySlug: string, petType: string): DiscoveryRow[] {
  return products
    .filter((product) => product.latestPrice > 0)
    .map((product) => ({
      source: product.source,
      external_id: product.externalId,
      title: product.title,
      brand: product.brand,
      category: product.category,
      image_url: product.imageUrl,
      product_url: product.productUrl,
      mall_name: product.mallName,
      latest_price: product.latestPrice,
      raw_data: product,
      last_synced_at: product.lastSyncedAt,
      is_tracked: true,
      category_slug: categorySlug,
      pet_type: petType
    }));
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test scripts/lib/discovery.test.ts`
Expected: PASS — 2개 테스트 모두 통과

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/discovery.ts scripts/lib/discovery.test.ts
git commit -m "test: 발굴 상품 upsert 변환 유틸 추가"
```

---

### Task 5: 시드 키워드 설정 (`scripts/seeds.ts`)

**Files:**
- Create: `scripts/seeds.ts`

**Interfaces:**
- Produces: `CategorySlug` 타입(`"food" | "snack" | "pad" | "litter" | "shampoo" | "supplement" | "toy" | "house"`), `SeedCategory` 타입, `seedCategories: SeedCategory[]` — Task 6이 순회하며 사용. 프론트엔드 플랜의 카탈로그 필터 카테고리 목록과 슬러그를 동일하게 맞춰야 한다(§5 IA 참고).

시드 키워드는 순수 데이터 파일이라 단위 테스트 대상이 아니다(§7 범위 밖). TypeScript 컴파일이 통과하면 충분하다.

- [ ] **Step 1: 파일 작성**

```typescript
// scripts/seeds.ts
export type CategorySlug = "food" | "snack" | "pad" | "litter" | "shampoo" | "supplement" | "toy" | "house";

export type SeedCategory = {
  slug: CategorySlug;
  petType: "dog" | "cat" | "both";
  keywords: string[];
};

export const seedCategories: SeedCategory[] = [
  { slug: "food", petType: "dog", keywords: ["강아지 사료", "강아지 건식사료", "강아지 습식사료", "강아지 소형견 사료"] },
  { slug: "food", petType: "cat", keywords: ["고양이 사료", "고양이 건식사료", "고양이 습식사료"] },
  { slug: "snack", petType: "both", keywords: ["강아지 간식", "고양이 간식", "반려동물 트릿"] },
  { slug: "pad", petType: "dog", keywords: ["강아지 배변패드", "배변패드 대형"] },
  { slug: "litter", petType: "cat", keywords: ["고양이 모래", "고양이 벤토나이트 모래", "고양이 두부모래"] },
  { slug: "shampoo", petType: "both", keywords: ["강아지 샴푸", "고양이 샴푸"] },
  { slug: "supplement", petType: "both", keywords: ["강아지 영양제", "고양이 영양제", "반려동물 관절 영양제", "반려동물 피부 영양제"] },
  { slug: "toy", petType: "both", keywords: ["강아지 장난감", "고양이 장난감"] },
  { slug: "house", petType: "both", keywords: ["반려동물 이동장", "강아지 하우스", "고양이 캣타워"] }
];
```

- [ ] **Step 2: 타입 체크로 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add scripts/seeds.ts
git commit -m "feat: 카탈로그 발굴용 시드 키워드 추가"
```

---

### Task 6: 수집 오케스트레이터 (`scripts/collect-prices.ts`)

**Files:**
- Create: `scripts/lib/supabase-admin.ts`
- Create: `scripts/collect-prices.ts`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Consumes: `searchShoppingProducts(query, options)` (`src/lib/naver-shopping.ts:24`), `seedCategories` (Task 5), `buildDiscoveryRows` (Task 4), `findMatchingProduct` (Task 3)
- Produces: `createAdminSupabaseClient()` — service-role Supabase 클라이언트 팩토리. CLI: `npm run collect`, `npm run collect:dry`

이 태스크는 실제 네이버/Supabase 자격증명이 있어야 완전히 검증되므로, 자동화된 단위 테스트 대신 `--dry-run` 수동 실행으로 검증한다(§7 "수집 스크립트 통합 검증은 `--dry-run`으로").

- [ ] **Step 1: service-role Supabase 클라이언트 작성**

```typescript
// scripts/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경 변수를 확인해주세요.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}
```

- [ ] **Step 2: 수집 오케스트레이터 작성**

```typescript
// scripts/collect-prices.ts
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
```

- [ ] **Step 3: `package.json`에 실행 스크립트 추가**

`scripts` 블록에 추가:

```json
"collect": "tsx scripts/collect-prices.ts",
"collect:dry": "tsx scripts/collect-prices.ts --dry-run"
```

- [ ] **Step 4: `.env.example`에 service-role 키 추가**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

NAVER_SHOPPING_CLIENT_ID=
NAVER_SHOPPING_CLIENT_SECRET=

SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 5: `README.md` 환경 변수 섹션에 설명 추가**

`README.md`의 환경 변수 목록(현재 `NAVER_SHOPPING_CLIENT_ID` 등을 나열하는 부분)에 다음 항목과 실행 안내를 추가한다:

```markdown
- `SUPABASE_SERVICE_ROLE_KEY`: 가격 수집 스크립트(`npm run collect`)가 사용하는 Supabase service-role 키. 브라우저에 노출되지 않도록 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

## 가격 수집

카탈로그 발굴과 가격 갱신은 `scripts/collect-prices.ts`가 담당하며, GitHub Actions가 매일 자동 실행합니다.

```bash
npm run collect       # 실제 DB에 기록
npm run collect:dry   # API 호출·매칭만 수행, DB 기록 없음
```
```

- [ ] **Step 6: dry-run으로 수동 검증**

`.env.local`에 네이버 API 키와 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 채운 뒤 실행한다.

Run: `npm run collect:dry`
Expected: `[dry-run] 가격 수집을 시작합니다.`로 시작해 `발굴 N건 / 스냅샷 N건 / 매칭 실패 N건` 요약으로 종료(exit code 0). 자격증명이 아직 없다면 이 스텝은 자격증명이 채워지는 대로 실행하도록 남겨둔다.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/supabase-admin.ts scripts/collect-prices.ts package.json .env.example README.md
git commit -m "feat: 카탈로그 발굴·가격 갱신 수집 스크립트 추가"
```

---

### Task 7: GitHub Actions 일일 수집 워크플로

**Files:**
- Create: `.github/workflows/collect-prices.yml`

**Interfaces:**
- Consumes: `npm run collect`(Task 6), GitHub Secrets(`NAVER_SHOPPING_CLIENT_ID`, `NAVER_SHOPPING_CLIENT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)

- [ ] **Step 1: 워크플로 파일 작성**

```yaml
name: Collect prices

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch: {}

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm ci

      - run: npm run collect
        env:
          NAVER_SHOPPING_CLIENT_ID: ${{ secrets.NAVER_SHOPPING_CLIENT_ID }}
          NAVER_SHOPPING_CLIENT_SECRET: ${{ secrets.NAVER_SHOPPING_CLIENT_SECRET }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

- [ ] **Step 2: GitHub 리포 Secrets 등록 안내**

GitHub 리포 → Settings → Secrets and variables → Actions에서 아래 4개를 등록한다(실행 계정 권한 필요, 코드로 대신할 수 없는 수동 작업):
- `NAVER_SHOPPING_CLIENT_ID`
- `NAVER_SHOPPING_CLIENT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`(Supabase 대시보드 → Project Settings → API → `service_role` 키)

- [ ] **Step 3: 수동 실행으로 검증**

Secrets 등록 후 GitHub 리포 → Actions → "Collect prices" → "Run workflow"로 수동 트리거한다.
Expected: 워크플로가 초록색으로 완료되고, 로그 마지막 줄에 `발굴 N건 / 스냅샷 N건 / 매칭 실패 N건`이 출력된다.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/collect-prices.yml
git commit -m "ci: 매일 가격 수집을 실행하는 GitHub Actions 워크플로 추가"
```

---

### Task 8: 전체 검증

**Files:** 없음(검증만)

- [ ] **Step 1: 전체 테스트 실행**

Run: `npm run test`
Expected: PASS — Task 2~4에서 작성한 모든 테스트 통과 (13개)

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 린트**

Run: `npm run lint`
Expected: 에러 없음

이 태스크는 코드 변경이 없으므로 커밋하지 않는다. 실패가 있으면 해당 태스크로 돌아가 수정 후 그 태스크 커밋에 포함한다.
