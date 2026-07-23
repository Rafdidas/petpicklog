# 카탈로그 가격추적 프론트엔드 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** petpick-log 전체를 29CM 레퍼런스(사용자 제공 `DESIGN.md`) 기반의 블랙&화이트 에디토리얼 컨셉으로 재스타일링하고, 카탈로그·특가·상세 등 새 IA를 구현한다.

**Architecture:** SCSS를 토큰(`_tokens.scss`) + 컴포넌트/페이지별 partial로 재구성하고 `globals.scss`는 `@use` 집계 파일로만 남긴다. 새 페이지(`/catalog`, `/catalog/[id]`, `/deals`)는 서버 컴포넌트에서 `src/lib/catalog.ts`(신규, Supabase `product_price_stats` 뷰 조회)를 통해 데이터를 가져오고, 필터·정렬은 URL 쿼리 파라미터를 조작하는 얇은 클라이언트 컴포넌트로 구현한다.

**Tech Stack:** Next.js 16(App Router) / TypeScript / Sass / Pretendard Variable / Supabase(`@supabase/supabase-js`) / vitest(순수 함수만)

## Global Constraints

- 참조 스펙: `docs/superpowers/specs/2026-07-15-catalog-price-redesign-design.md` §2(컨셉·디자인), §5(페이지 구성)
- **선행 조건:** `docs/superpowers/plans/2026-07-15-catalog-price-redesign-backend.md`가 먼저 적용되어 있어야 한다 — 이 플랜은 그 플랜이 만드는 `external_products.category_slug`/`pet_type`/`is_tracked` 컬럼과 `public.product_price_stats` 뷰를 전제로 한다.
- 색상: canvas `#ffffff`, ink `#000000`, muted `#5d5d5d`, border `#dddddd`, accent `#ff4800`(가격 하락 전용, 필 배지 금지). 그림자 없음(flat). radius는 0~4px 기본, 칩/필 요소만 큰 radius.
- 폰트: Pretendard Variable(npm 패키지).
- 새 페이지(홈/카탈로그/상세/특가)는 완전 재설계, 기존 페이지(실시간 검색/관심상품/상품상세/병원/가이드/인증)는 새 토큰 기반 재스타일(레이아웃 구조는 유지).
- `price_histories`/`external_products` 테이블 컬럼명, `product_price_stats` 뷰 컬럼명은 backend 플랜 Task 1과 정확히 일치해야 한다: `external_product_id, title, category_slug, pet_type, mall_name, product_url, image_url, current_price, last_checked_at, max_price_14d, drop_pct, min_price_all`.

---

### Task 1: 디자인 토큰 + Pretendard 폰트

**Files:**
- Create: `src/app/styles/_tokens.scss`
- Modify: `src/app/styles/_typography.scss` (전체 교체)
- Delete: `src/app/styles/_color-token.scss`
- Modify: `src/app/layout.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: CSS 커스텀 프로퍼티 `--color-canvas`, `--color-ink`, `--color-muted`, `--color-ink-secondary`, `--color-ink-tertiary`, `--color-border`, `--color-accent`, `--font-sans`, `--space-*`, `--radius-*` — 이후 모든 partial이 `var(--color-*)` 등으로 소비한다. `.line-clamp-N` 유틸리티 클래스(상품 카드 제목 말줄임에 사용).

- [ ] **Step 1: Pretendard 설치**

```bash
npm install pretendard
```

- [ ] **Step 2: 기존 색상 토큰 파일 삭제**

```bash
rm src/app/styles/_color-token.scss
```

- [ ] **Step 3: 새 토큰 파일 작성**

```scss
// src/app/styles/_tokens.scss
:root {
  --color-canvas: #ffffff;
  --color-ink: #000000;
  --color-muted: #5d5d5d;
  --color-ink-secondary: #303033;
  --color-ink-tertiary: #474747;
  --color-border: #dddddd;
  --color-accent: #ff4800;

  --font-sans: "Pretendard Variable", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Malgun Gothic", sans-serif;

  --space-xs: 2px;
  --space-sm: 4px;
  --space-md: 8px;
  --space-base: 16px;
  --space-lg: 24px;
  --space-xl: 28px;

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-chip: 10px;
  --radius-full: 9999px;
}
```

- [ ] **Step 4: 타이포그래피 파일을 line-clamp 유틸리티만 남기고 정리**

```scss
// src/app/styles/_typography.scss
.line-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@for $i from 1 through 4 {
  .line-clamp-#{$i} {
    @extend .line-clamp;
    line-clamp: #{$i};
    -webkit-line-clamp: #{$i};
  }
}
```

- [ ] **Step 5: 루트 레이아웃에 폰트 임포트 + 메타데이터 갱신**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import Header from "@/components/Header";
import "./globals.scss";

export const metadata: Metadata = {
  title: "펫픽 | 반려용품 가격추적",
  description: "반려동물 용품의 가격을 매일 기록하고, 급락 특가와 가격 추이를 확인하는 가격추적 서비스입니다."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/styles/_tokens.scss src/app/styles/_typography.scss src/app/layout.tsx package.json package-lock.json
git rm src/app/styles/_color-token.scss
git commit -m "feat: 29CM 레퍼런스 기반 디자인 토큰과 Pretendard 폰트 적용"
```

---

### Task 2: 공통 베이스 스타일

**Files:**
- Create: `src/app/styles/_base.scss`
- Create: `src/app/globals.scss` (전체 교체)

**Interfaces:**
- Produces: `.button`(`--primary`/`--secondary`/`--ghost`/`--danger`), `.section-label`, `.page-heading`(+`&__copy`), `.notice`(+`--error`/`--success`), `.empty-state`, `.metric-grid`, `.search-bar`, `.filter-strip`(+`__item`, `__item--active`), `.result-summary`, 공통 `main` 레이아웃 — 이후 모든 페이지 partial이 이 클래스들을 재사용한다.

기존 `globals.scss`는 2600줄 넘게 중복된 레거시 규칙(같은 셀렉터가 파일 앞뒤에서 두 번 정의됨)을 포함하고 있었다. 전면 개편 대상이므로 파일을 통째로 새로 쓴다.

- [ ] **Step 1: 베이스 스타일 작성**

