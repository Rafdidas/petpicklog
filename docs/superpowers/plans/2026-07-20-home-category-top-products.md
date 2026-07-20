# 메인 카테고리별 인기상품 섹션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 "카테고리로 둘러보기" 타일 아래에 카테고리별 할인율 상위 8개 상품을 보여주는 클라이언트 탭 그리드를 추가한다.

**Architecture:** 서버 컴포넌트(HomePage)가 빌드/ISR 시점에 8개 카테고리의 상위 상품을 병렬 쿼리로 선로딩해 클라이언트 탭 컴포넌트에 내려준다. 탭 전환은 클라이언트 state만 바꾼다. 스키마 변경·API 라우트 없음.

**Tech Stack:** Next.js 16 (App Router, ISR revalidate 3600), Supabase(`product_price_stats` 뷰), Vitest(node 환경), SCSS.

**Spec:** `docs/superpowers/specs/2026-07-20-home-category-top-products-design.md`

## Global Constraints

- 테스트 환경은 vitest **node** 전용 — jsdom/@testing-library 추가 금지. 컴포넌트는 브라우저 검증으로 대체(기존 `deals-tabs-client.tsx`와 동일 관행).
- 새 색상 토큰·라이브러리 추가 금지. 탭은 기존 `filter-strip` 클래스, 그리드는 `card-grid`, 빈 상태는 `empty-state` 재사용.
- 카테고리 slug 8종: food, snack, pad, litter, shampoo, supplement, toy, house (라벨: 사료, 간식, 배변패드, 고양이 모래, 샴푸·위생용품, 영양제, 장난감, 하우스·이동장).
- `fetchCategoryTopDrops`는 `drop_pct > 0` 필터를 걸지 않는다(빈 카테고리 방지).
- 커밋 메시지는 한국어 관행(`feat:`, `refactor:` 접두사) 유지.

---

### Task 1: 카테고리 정의 공유 모듈 추출

3개 파일에 중복된 `categories` 배열을 `src/lib/categories.ts`로 통합한다. 순수 상수 추출이므로 단위 테스트는 없고, 기존 테스트·린트 통과로 검증한다.

**Files:**
- Create: `src/lib/categories.ts`
- Modify: `src/app/page.tsx:6-15` (categories 배열 제거, import로 대체)
- Modify: `src/app/catalog/page.tsx:9-18` (동일)
- Modify: `src/app/deals/page.tsx:8-17` (동일)

**Interfaces:**
- Produces: `export type Category = { slug: string; label: string }`, `export const categories: Category[]` — Task 2·3·4가 import.

- [ ] **Step 1: `src/lib/categories.ts` 생성**

```ts
export type Category = { slug: string; label: string };

export const categories: Category[] = [
  { slug: "food", label: "사료" },
  { slug: "snack", label: "간식" },
  { slug: "pad", label: "배변패드" },
  { slug: "litter", label: "고양이 모래" },
  { slug: "shampoo", label: "샴푸·위생용품" },
  { slug: "supplement", label: "영양제" },
  { slug: "toy", label: "장난감" },
  { slug: "house", label: "하우스·이동장" }
];
```

- [ ] **Step 2: 3개 페이지에서 로컬 배열 제거 후 import**

`src/app/page.tsx`, `src/app/catalog/page.tsx`, `src/app/deals/page.tsx` 각각에서 `const categories = [ ... ];` 블록(8개 항목 전체)을 삭제하고 import 구역에 추가:

```ts
import { categories } from "@/lib/categories";
```

다른 코드는 변경하지 않는다 — 세 파일 모두 `categories`를 같은 이름으로 사용 중이라 참조부는 그대로 동작한다.

- [ ] **Step 3: 검증**

Run: `npm run lint`
Expected: 에러 0
Run: `npm test`
Expected: 기존 테스트 전체 PASS
Run: `npx tsc --noEmit`
Expected: 타입 에러 0

- [ ] **Step 4: Commit**

```bash
git add src/lib/categories.ts src/app/page.tsx src/app/catalog/page.tsx src/app/deals/page.tsx
git commit -m "refactor: 카테고리 정의를 lib/categories로 통합"
```

---

### Task 2: fetchCategoryTopDrops 데이터 함수 (TDD)

카테고리별 `product_price_stats` 상위 N개를 병렬 조회해 `Record<slug, ProductPriceStats[]>`로 반환하는 함수를 `src/lib/catalog.ts`에 추가한다.

**Files:**
- Create: `src/lib/catalog.test.ts`
- Modify: `src/lib/catalog.ts` (함수 추가, `categories` import 추가)

