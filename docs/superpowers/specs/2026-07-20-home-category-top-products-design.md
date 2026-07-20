# 메인 카테고리별 인기상품 섹션

날짜: 2026-07-20
상태: 설계 승인됨 (구현 전)

## 1. 개요 & 목표

메인 페이지 "카테고리로 둘러보기" 섹션의 카테고리 타일 아래에, 카테고리별 인기상품 8개를 보여주는 탭형 그리드를 추가한다.

- **인기 기준**: 현재 DB에 조회수·판매량 지표가 없으므로 `drop_pct`(최근 14일 최고가 대비 할인율) 상위를 인기상품으로 정의한다. 가격추적 서비스 컨셉과 일치한다.
- **UI 형태**: 카테고리 칩 탭 8개 + 선택된 카테고리의 상품 8개 그리드. 한 화면에 8개만 노출해 페이지 길이를 유지한다.
- **데이터 전략**: 서버에서 8개 카테고리 전체를 선로딩(ISR 1시간 캐시)하고, 탭 전환은 클라이언트에서 즉시 처리한다. API 라우트·스키마 변경 없음.

## 2. 데이터 레이어

[src/lib/catalog.ts](../../../src/lib/catalog.ts)에 함수 추가:

```ts
export type CategoryTopMap = Record<string, ProductPriceStats[]>;
export async function fetchCategoryTopDrops(limit: number): Promise<CategoryTopMap>;
```

- 8개 카테고리 slug 각각에 대해 `product_price_stats`를 `category_slug`로 필터, `drop_pct` 내림차순 정렬, `limit`(8)개 조회. `Promise.all` 병렬 실행.
- `fetchTopDrops`와 달리 `drop_pct > 0` 필터를 걸지 않는다 — 할인 중인 상품이 없는 카테고리도 비지 않게 하되, 할인 상품이 자연스럽게 상위에 온다.
- Supabase 미설정 시 빈 객체 `{}` 반환.
- ISR(`revalidate = 3600`) 덕분에 쿼리 8회는 시간당 1번만 실행된다.

## 3. 카테고리 정의 공유

현재 `categories` 배열(slug + label 8개)이 [src/app/page.tsx](../../../src/app/page.tsx) 안에 하드코딩되어 있다. 두 곳(페이지 타일 + 새 탭 컴포넌트)에서 쓰이게 되므로 `src/lib/categories.ts`로 추출한다:

```ts
export type Category = { slug: string; label: string };
export const categories: Category[]; // food, snack, pad, litter, shampoo, supplement, toy, house
```

page.tsx는 이 모듈을 import하도록 변경. 다른 화면(카탈로그 필터 등)에 이미 유사 정의가 있다면 구현 시 함께 통합을 검토하되, 이 스펙의 필수 범위는 page.tsx 추출까지다.

## 4. 컴포넌트

새 클라이언트 컴포넌트 `src/components/CategoryTopProducts.tsx`:

- props: `{ categories: Category[]; productsByCategory: CategoryTopMap }`
- `useState`로 선택된 카테고리 slug 관리. 기본값은 첫 카테고리(사료).
- 렌더링:
  - 칩 형태 탭 8개(가로 나열, 모바일에서 줄바꿈 허용). 선택된 탭은 검정 배경 + 흰 텍스트(기존 디자인 시스템의 주요 CTA 스타일), 나머지는 ghost-outline.
  - 선택된 카테고리의 상품을 기존 `card-grid` 클래스 그리드에 [PriceCard](../../../src/components/PriceCard.tsx) 재사용으로 표시 — 급락 특가 섹션과 룩 통일.
  - 그리드 하단에 `/catalog?category={slug}`로 가는 "OO 전체 보기 ›" 링크.
- 탭 마크업은 접근성을 위해 `role="tablist"`/`role="tab"`/`aria-selected` 사용.

## 5. 페이지 통합

[src/app/page.tsx](../../../src/app/page.tsx)의 `HomePage`:

- `Promise.all`에 `fetchCategoryTopDrops(8)` 추가 (기존 summary·topDrops와 병렬).
- "카테고리로 둘러보기" 섹션 내부, `category-tiles` 아래에 `<CategoryTopProducts />` 배치.
- 데이터 맵이 빈 객체(Supabase 미설정)면 탭 컴포넌트를 렌더링하지 않는다 — 타일만 남아 기존과 동일.

## 6. 엣지 케이스

- **상품 0개 카테고리**: 탭은 유지하고, 그리드 자리에 기존 `empty-state` 스타일로 "아직 추적 중인 상품이 없어요" 표시. 전체 보기 링크는 유지.
- **8개 미만 카테고리**: 있는 만큼만 그리드에 표시.
- **Supabase 미설정**: 섹션의 탭 부분 전체 미노출(위 5절).

## 7. 스타일

globals.scss(또는 기존 스타일 구조)에 탭 칩 스타일 추가. 디자인 토큰은 2026-07-15 개편 스펙을 따른다: 플랫, 보더 `#dddddd`, radius 칩 10px, 선택 상태는 검정 배경. 새 색상 토큰 추가 없음.

## 8. 테스트

기존 테스트 구성(구현 시 확인)에 맞춰:

- `fetchCategoryTopDrops`: 카테고리별 그룹핑·매핑, Supabase 미설정 시 빈 객체 반환.
- `CategoryTopProducts`: 기본 탭 렌더링, 탭 클릭 시 해당 카테고리 상품으로 전환, 빈 카테고리 empty-state 표시.