```scss
// src/app/styles/_base.scss
* {
  box-sizing: border-box;
}

html {
  background: var(--color-canvas);
}

body {
  margin: 0;
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.5;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

img {
  display: block;
  max-width: 100%;
}

main {
  display: block;
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 40px 0 96px;
}

.section-label {
  display: inline-block;
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-muted);
  text-transform: uppercase;
}

.page-heading {
  padding: 0 0 32px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--color-border);

  h1 {
    margin: 0 0 12px;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.3;
  }

  &__copy {
    margin: 0;
    max-width: 640px;
    color: var(--color-muted);
    font-size: 15px;
    line-height: 1.6;
  }
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--color-ink);
    color: var(--color-canvas);
    border-color: var(--color-ink);

    &:hover:not(:disabled) {
      opacity: 0.85;
    }
  }

  &--secondary {
    background: var(--color-canvas);
    color: var(--color-ink);
    border-color: var(--color-border);

    &:hover:not(:disabled) {
      border-color: var(--color-ink);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--color-muted);
    border-color: var(--color-border);

    &:hover:not(:disabled) {
      color: var(--color-ink);
      border-color: var(--color-ink);
    }
  }

  &--danger {
    background: var(--color-canvas);
    color: var(--color-accent);
    border-color: var(--color-border);

    &:hover:not(:disabled) {
      border-color: var(--color-accent);
    }
  }
}

.notice {
  margin: 16px 0 0;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;

  &--error {
    background: #fff5f0;
    color: var(--color-accent);
    border: 1px solid var(--color-accent);
  }

  &--success {
    background: #f4f4f4;
    color: var(--color-ink);
    border: 1px solid var(--color-border);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 48px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-muted);
  font-size: 14px;

  p {
    margin: 0;
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  margin: 24px 0;
  border: 1px solid var(--color-border);
  background: var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;

  article {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: var(--color-canvas);

    span {
      font-size: 11px;
      color: var(--color-muted);
    }

    strong {
      font-size: 18px;
      font-weight: 700;
    }
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  label {
    display: none;
  }

  input {
    flex: 1;
    height: 40px;
    padding: 0 12px;
    border: none;
    background: transparent;
    font-size: 14px;

    &:focus {
      outline: none;
    }
  }
}

.filter-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;

  &__item {
    height: 36px;
    padding: 0 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-canvas);
    color: var(--color-muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &--active {
      background: var(--color-ink);
      color: var(--color-canvas);
      border-color: var(--color-ink);
    }
  }
}

.result-summary {
  margin: 0 0 16px;
  color: var(--color-muted);
  font-size: 13px;
}
```

- [ ] **Step 2: `globals.scss`를 집계 파일로 재작성**

```scss
// src/app/globals.scss
@use "./styles/tokens";
@use "./styles/typography";
@use "./styles/base";
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run dev` 실행 후 `http://localhost:3000`을 열어 콘솔에 Sass 컴파일 에러가 없는지 확인한다(페이지 내용은 아직 기존 클래스명 기준으로 스타일 없이 보일 수 있음 — 이후 태스크에서 페이지별 partial을 추가하며 해결됨).

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/app/styles/_base.scss src/app/globals.scss
git commit -m "feat: 공통 베이스 스타일(버튼/노티스/필터/서치바) 추가"
```

---

### Task 3: 헤더 재설계

**Files:**
- Modify: `src/components/Header.tsx` (전체 교체)
- Create: `src/app/styles/_header.scss`
- Modify: `src/app/globals.scss`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient` (`src/lib/supabase/client.ts:3`)
- Produces: 헤더 네비게이션에 `/catalog`, `/deals` 링크(아직 라우트가 없어 임시로 404이며 Task 5·7에서 채워진다)

- [ ] **Step 1: Header 컴포넌트 재작성**

```tsx
// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(() => !supabase);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const loginHref = `/auth?redirect=${encodeURIComponent(pathname || "/catalog")}`;

  return (
    <header className="header">
      <div className="header--inner">
        <Link className="header--inner__logo" href="/">
          <span className="header--inner__logo-mark" aria-hidden="true">P</span>
          <strong>펫픽</strong>
          <small>가격추적</small>
        </Link>
        <nav className="header--inner__nav" aria-label="주요 메뉴">
          <Link className="header--inner__nav-primary" href="/catalog">카탈로그</Link>
          <Link className="header--inner__nav-primary" href="/deals">급락 특가</Link>
          <Link href="/products">실시간 검색</Link>
          <Link href="/hospitals">동물병원</Link>
          <Link href="/guide">가이드</Link>
          <Link href="/saved">관심상품</Link>
          {isReady && user ? (
            <button className="header--inner__nav-button" type="button" onClick={handleSignOut}>
              로그아웃
            </button>
          ) : (
            <Link className="header--inner__auth-link--signup" href={loginHref}>
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 헤더 스타일 작성**

```scss
// src/app/styles/_header.scss
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-canvas);
  border-bottom: 1px solid var(--color-border);

  &--inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: min(1120px, calc(100% - 32px));
    height: 64px;
    margin: 0 auto;

    &__logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 700;

      small {
        color: var(--color-muted);
        font-size: 11px;
        font-weight: 500;
      }
    }

    &__logo-mark {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: var(--color-ink);
      color: var(--color-canvas);
      font-size: 14px;
      font-weight: 700;
    }

    &__nav {
      display: flex;
      align-items: center;
      gap: 24px;
      font-size: 14px;
      font-weight: 500;

      a {
        color: var(--color-muted);

        &:hover {
          color: var(--color-ink);
        }
      }
    }

    &__nav-primary {
      color: var(--color-ink) !important;
      font-weight: 700;
    }

    &__nav-button {
      background: none;
      border: none;
      padding: 0;
      color: var(--color-muted);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;

      &:hover {
        color: var(--color-ink);
      }
    }

    &__auth-link--signup {
      color: var(--color-ink) !important;
      font-weight: 700;
    }
  }
}

@media (max-width: 720px) {
  .header--inner__nav {
    gap: 14px;
    font-size: 12px;
  }
}
```

- [ ] **Step 3: globals.scss에 추가**

```scss
// src/app/globals.scss
@use "./styles/tokens";
@use "./styles/typography";
@use "./styles/base";
@use "./styles/header";
```

- [ ] **Step 4: 시각 확인**

Run: `npm run dev`
Expected: 헤더가 흰 배경 + 검정 텍스트 + 얇은 보더로 렌더링되고, "카탈로그"/"급락 특가" 링크가 굵게 표시된다(클릭 시 아직 404 — 정상, Task 5/7에서 해결).

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx src/app/styles/_header.scss src/app/globals.scss
git commit -m "feat: 카탈로그 중심 헤더 내비게이션 재설계"
```

---

### Task 4: 서버 Supabase 클라이언트 + 카탈로그 데이터 모듈 + 홈 재설계