**Interfaces:**
- Consumes: Task 1의 `categories` (`@/lib/categories`), 기존 `mapStatsRow`/`StatsRow`(catalog.ts 내부), `createServerSupabaseClient`(`@/lib/supabase/server`).
- Produces: `export type CategoryTopMap = Record<string, ProductPriceStats[]>`, `export async function fetchCategoryTopDrops(limit: number): Promise<CategoryTopMap>` — Task 4가 import. Supabase 미설정 시 `{}` 반환(키 자체가 없음), 정상 시 8개 slug 키 전부 존재.

- [ ] **Step 1: 실패하는 테스트 작성 — `src/lib/catalog.test.ts` 생성**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient
}));

import { fetchCategoryTopDrops } from "./catalog";

const foodRow = {
  external_product_id: "p1",
  title: "테스트 사료",
  category_slug: "food",
  pet_type: "dog",
  mall_name: "테스트몰",
  product_url: "https://example.com/p1",
  image_url: null,
  current_price: 10000,
  last_checked_at: "2026-07-20T00:00:00Z",
  max_price_14d: 12000,
  drop_pct: 17,
  min_price_all: 9000
};

function makeSupabaseMock(rowsBySlug: Record<string, unknown[]>) {
  return {
    from: () => {
      let slug = "";
      const query = {
        select: () => query,
        eq: (_column: string, value: string) => {
          slug = value;
          return query;
        },
        order: () => query,
        limit: () => Promise.resolve({ data: rowsBySlug[slug] ?? [] })
      };
      return query;
    }
  };
}