**Files:**
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/price-stats.ts` 확장 없음(백엔드 플랜에서 이미 생성됨 — import만)
- Create: `src/lib/catalog.ts`
- Create: `src/components/PriceCard.tsx`
- Create: `src/app/styles/_catalog.scss`
- Modify: `src/app/page.tsx` (전체 교체)
- Delete: `src/app/home-dashboard-client.tsx`
- Modify: `src/app/globals.scss`

**Interfaces:**
- Consumes: `ProductPriceStats` 타입, `formatDropLabel` (`src/lib/price-stats.ts` — backend 플랜 Task 2), `formatPrice`/`formatCheckedAt` (`src/lib/format.ts:1,18`)
- Produces: `createServerSupabaseClient()`, `fetchTopDrops(limit)`, `fetchCatalogSummary()`, `<PriceCard stats={ProductPriceStats} />` — Task 5·6·7이 `catalog.ts`에 함수를 추가하고 `PriceCard`/`.card-grid`를 재사용한다.

- [ ] **Step 1: 서버용 Supabase 클라이언트 작성**

```typescript
// src/lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return null;
  }

  return createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false }
  });
}
```

- [ ] **Step 2: 카탈로그 데이터 모듈 작성**

```typescript
// src/lib/catalog.ts
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
```

- [ ] **Step 3: 공용 상품 카드 컴포넌트 작성**

```tsx
// src/components/PriceCard.tsx
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { formatDropLabel } from "@/lib/price-stats";
import type { ProductPriceStats } from "@/lib/price-stats";

export default function PriceCard({ stats }: { stats: ProductPriceStats }) {
  const dropLabel = formatDropLabel(stats.dropPct);

  return (
    <Link className="price-card" href={`/catalog/${stats.externalProductId}`}>
      {stats.imageUrl ? (
        <Image src={stats.imageUrl} alt="" width={240} height={180} />
      ) : (
        <div className="price-card__image" />
      )}
      <div className="price-card__body">
        {dropLabel ? <strong className="price-card__drop">{dropLabel}</strong> : null}
        <span className="price-card__name line-clamp-2">{stats.title}</span>
        <em className="price-card__price">{formatPrice(stats.currentPrice)}</em>
        <small className="price-card__meta">{stats.mallName ?? "쇼핑몰 확인 필요"}</small>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: 카탈로그 카드/그리드 스타일 작성**

```scss
// src/app/styles/_catalog.scss
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.price-card {
  display: flex;
  flex-direction: column;
  gap: 8px;

  img,
  &__image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius-md);
    background: #f4f4f4;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__drop {
    font-size: 13px;
    font-weight: 700;
    font-style: normal;
    color: var(--color-accent);
  }

  &__name {
    font-size: 13px;
    font-weight: 400;
    color: var(--color-ink);
  }

  &__price {
    font-size: 15px;
    font-weight: 700;
    font-style: normal;
  }

  &__meta {
    font-size: 11px;
    color: var(--color-muted);
  }
}
```

- [ ] **Step 5: 홈 페이지 재작성**

```tsx
// src/app/page.tsx
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import { fetchCatalogSummary, fetchTopDrops } from "@/lib/catalog";
import { formatCheckedAt } from "@/lib/format";

const categories = [
  { slug: "food", label: "사료" },
  { slug: "snack", label: "간식" },
  { slug: "pad", label: "배변패드" },
  { slug: "litter", label: "고양이 모래" },
  { slug: "shampoo", label: "샴푸·위생용품" },
  { slug: "supplement", label: "영양제" },
  { slug: "toy", label: "장난감" },
  { slug: "house", label: "하우스·이동장" }
];

export const revalidate = 3600;

export default async function HomePage() {
  const [summary, topDrops] = await Promise.all([fetchCatalogSummary(), fetchTopDrops(6)]);

  return (
    <main className="home">
      <section className="home-hero">
        <p className="section-label">가격추적 카탈로그</p>
        <h1>반려용품 최저가를<br />매일 기록합니다.</h1>
        <p>등록된 상품의 가격을 매일 확인해 최근 14일 최고가 대비 하락한 상품을 모아 보여드려요.</p>
        <form className="home-hero__search" action="/catalog">
          <span aria-hidden="true">⌕</span>
          <input name="query" aria-label="상품 검색어" placeholder="강아지 사료, 고양이 모래, 배변패드 검색" />
          <button className="button button--primary" type="submit">검색</button>
        </form>
      </section>

      <section className="home-stats" aria-label="카탈로그 현황">
        <article>
          <span>추적 상품</span>
          <strong>{summary.trackedCount.toLocaleString("ko-KR")}개</strong>
        </article>
        <article>
          <span>가격 기록</span>
          <strong>{summary.historyCount.toLocaleString("ko-KR")}건</strong>
        </article>
        <article>
          <span>최근 수집</span>
          <strong>{summary.lastCollectedAt ? formatCheckedAt(summary.lastCollectedAt) : "수집 전"}</strong>
        </article>
      </section>

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <p className="section-label">급락 특가</p>
            <h2>최근 가격이 내려간 상품</h2>
          </div>
          <Link href="/deals">전체 보기 <span aria-hidden="true">›</span></Link>
        </div>
        {topDrops.length ? (
          <div className="card-grid">
            {topDrops.map((stats) => (
              <PriceCard stats={stats} key={stats.externalProductId} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>아직 수집된 가격이 없어요. 매일 자동 수집이 시작되면 이곳에 급락 특가가 표시됩니다.</p>
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__heading">
          <div>
            <p className="section-label">카테고리</p>
            <h2>카테고리로 둘러보기</h2>
          </div>
        </div>
        <div className="category-tiles">
          {categories.map((category) => (
            <Link href={`/catalog?category=${category.slug}`} key={category.slug}>
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="home-links">
        <Link className="home-links__card" href="/hospitals">
          <strong>동물병원 찾기</strong>
          <p>공공데이터 기반으로 우리 동네 동물병원을 확인하세요.</p>
        </Link>
        <Link className="home-links__card" href="/guide">
          <strong>반려생활 가이드</strong>
          <p>사료, 위생, 건강 관리에 필요한 정보를 확인하세요.</p>
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: 홈 히어로/섹션 스타일 작성**

`src/app/styles/_catalog.scss` 하단에 이어서 추가한다:

```scss
.home-hero {
  padding: 64px 0 40px;
  border-bottom: 1px solid var(--color-border);

  h1 {
    margin: 16px 0;
    font-size: 40px;
    font-weight: 700;
    line-height: 1.3;
  }

  p {
    margin: 0 0 24px;
    max-width: 560px;
    color: var(--color-muted);
    font-size: 15px;
    line-height: 1.6;
  }

  &__search {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 560px;
    padding: 4px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);

    input {
      flex: 1;
      height: 44px;
      padding: 0 12px;
      border: none;
      background: transparent;
      font-size: 14px;

      &:focus {
        outline: none;
      }
    }
  }
}

.home-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin: 32px 0;
  border: 1px solid var(--color-border);
  background: var(--color-border);

  article {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 20px;
    background: var(--color-canvas);

    span {
      font-size: 11px;
      color: var(--color-muted);
    }

    strong {
      font-size: 20px;
      font-weight: 700;
    }
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.home-section {
  margin: 56px 0;

  &__heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 20px;

    h2 {
      margin: 4px 0 0;
      font-size: 22px;
      font-weight: 700;
    }

    a {
      font-size: 13px;
      color: var(--color-muted);

      &:hover {
        color: var(--color-ink);
      }
    }
  }
}

.category-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 500;

    &:hover {
      border-color: var(--color-ink);
    }
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.home-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 56px;

  &__card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 24px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);

    strong {
      font-size: 16px;
      font-weight: 700;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--color-muted);
    }
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: 이전 대시보드 클라이언트 삭제**

```bash
rm src/app/home-dashboard-client.tsx
```

- [ ] **Step 8: globals.scss에 추가**

```scss
// src/app/globals.scss
@use "./styles/tokens";
@use "./styles/typography";
@use "./styles/base";
@use "./styles/header";
@use "./styles/catalog";
```

- [ ] **Step 9: 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음(`home-dashboard-client` 삭제로 인한 미사용 import 에러가 없는지 확인 — `page.tsx`가 더 이상 이를 import하지 않아야 함)

Run: `npm run dev` → `http://localhost:3000` 접속
Expected: 새 히어로/통계/급락 특가(빈 상태)/카테고리 타일/하단 링크 카드가 렌더링된다. Supabase에 아직 `is_tracked` 데이터가 없으면 "아직 수집된 가격이 없어요" 빈 상태가 보이는 것이 정상이다.

- [ ] **Step 10: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/catalog.ts src/components/PriceCard.tsx src/app/styles/_catalog.scss src/app/page.tsx src/app/globals.scss
git rm src/app/home-dashboard-client.tsx
git commit -m "feat: 카탈로그 데이터 모듈과 홈 페이지 재설계"
```

---

### Task 5: 카탈로그 탐색 페이지 (`/catalog`)

**Files:**
- Modify: `src/lib/catalog.ts` (함수 추가)
- Create: `src/app/catalog/page.tsx`
- Create: `src/app/catalog/catalog-filters-client.tsx`
- Modify: `src/app/styles/_catalog.scss`
- Modify: `src/app/globals.scss`(변경 없음 — Task 4에서 이미 `catalog` partial을 등록했으므로 이 태스크는 globals.scss를 건드리지 않는다)

**Interfaces:**
- Consumes: `PriceCard`(Task 4), `.card-grid`(Task 4), `mapStatsRow` 내부 사용
- Produces: `CatalogSort` 타입, `CatalogFilters` 타입, `fetchCatalogPage(filters): Promise<{ items: ProductPriceStats[]; total: number }>` — Task 7(특가 페이지)이 재사용

- [ ] **Step 1: `catalog.ts`에 목록 조회 함수 추가**

`src/lib/catalog.ts` 파일 끝에 추가한다:

```typescript
export type CatalogSort = "drop" | "price" | "recent";

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
  } else if (filters.sort === "recent") {
    query = query.order("last_checked_at", { ascending: false });
  } else {
    query = query.order("drop_pct", { ascending: false });
  }

  const { data, count } = await query.range(from, to);

  return { items: ((data ?? []) as StatsRow[]).map(mapStatsRow), total: count ?? 0 };
}
```

- [ ] **Step 2: 필터 클라이언트 컴포넌트 작성**

```tsx
// src/app/catalog/catalog-filters-client.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const petOptions = [
  { value: "", label: "전체" },
  { value: "dog", label: "강아지" },
  { value: "cat", label: "고양이" }
];

const sortOptions = [
  { value: "drop", label: "하락률순" },
  { value: "price", label: "낮은가격순" },
  { value: "recent", label: "최신순" }
];

const maxPriceOptions = [
  { value: "", label: "전체 가격대" },
  { value: "10000", label: "1만원 이하" },
  { value: "30000", label: "3만원 이하" },
  { value: "50000", label: "5만원 이하" },
  { value: "100000", label: "10만원 이하" }
];