describe("fetchCategoryTopDrops", () => {
  beforeEach(() => {
    mocks.createServerSupabaseClient.mockReset();
  });

  it("Supabase 미설정 시 빈 객체를 반환한다", async () => {
    mocks.createServerSupabaseClient.mockReturnValue(null);

    expect(await fetchCategoryTopDrops(8)).toEqual({});
  });

  it("카테고리 slug별로 매핑된 상품 목록을 반환한다", async () => {
    mocks.createServerSupabaseClient.mockReturnValue(makeSupabaseMock({ food: [foodRow] }));

    const result = await fetchCategoryTopDrops(8);

    expect(Object.keys(result)).toHaveLength(8);
    expect(result.food).toHaveLength(1);
    expect(result.food[0]).toMatchObject({
      externalProductId: "p1",
      title: "테스트 사료",
      currentPrice: 10000,
      dropPct: 17
    });
    expect(result.toy).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/catalog.test.ts`
Expected: FAIL — `fetchCategoryTopDrops`가 export되지 않아 import/호출 시점 에러

- [ ] **Step 3: 구현 — `src/lib/catalog.ts`**

import 구역에 추가:

```ts
import { categories } from "@/lib/categories";
```

`fetchTopDrops` 함수 아래에 추가:

```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/catalog.test.ts`
Expected: PASS (2 tests)
Run: `npm test`
Expected: 전체 PASS (기존 테스트 회귀 없음)

- [ ] **Step 5: Commit**

```bash
git add src/lib/catalog.ts src/lib/catalog.test.ts
git commit -m "feat: 카테고리별 상위 할인 상품 조회 함수 추가"
```

---

### Task 3: CategoryTopProducts 클라이언트 컴포넌트 + 스타일

칩 탭 + PriceCard 그리드 클라이언트 컴포넌트. DOM 테스트 인프라가 없으므로(Global Constraints 참고) 이 태스크는 타입·린트로 검증하고 Task 4에서 브라우저로 동작 검증한다.

**Files:**
- Create: `src/components/CategoryTopProducts.tsx`
- Modify: `src/app/styles/_catalog.scss` (`.category-tiles` 블록 뒤에 `.category-top` 추가)

**Interfaces:**
- Consumes: Task 1의 `Category` 타입, Task 2의 `CategoryTopMap` 타입, 기존 `PriceCard`(`@/components/PriceCard`), `ProductPriceStats`(`@/lib/price-stats`), 기존 CSS 클래스 `filter-strip`/`filter-strip__item`/`filter-strip__item--active`/`card-grid`/`empty-state`.
- Produces: `export default function CategoryTopProducts({ categories, productsByCategory }: { categories: Category[]; productsByCategory: CategoryTopMap })` — Task 4가 import.

- [ ] **Step 1: `src/components/CategoryTopProducts.tsx` 생성**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import type { Category } from "@/lib/categories";
import type { CategoryTopMap } from "@/lib/catalog";

type Props = {
  categories: Category[];
  productsByCategory: CategoryTopMap;
};

export default function CategoryTopProducts({ categories, productsByCategory }: Props) {
  const [selected, setSelected] = useState(categories[0]?.slug ?? "");
  const selectedCategory = categories.find((category) => category.slug === selected);
  const items = productsByCategory[selected] ?? [];

  return (
    <div className="category-top">
      <div className="filter-strip" role="tablist" aria-label="카테고리별 인기상품">
        {categories.map((category) => (
          <button
            className={
              selected === category.slug ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"
            }
            key={category.slug}
            type="button"
            role="tab"
            aria-selected={selected === category.slug}
            onClick={() => setSelected(category.slug)}
          >
            {category.label}
          </button>
        ))}
      </div>
      {items.length ? (
        <div className="card-grid" role="tabpanel">
          {items.map((stats) => (
            <PriceCard stats={stats} key={stats.externalProductId} />
          ))}
        </div>
      ) : (
        <div className="empty-state" role="tabpanel">
          <p>아직 추적 중인 상품이 없어요.</p>
        </div>
      )}
      {selectedCategory ? (
        <Link className="category-top__more" href={`/catalog?category=${selectedCategory.slug}`}>
          {selectedCategory.label} 전체 보기 <span aria-hidden="true">›</span>
        </Link>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: `src/app/styles/_catalog.scss`의 `.category-tiles` 블록 닫는 중괄호 뒤에 스타일 추가**

```scss
.category-top {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;

  &__more {
    align-self: flex-end;
    font-size: 13px;
    color: var(--color-muted);

    &:hover {
      color: var(--color-ink);
    }
  }
}
```

- [ ] **Step 3: 검증**

Run: `npm run lint`
Expected: 에러 0
Run: `npx tsc --noEmit`
Expected: 타입 에러 0

- [ ] **Step 4: Commit**

```bash
git add src/components/CategoryTopProducts.tsx src/app/styles/_catalog.scss
git commit -m "feat: 카테고리별 인기상품 탭 컴포넌트 추가"
```

---

### Task 4: 메인 페이지 통합 + 브라우저 검증

HomePage에 데이터 로딩과 컴포넌트를 연결하고, 개발 서버에서 탭 동작을 실제로 확인한다.

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Task 1 `categories`, Task 2 `fetchCategoryTopDrops`, Task 3 `CategoryTopProducts`.

- [ ] **Step 1: `src/app/page.tsx` 수정**

import 추가:

```tsx
import CategoryTopProducts from "@/components/CategoryTopProducts";
```

`fetchCategoryTopDrops`를 catalog import에 추가:

```tsx
import { fetchCatalogSummary, fetchCategoryTopDrops, fetchTopDrops } from "@/lib/catalog";
```

데이터 로딩을 3개 병렬로 변경:

```tsx
const [summary, topDrops, categoryTop] = await Promise.all([
  fetchCatalogSummary(),
  fetchTopDrops(6),
  fetchCategoryTopDrops(8)
]);
```

"카테고리로 둘러보기" 섹션의 `</div>`(category-tiles 닫는 태그) 바로 뒤에 추가:

```tsx
{Object.keys(categoryTop).length ? (
  <CategoryTopProducts categories={categories} productsByCategory={categoryTop} />
) : null}
```

- [ ] **Step 2: 전체 테스트·타입·린트**

Run: `npm test`
Expected: 전체 PASS
Run: `npx tsc --noEmit`
Expected: 타입 에러 0
Run: `npm run lint`
Expected: 에러 0

- [ ] **Step 3: 브라우저 검증 (개발 서버)**

개발 서버를 띄우고(`.claude/launch.json`의 dev 설정, 없으면 `npm run dev` 기반으로 생성) 메인 페이지에서 확인:

1. "카테고리로 둘러보기" 타일 아래 탭 8개 렌더링, 첫 탭(사료) 활성 상태
2. 탭 클릭 시 해당 카테고리 상품으로 즉시 전환 (콘솔 에러 0)
3. 상품 없는 카테고리에서 "아직 추적 중인 상품이 없어요" 표시
4. "OO 전체 보기 ›" 클릭 시 `/catalog?category=<slug>` 이동
5. 모바일 뷰포트(375px)에서 탭 줄바꿈·그리드 확인
6. 스크린샷 캡처해 사용자에게 공유

- [ ] **Step 4: 프로덕션 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공, `/` 페이지 정적 생성(ISR) 에러 없음

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: 메인에 카테고리별 인기상품 섹션 노출"
```