export default function CatalogFiltersClient({ categories }: { categories: { slug: string; label: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "";
  const currentPet = searchParams.get("pet") ?? "";
  const currentSort = searchParams.get("sort") ?? "drop";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const [queryInput, setQueryInput] = useState(searchParams.get("query") ?? "");

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    router.push(`/catalog?${next.toString()}`);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam("query", queryInput.trim());
  }

  return (
    <div className="catalog-filters">
      <form className="catalog-filters__search" onSubmit={handleSearchSubmit}>
        <input
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="상품명 검색"
          aria-label="카탈로그 검색"
        />
        <button className="button button--ghost" type="submit">검색</button>
      </form>

      <div className="filter-strip" aria-label="카테고리 필터">
        <button
          className={currentCategory === "" ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
          type="button"
          onClick={() => updateParam("category", "")}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            className={currentCategory === category.slug ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
            key={category.slug}
            type="button"
            onClick={() => updateParam("category", category.slug)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="catalog-filters__row">
        <label>
          반려동물
          <select value={currentPet} onChange={(event) => updateParam("pet", event.target.value)}>
            {petOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          정렬
          <select value={currentSort} onChange={(event) => updateParam("sort", event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          가격대
          <select value={currentMaxPrice} onChange={(event) => updateParam("maxPrice", event.target.value)}>
            {maxPriceOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 카탈로그 목록 페이지 작성**

```tsx
// src/app/catalog/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import { fetchCatalogPage, type CatalogSort } from "@/lib/catalog";
import CatalogFiltersClient from "./catalog-filters-client";

export const revalidate = 3600;

const categories = [
  { slug: "food", label: "사료" },
  { slug: "snack", label: "간식" },
  { slug: "pad", label: "배변패드" },
  { slug: "litter", label: "고양이 모래" },
  { slug: "shampoo", label: "샴푸·위생용품" },
  { slug: "supplement", label: "영양제" },
  { slug: "toy", label: "장난감" },
  { slug: "house", label: "하우스·이동장" }
];

const PAGE_SIZE = 24;

type CatalogSearchParams = {
  query?: string;
  category?: string;
  pet?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

function toSort(value: string | undefined): CatalogSort {
  return value === "price" || value === "recent" ? value : "drop";
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const sort = toSort(params.sort);
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const { items, total } = await fetchCatalogPage({
    query: params.query,
    categorySlug: params.category,
    petType: params.pet,
    maxPrice,
    sort,
    page,
    pageSize: PAGE_SIZE
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="catalog-page">
      <section className="page-heading">
        <p className="section-label">카탈로그</p>
        <h1>추적 중인 반려용품을 둘러보세요.</h1>
        <p className="page-heading__copy">매일 수집된 가격 기록을 바탕으로 최저가와 하락률을 확인할 수 있어요.</p>
      </section>

      <Suspense>
        <CatalogFiltersClient categories={categories} />
      </Suspense>

      <p className="result-summary">총 {total.toLocaleString("ko-KR")}개 상품 · {page} / {totalPages} 페이지</p>

      {items.length ? (
        <section className="card-grid">
          {items.map((stats) => (
            <PriceCard stats={stats} key={stats.externalProductId} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <p>조건에 맞는 상품이 아직 없어요. 수집이 진행되면 이곳에 표시됩니다.</p>
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="페이지 이동">
          {page > 1 ? <Link href={{ pathname: "/catalog", query: { ...params, page: page - 1 } }}>이전</Link> : null}
          <span>{page} / {totalPages}</span>
          {page < totalPages ? <Link href={{ pathname: "/catalog", query: { ...params, page: page + 1 } }}>다음</Link> : null}
        </nav>
      ) : null}
    </main>
  );
}
```

- [ ] **Step 4: 필터/페이지네이션 스타일 추가**

`src/app/styles/_catalog.scss` 끝에 추가:

```scss
.catalog-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;

  &__search {
    display: flex;
    gap: 8px;
    max-width: 360px;

    input {
      flex: 1;
      height: 40px;
      padding: 0 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
    }
  }

  &__row {
    display: flex;
    gap: 16px;

    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: var(--color-muted);
    }

    select {
      height: 36px;
      padding: 0 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 13px;
      background: var(--color-canvas);
    }
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  font-size: 13px;

  a {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);

    &:hover {
      border-color: var(--color-ink);
    }
  }
}
```

- [ ] **Step 5: 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음

Run: `npm run dev` → `http://localhost:3000/catalog` 접속
Expected: 검색창·카테고리 필터·펫타입/정렬 셀렉트가 보이고, 필터 변경 시 URL 쿼리(`?category=food&sort=price`)가 바뀌며 페이지가 갱신된다. 헤더의 "카탈로그" 링크가 더 이상 404가 아니다.

- [ ] **Step 6: Commit**

```bash
git add src/lib/catalog.ts src/app/catalog/page.tsx src/app/catalog/catalog-filters-client.tsx src/app/styles/_catalog.scss
git commit -m "feat: 카탈로그 탐색 페이지(/catalog) 추가"
```

---

### Task 6: 카탈로그 상세 페이지 (`/catalog/[id]`) + 가격 추이 차트

**Files:**
- Modify: `src/lib/catalog.ts` (함수 추가)
- Create: `src/lib/price-chart.ts`
- Test: `src/lib/price-chart.test.ts`
- Create: `src/app/catalog/[id]/page.tsx`
- Create: `src/app/catalog/[id]/price-chart.tsx`
- Create: `src/app/catalog/[id]/save-button-client.tsx`
- Modify: `src/app/styles/_catalog.scss`

**Interfaces:**
- Consumes: `formatDropLabel`, `isNearAllTimeLow` (`src/lib/price-stats.ts`), `createBrowserSupabaseClient` (`src/lib/supabase/client.ts:3`)
- Produces: `buildLinePath(prices, width, height, padding?): string`, `fetchProductStats(id)`, `fetchPriceHistory(id, limit)`

- [ ] **Step 1: 차트 경로 계산 실패 테스트 작성**

```typescript
// src/lib/price-chart.test.ts
import { describe, expect, it } from "vitest";
import { buildLinePath } from "./price-chart";

describe("buildLinePath", () => {
  it("가격이 없으면 빈 문자열을 반환한다", () => {
    expect(buildLinePath([], 100, 50)).toBe("");
  });

  it("가격이 하나면 중앙을 가로지르는 수평선을 반환한다", () => {
    const path = buildLinePath([10000], 100, 50, 8);
    expect(path).toBe("M 8,25 L 92,25");
  });

  it("가격이 모두 같으면(range 0) 수평선을 반환한다", () => {
    const path = buildLinePath([10000, 10000], 100, 50, 8);
    expect(path.startsWith("M 8.0,25.0")).toBe(true);
    expect(path).toContain("L 92.0,25.0");
  });

  it("가격이 오르면 좌상단에서 우하단이 아니라 y가 감소하는 경로를 만든다(가격 상승 = 낮은 y)", () => {
    const path = buildLinePath([10000, 20000], 100, 60, 0);
    const [, secondPoint] = path.split(" L ");
    const y = Number(secondPoint.split(",")[1]);
    expect(y).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test src/lib/price-chart.test.ts`
Expected: FAIL — `./price-chart`를 찾을 수 없다는 에러

- [ ] **Step 3: 구현**

```typescript
// src/lib/price-chart.ts
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
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = prices.map((price, index) => {
    const x = padding + (index / (prices.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((price - min) / range) * innerHeight;
    return { x, y };
  });

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test src/lib/price-chart.test.ts`
Expected: PASS — 4개 테스트 모두 통과

- [ ] **Step 5: `catalog.ts`에 상세 조회 함수 추가**

`src/lib/catalog.ts` 끝에 추가:

```typescript
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
```

- [ ] **Step 6: 가격 차트 컴포넌트 작성**

```tsx
// src/app/catalog/[id]/price-chart.tsx
import { buildLinePath } from "@/lib/price-chart";
import type { PriceHistoryPoint } from "@/lib/catalog";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;

export default function PriceChart({ points }: { points: PriceHistoryPoint[] }) {
  const path = buildLinePath(points.map((point) => point.price), CHART_WIDTH, CHART_HEIGHT);

  return (
    <svg className="price-chart" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="가격 추이 차트">
      <path d={path} fill="none" stroke="#ff4800" strokeWidth={2} />
    </svg>
  );
}
```

- [ ] **Step 7: 관심상품 저장 버튼(클라이언트) 작성**

```tsx
// src/app/catalog/[id]/save-button-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function SaveButtonClient({ externalProductId, currentPrice }: { externalProductId: string; currentPrice: number }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function checkSaved() {
      if (!supabase) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data } = await supabase
        .from("saved_products")
        .select("id")
        .eq("user_id", user.id)
        .eq("external_product_id", externalProductId)
        .maybeSingle();

      setIsSaved(Boolean(data));
    }

    checkSaved();
  }, [externalProductId, supabase]);

  async function handleSave() {
    if (!supabase) {
      setNotice("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/auth?redirect=${encodeURIComponent(`/catalog/${externalProductId}`)}`;
      return;
    }

    setIsSaving(true);
    setNotice("");

    const { error } = await supabase.from("saved_products").insert({
      user_id: user.id,
      external_product_id: externalProductId,
      status: "WISHLIST",
      saved_price: currentPrice
    });

    setIsSaving(false);

    if (error) {
      setNotice(error.code === "23505" ? "이미 관심상품으로 저장한 상품입니다." : error.message);
      return;
    }

    setIsSaved(true);
  }

  if (isSaved) {
    return <Link className="button button--secondary" href="/saved">관심상품 보기</Link>;
  }

  return (
    <>
      <button className="button button--secondary" type="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "저장 중" : "관심상품 저장"}
      </button>
      {notice ? <p className="notice notice--error">{notice}</p> : null}
    </>
  );
}
```

- [ ] **Step 8: 상세 페이지 작성**

```tsx
// src/app/catalog/[id]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchPriceHistory, fetchProductStats } from "@/lib/catalog";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { formatDropLabel, isNearAllTimeLow } from "@/lib/price-stats";
import PriceChart from "./price-chart";
import SaveButtonClient from "./save-button-client";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const stats = await fetchProductStats(id);

  if (!stats) {
    return { title: "상품을 찾을 수 없습니다 | 펫픽" };
  }

  return {
    title: `${stats.title} 최저가 ${formatPrice(stats.currentPrice)} | 펫픽`,
    description: `${stats.title}의 최근 가격 추이와 최저가를 확인하세요.`
  };
}

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stats = await fetchProductStats(id);

  if (!stats) {
    notFound();
  }

  const history = await fetchPriceHistory(id, 60);
  const dropLabel = formatDropLabel(stats.dropPct);
  const nearAllTimeLow = isNearAllTimeLow(stats);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: stats.title,
    image: stats.imageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      price: stats.currentPrice,
      priceCurrency: "KRW",
      url: stats.productUrl
    }
  };

  return (
    <main className="catalog-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="catalog-detail">
        {stats.imageUrl ? (
          <Image src={stats.imageUrl} alt="" width={480} height={360} />
        ) : (
          <div className="catalog-detail__image" />
        )}
        <div className="catalog-detail__content">
          <p className="section-label">{stats.mallName ?? "쇼핑몰 확인 필요"}</p>
          <h1>{stats.title}</h1>
          <div className="catalog-detail__price-row">
            <strong>{formatPrice(stats.currentPrice)}</strong>
            {dropLabel ? <em className="catalog-detail__drop">{dropLabel}</em> : null}
          </div>
          <dl className="detail-list">
            <div><dt>14일 최고가</dt><dd>{formatPrice(stats.maxPrice14d)}</dd></div>
            <div><dt>역대 최저가</dt><dd>{formatPrice(stats.minPriceAll)}{nearAllTimeLow ? " · 최저가 근접" : ""}</dd></div>
            <div><dt>마지막 확인</dt><dd>{formatCheckedAt(stats.lastCheckedAt)}</dd></div>
          </dl>
          <div className="catalog-detail__actions">
            <a className="button button--primary" href={stats.productUrl} target="_blank" rel="noreferrer">구매하러 가기</a>
            <SaveButtonClient externalProductId={stats.externalProductId} currentPrice={stats.currentPrice} />
          </div>
          <p className="product-detail__notice">표시된 가격은 최근 수집된 가격이며, 실제 구매 가격은 쇼핑몰에서 달라질 수 있습니다.</p>
        </div>
      </section>

      <section className="detail-section">
        <div className="dashboard-section__heading">
          <div>
            <p className="section-label">가격 추이</p>
            <h2>최근 가격 기록</h2>
          </div>
        </div>
        {history.length >= 2 ? (
          <PriceChart points={history} />
        ) : (
          <div className="empty-state"><p>가격 기록이 더 쌓이면 추이 차트가 표시됩니다.</p></div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 9: 상세 페이지 스타일 추가**

`src/app/styles/_catalog.scss` 끝에 추가:

```scss
.catalog-detail {
  display: grid;
  grid-template-columns: 480px 1fr;
  gap: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--color-border);

  img,
  &__image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius-md);
    background: #f4f4f4;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.4;
    }
  }

  &__price-row {
    display: flex;
    align-items: baseline;
    gap: 12px;

    strong {
      font-size: 28px;
      font-weight: 700;
    }
  }

  &__drop {
    font-size: 16px;
    font-weight: 700;
    font-style: normal;
    color: var(--color-accent);
  }

  &__actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
  }

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

.price-chart {
  width: 100%;
  height: 160px;
}
```

- [ ] **Step 10: 검증**

Run: `npm run test`
Expected: PASS — 백엔드 플랜 테스트 + `price-chart.test.ts` 포함 전체 통과

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 11: Commit**

```bash
git add src/lib/catalog.ts src/lib/price-chart.ts src/lib/price-chart.test.ts src/app/catalog/[id] src/app/styles/_catalog.scss
git commit -m "feat: 카탈로그 상세 페이지와 가격 추이 차트 추가"
```

---

### Task 7: 급락 특가 페이지 (`/deals`)

**Files:**
- Create: `src/app/deals/page.tsx`
- Create: `src/app/deals/deals-tabs-client.tsx`

**Interfaces:**
- Consumes: `fetchCatalogPage` (Task 5), `PriceCard`/`.card-grid` (Task 4), `.filter-strip` (Task 2) — 새 CSS 없이 기존 클래스만 재사용한다.

- [ ] **Step 1: 카테고리 탭 클라이언트 컴포넌트 작성**

```tsx
// src/app/deals/deals-tabs-client.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function DealsTabsClient({ categories }: { categories: { slug: string; label: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  function handleSelect(slug: string) {
    router.push(slug ? `/deals?category=${slug}` : "/deals");
  }

  return (
    <div className="filter-strip" aria-label="카테고리 필터">
      <button
        className={current === "" ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
        type="button"
        onClick={() => handleSelect("")}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          className={current === category.slug ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
          key={category.slug}
          type="button"
          onClick={() => handleSelect(category.slug)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 특가 페이지 작성**

```tsx
// src/app/deals/page.tsx
import { Suspense } from "react";
import PriceCard from "@/components/PriceCard";
import { fetchCatalogPage } from "@/lib/catalog";
import DealsTabsClient from "./deals-tabs-client";

export const revalidate = 3600;

const categories = [
  { slug: "food", label: "사료" },
  { slug: "snack", label: "간식" },
  { slug: "pad", label: "배변패드" },
  { slug: "litter", label: "고양이 모래" },
  { slug: "shampoo", label: "샴푸·위생용품" },
  { slug: "supplement", label: "영양제" },
  { slug: "toy", label: "장난감" },
  { slug: "house", label: "하우스·이동장" }
];

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;

  const { items, total } = await fetchCatalogPage({
    categorySlug: category,
    minDropPct: 1,
    sort: "drop",
    page: 1,
    pageSize: 60
  });

  return (
    <main className="deals-page">
      <section className="page-heading">
        <p className="section-label">급락 특가</p>
        <h1>최근 14일 최고가 대비 가격이 내려간 상품</h1>
        <p className="page-heading__copy">하락폭이 큰 순서대로 모았어요. 카테고리로 좁혀볼 수 있어요.</p>
      </section>

      <Suspense>
        <DealsTabsClient categories={categories} />
      </Suspense>

      <p className="result-summary">총 {total.toLocaleString("ko-KR")}개</p>

      {items.length ? (
        <section className="card-grid">
          {items.map((stats) => (
            <PriceCard stats={stats} key={stats.externalProductId} />
          ))}
        </section>
      ) : (
        <div className="empty-state"><p>아직 급락 특가가 없어요. 수집이 진행되면 이곳에 표시됩니다.</p></div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음

Run: `npm run dev` → `http://localhost:3000/deals` 접속
Expected: 카테고리 탭과 급락 특가 카드 목록(또는 빈 상태)이 보인다. 헤더의 "급락 특가" 링크가 더 이상 404가 아니다.

- [ ] **Step 4: Commit**

```bash
git add src/app/deals
git commit -m "feat: 급락 특가 페이지(/deals) 추가"
```

---

### Task 8: 실시간 검색(`/products`) 재스타일 + 리네이밍

**Files:**
- Modify: `src/app/products/product-search-client.tsx` (문구만 수정)
- Create: `src/app/styles/_products.scss`
- Modify: `src/app/globals.scss`

**Interfaces:** 없음(기존 로직 유지, 시각/문구만 변경)

- [ ] **Step 1: 페이지 문구를 "실시간 검색" 포지셔닝으로 수정**

`src/app/products/product-search-client.tsx`의 `<section className="page-heading">` 블록을 다음으로 교체:

```tsx
      <section className="page-heading">
        <p className="section-label">실시간 검색</p>
        <h1>네이버 쇼핑에서 지금 이 순간 가격을 검색해보세요.</h1>
        <p className="page-heading__copy">카탈로그에 없는 상품은 이곳에서 실시간으로 검색할 수 있어요. 매일 자동으로 가격을 추적하는 상품은 <a href="/catalog">카탈로그</a>에서 확인하세요.</p>
      </section>
```

- [ ] **Step 2: 실시간 검색 페이지 스타일 작성**

```scss
// src/app/styles/_products.scss
.pet-search-panel {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  p {
    margin: 12px 0 0;
    font-size: 12px;
    color: var(--color-muted);
  }
}

.pet-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &__item {
    height: 32px;
    padding: 0 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-canvas);
    color: var(--color-muted);
    font-size: 12px;
    cursor: pointer;

    &--active {
      background: var(--color-ink);
      color: var(--color-canvas);
      border-color: var(--color-ink);
    }
  }
}

.pet-custom-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-muted);

  input {
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 13px;
  }
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 24px;

  &__item {
    height: 32px;
    padding: 0 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-canvas);
    font-size: 12px;
    cursor: pointer;

    &:hover {
      border-color: var(--color-ink);
    }
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.product-card {
  display: flex;
  flex-direction: column;
  gap: 8px;

  img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius-md);
    background: #f4f4f4;
  }

  &--body {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h2 {
      margin: 0;
      font-size: 13px;
      font-weight: 400;
    }

    p {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }

    small {
      font-size: 11px;
      color: var(--color-muted);
    }
  }

  &--meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--color-muted);
  }

  &--actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }
}
```

- [ ] **Step 3: globals.scss에 추가**

```scss
// src/app/globals.scss
@use "./styles/tokens";
@use "./styles/typography";
@use "./styles/base";
@use "./styles/header";
@use "./styles/catalog";
@use "./styles/products";
```

- [ ] **Step 4: 검증**

Run: `npm run dev` → `http://localhost:3000/products?query=강아지+사료` 접속
Expected: 검색바/펫필터/추천검색어/상품 그리드가 새 토큰(플랫, 보더 기반)으로 렌더링된다.

- [ ] **Step 5: Commit**

```bash
git add src/app/products/product-search-client.tsx src/app/styles/_products.scss src/app/globals.scss
git commit -m "style: 실시간 검색 페이지 재스타일 및 포지셔닝 문구 수정"
```

---

### Task 9: 관심상품(`/saved`) + 기존 상품 상세(`/products/[id]`) 재스타일

**Files:**
- Create: `src/app/styles/_saved.scss`
- Modify: `src/app/globals.scss`

**Interfaces:** 없음(기존 로직 유지, 시각만 변경)

- [ ] **Step 1: 스타일 작성**

```scss
// src/app/styles/_saved.scss
.saved-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.saved-item {
  display: grid;
  grid-template-columns: 160px 1fr auto;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  img,
  &__image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius-sm);
    background: #f4f4f4;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 6px;

    span {
      font-size: 11px;
      color: var(--color-muted);
    }

    h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }

    p {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--color-muted);
  }

  &__diff {
    font-weight: 700;
    font-style: normal;

    &--down {
      color: var(--color-accent);
    }

    &--up {
      color: var(--color-ink);
    }
  }

  &__status {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
    font-size: 12px;
    color: var(--color-muted);

    select {
      height: 32px;
      padding: 0 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  @media (max-width: 720px) {
    grid-template-columns: 96px 1fr;

    &__actions {
      grid-column: 1 / -1;
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
}

.saved-history {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;

  div {
    display: flex;
    justify-content: space-between;
    color: var(--color-muted);
  }
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  grid-column: 1 / -1;
  margin-top: 12px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--color-muted);
  }

  select,
  textarea {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 13px;
  }

  &__content {
    grid-column: 1 / -1;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &--detail {
    grid-column: unset;
  }
}

.product-detail {
  display: grid;
  grid-template-columns: 480px 1fr;
  gap: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--color-border);

  img,
  &__image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius-md);
    background: #f4f4f4;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
  }

  &__price {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }

  &__actions {
    display: flex;
    gap: 12px;
  }

  &__notice {
    margin: 0;
    font-size: 12px;
    color: var(--color-muted);
  }

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;

  div {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border);
    font-size: 13px;
  }

  dt {
    color: var(--color-muted);
  }

  dd {
    margin: 0;
    font-weight: 700;
  }
}

.detail-section {
  margin-top: 40px;

  .dashboard-section__heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16px;

    h2 {
      margin: 4px 0 0;
      font-size: 18px;
      font-weight: 700;
    }
  }
}

.history-list,
.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item,
.review-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;

  div {
    display: flex;
    justify-content: space-between;
  }

  small {
    color: var(--color-muted);
  }
}
```

- [ ] **Step 2: globals.scss에 추가**

```scss
// src/app/globals.scss
@use "./styles/tokens";
@use "./styles/typography";
@use "./styles/base";
@use "./styles/header";
@use "./styles/catalog";
@use "./styles/products";
@use "./styles/saved";
```

- [ ] **Step 3: 검증**

Run: `npm run dev` → `http://localhost:3000/saved` 및 로그인 후 저장한 상품의 `/products/[id]` 접속
Expected: 카드형 리스트/상세 레이아웃이 새 토큰으로 렌더링되고 가격 하락은 accent 색(`#ff4800`)으로 표시된다.

- [ ] **Step 4: Commit**

```bash
git add src/app/styles/_saved.scss src/app/globals.scss
git commit -m "style: 관심상품과 상품 상세 페이지 재스타일"
```

---

### Task 10: 동물병원(`/hospitals`) 재스타일

**Files:**
- Create: `src/app/styles/_hospitals.scss`
- Modify: `src/app/globals.scss`

**Interfaces:** 없음

- [ ] **Step 1: 스타일 작성**

```scss
// src/app/styles/_hospitals.scss
.hospital-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.hospital-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 11px;
    color: var(--color-muted);
  }

  strong {
    display: block;
    margin-bottom: 4px;
    font-size: 15px;
    font-weight: 700;
  }

  p {
    margin: 2px 0;
    font-size: 12px;
    color: var(--color-muted);

    small {
      color: var(--color-ink);
      font-weight: 500;
    }
  }

  &__phone {
    display: inline-block;
    margin-top: 6px;
    font-size: 12px;
    font-weight: 700;
  }
}
```

- [ ] **Step 2: globals.scss에 추가**

```scss
// src/app/globals.scss
@use "./styles/tokens";
@use "./styles/typography";
@use "./styles/base";
@use "./styles/header";
@use "./styles/catalog";
@use "./styles/products";
@use "./styles/saved";
@use "./styles/hospitals";
```

- [ ] **Step 3: 검증**

Run: `npm run dev` → `http://localhost:3000/hospitals` 접속
Expected: 검색바/지역 필터/병원 리스트가 새 토큰으로 렌더링된다.

- [ ] **Step 4: Commit**

```bash
git add src/app/styles/_hospitals.scss src/app/globals.scss
git commit -m "style: 동물병원 페이지 재스타일"
```

---

### Task 11: 가이드(`/guide`) 재스타일

**Files:**
- Create: `src/app/styles/_guide.scss`
- Modify: `src/app/globals.scss`

**Interfaces:** 없음

- [ ] **Step 1: 스타일 작성**

```scss
// src/app/styles/_guide.scss
.guide-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.guide-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  span {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-accent);
  }

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--color-muted);
    line-height: 1.5;
  }

  small {
    font-size: 11px;
    color: var(--color-muted);
  }
}

.guide-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 40px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  h2 {
    margin: 4px 0 0;
    font-size: 18px;
    font-weight: 700;
  }
}
```

- [ ] **Step 2: globals.scss에 추가**

```scss
// src/app/globals.scss
@use "./styles/tokens";
@use "./styles/typography";
@use "./styles/base";
@use "./styles/header";
@use "./styles/catalog";
@use "./styles/products";
@use "./styles/saved";
@use "./styles/hospitals";
@use "./styles/guide";
```

- [ ] **Step 3: 검증**

Run: `npm run dev` → `http://localhost:3000/guide` 접속
Expected: 가이드 카드 그리드와 하단 CTA가 새 토큰으로 렌더링된다.

- [ ] **Step 4: Commit**

```bash
git add src/app/styles/_guide.scss src/app/globals.scss
git commit -m "style: 가이드 페이지 재스타일"
```

---

### Task 12: 인증(`/auth`) 재스타일

**Files:**
- Create: `src/app/styles/_auth.scss`
- Modify: `src/app/globals.scss`

**Interfaces:** 없음

- [ ] **Step 1: 스타일 작성**

```scss
// src/app/styles/_auth.scss
.auth-page {
  display: flex;
  justify-content: center;
  padding-top: 64px;
}

.auth-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(360px, 100%);

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }

  &__switch {
    align-self: center;
    margin-top: 8px;
    padding: 0;
    background: none;
    border: none;
    color: var(--color-muted);
    font-size: 13px;
    text-decoration: underline;
    cursor: pointer;
  }
}

.auth-benefits {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;

  strong {
    margin-bottom: 4px;
  }

  span {
    color: var(--color-muted);
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 12px;
    color: var(--color-muted);
  }

  input {
    height: 44px;
    margin-bottom: 8px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 14px;
  }

  button {
    margin-top: 8px;
  }
}
```

- [ ] **Step 2: globals.scss에 추가(최종 형태)**

```scss
// src/app/globals.scss
@use "./styles/tokens";
@use "./styles/typography";
@use "./styles/base";
@use "./styles/header";
@use "./styles/catalog";
@use "./styles/products";
@use "./styles/saved";
@use "./styles/hospitals";
@use "./styles/guide";
@use "./styles/auth";
```

- [ ] **Step 3: 검증**

Run: `npm run dev` → `http://localhost:3000/auth` 접속
Expected: 로그인/회원가입 패널이 중앙 정렬된 카드로 새 토큰과 함께 렌더링된다.

- [ ] **Step 4: Commit**

```bash
git add src/app/styles/_auth.scss src/app/globals.scss
git commit -m "style: 인증 페이지 재스타일"
```

---

### Task 13: 전체 검증

**Files:** 없음(검증만)

- [ ] **Step 1: 전체 테스트**

Run: `npm run test`
Expected: PASS — 백엔드 플랜 테스트 + `price-chart.test.ts` 포함 전체 통과

- [ ] **Step 2: 타입 체크 + 린트 + 빌드**

Run: `npx tsc --noEmit`
Expected: 에러 없음

Run: `npm run lint`
Expected: 에러 없음

Run: `npm run build`
Expected: 빌드 성공(모든 라우트 정적/서버 렌더링 확인)

- [ ] **Step 3: 수동 QA 체크리스트**

`npm run dev` 상태에서 아래 경로를 모두 방문해 콘솔 에러 없이 렌더링되는지 확인한다:
- `/` — 히어로, 통계 배너, 급락 특가(또는 빈 상태), 카테고리 타일, 하단 링크 카드
- `/catalog` — 검색·필터·정렬·페이지네이션 동작
- `/catalog/[id]` — 실제 존재하는 `external_products.id`로 접속(데이터가 없으면 `notFound()`가 404 페이지로 연결되는지만 확인)
- `/deals` — 카테고리 탭 동작
- `/products` — 실시간 검색 정상 동작(기존 로직 그대로)
- `/saved`, `/hospitals`, `/guide`, `/auth` — 로그인 플로우 포함 정상 동작
- 모바일 폭(375px)에서 헤더/홈/카탈로그가 가로 스크롤 없이 렌더링되는지 확인

이 태스크는 코드 변경이 없으므로 커밋하지 않는다. 실패가 있으면 해당 태스크로 돌아가 수정 후 그 태스크의 후속 커밋으로 반영한다.
