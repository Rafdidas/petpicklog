# 상품 상세 페이지 통합 설계

- 날짜: 2026-07-23
- 상태: 승인됨 (구현 대기)

## 배경

현재 상품 상세 페이지가 두 라우트로 이원화되어 있다.

| 항목 | `/catalog/[id]` | `/products/[id]` |
|---|---|---|
| 렌더링 | 서버(SSR/ISR, `revalidate=3600`) | 클라이언트(`"use client"`) |
| SEO | title·description·JSON-LD(Product)·canonical 완비 | canonical만 |
| 데이터 소스 | 서버 `@/lib/catalog` | 브라우저 Supabase 직접 조회 |
| 가격 표시 | 14일 최고가·역대 최저가·하락률·차트 | 최신가·mall별 가격 기록 리스트 |
| 후기 | 없음 | 후기 목록·작성 폼·통계(별점/재구매율) |
| 진입점 | `PriceCard`(카탈로그 목록) | 실시간 검색, 관심상품 목록 |

두 라우트는 **동일 상품을 동일 식별자(`external_products.id`)로** 가리킨다. `product_price_stats` 뷰의 `external_product_id`, `price_histories`·`product_reviews`·`saved_products`의 `external_product_id`, `/products/[id]`의 라우트 파라미터가 모두 `external_products.id`다. 따라서 통합 시 ID 재매핑은 불필요하다.

핵심 제약: `product_price_stats` 뷰는 `is_tracked = true` **그리고** 가격 기록 ≥ 1건인 상품만 노출한다(`supabase/patches/004_catalog_tracking.sql`). 실시간 검색에서 `handleOpenDetail`로 열린 상품은 `is_tracked`를 켜지 않고 가격 기록도 넣지 않으므로 뷰에 나타나지 않는다. 현재 `/products/[id]`는 `external_products`를 직접 조회하므로 이런 미추적 상품도 보여준다.

## 목표

`/products/[id]`와 `/catalog/[id]`를 **`/catalog/[id]` 하나로 통합**한다. catalog의 SSR·SEO·차트 기반 위에 products의 후기 기능을 얹고, 추적 안 된 상품은 경자(gracefully degraded) 폴백으로 렌더한다.

### 확정된 설계 결정

1. **통합 대상 URL**: `/catalog/[id]` (SSR·SEO·JSON-LD·차트 보유, 이미 canonical & sitemap 포함). `/products/[id]`는 이곳으로 영구 리다이렉트.
2. **미추적 상품 처리**: 경자 폴백 렌더링. stats 있으면 전체 렌더, 없으면 `external_products` 원본으로 축약 렌더. `external_products` 행 자체가 없을 때만 404.
3. **후기 렌더링**: 서버 렌더 + JSON-LD 별점 집계(`aggregateRating`). 초기 목록/통계는 SSR HTML에 포함, 작성 폼·저장·낙관적 추가는 client 컴포넌트.
4. **가격 기록 표시**: 차트로 일원화. products의 mall별 리스트는 제거(차트가 상위 시각화).

## 상세 설계

### 1. 데이터 계층 — `src/lib/catalog.ts`에 추가

기존 `fetchProductStats(id)`, `fetchPriceHistory(id, limit)`는 재사용한다.

- `fetchExternalProduct(id)`: `external_products`에서 단일 행 조회(폴백용).
  - 반환 필드: `id, source, title, category, mall_name, product_url, image_url, latest_price, last_synced_at`.
  - 없으면 `null`.
- `fetchProductReviews(id)`: `product_reviews`를 `external_product_id`로 조회, `created_at` 내림차순.
  - 반환 필드: `id, user_id, rating, repurchase_intent, content, created_at`.
  - RLS: `reviews are readable` 정책이 `anon, authenticated`에 `using(true)`로 열려 있어 서버(anon 키) 조회 가능(`supabase/schema.sql:152`).

### 2. 통합 페이지 — `src/app/catalog/[id]/page.tsx`

`generateMetadata`와 본문 모두 다음 조회 로직을 공유한다(중복 조회 방지 위해 `cache()`로 감싼 헬퍼 사용).

```
const stats = await getProductStats(id);              // 뷰: 추적+기록 있는 상품만
const product = stats ? null : await fetchExternalProduct(id);  // 폴백
if (!stats && !product) notFound();                   // 진짜 없을 때만 404
```

공통 뷰 모델로 정규화한다. stats 경로와 폴백 경로가 같은 상세 카드 컴포넌트에 서로 다른 필드 집합을 넘긴다.

- **stats 경로 뷰 모델**: title, imageUrl, mallName, currentPrice, dropPct, maxPrice14d, minPriceAll, lastCheckedAt, productUrl, externalProductId, (선택) nearAllTimeLow.
- **폴백 경로 뷰 모델**: title, imageUrl, mallName, latest_price(→currentPrice), category, last_synced_at(→lastCheckedAt), product_url, id(→externalProductId). 14일/역대/하락률/근접 배지 없음.

본문 구성:

1. **상세 카드**
   - stats 있음: 하락률 배지, `14일 최고가 / 역대 최저가(+최저가 근접 배지) / 마지막 가격 확인` 메타.
   - 폴백: `카테고리 / 쇼핑몰 / 마지막 가격 확인` 메타.
   - 공통: 이미지, 출처, 제목, 가격, `SaveButtonClient`(재사용) + "구매하러 가기" 버튼, 가격 안내 문구.
2. **가격 기록 섹션**: `fetchPriceHistory(id, 60)` 결과가 ≥ 2 포인트면 `PriceChart`, 아니면 `EmptyState`. (폴백 상품도 기록이 쌓이면 자동으로 차트 노출)
3. **후기 섹션**: `reviews-section.tsx`(client)에 `initialReviews`, `externalProductId` 전달.

### 3. 후기 섹션 컴포넌트 — `src/app/catalog/[id]/reviews-section.tsx` (신설, client)

- `products/[id]/product-detail-client.tsx`의 후기 관련 UI/로직(통계 타일, 작성 폼, 목록, 저장 핸들러)을 이전.
- props: `initialReviews: ReviewRow[]`, `externalProductId: string`.
- 서버가 넘긴 `initialReviews`로 초기 상태 시드 → SSR HTML에 초기 목록이 포함되어 SEO 반영.
- 폼 제출 성공 시 로컬 상태에 낙관적 추가(현행 동작 유지). 인증/에러 처리 동일.
- stats/폴백 양쪽에서 동일 동작(외부 상품 id 기반).

### 4. JSON-LD 강화 — 통합 페이지

기존 `Product`(offers) 스키마 유지. 후기가 1건 이상이면 `aggregateRating` 추가.

```
aggregateRating: {
  "@type": "AggregateRating",
  ratingValue: <평균 별점, 소수 1자리>,
  reviewCount: <후기 수>
}
```

폴백 경로에서는 stats가 없으므로 `offers.price`는 `latest_price`, 최저가/최고가 관련 `additionalProperty`는 stats 경로에서만 채운다.

### 5. 라우트/컴포넌트 정리

- `src/app/products/[id]/page.tsx`: 본문을 `permanentRedirect('/catalog/${id}')`(308)로 축소. `generateMetadata` 불필요(리다이렉트).
- `src/app/products/[id]/product-detail-client.tsx`: 후기 UI 이전 후 **삭제**.
- `src/app/products/product-search-client.tsx`: `handleOpenDetail`의 `router.push('/products/${externalProductId}')` → `/catalog/${externalProductId}`.
- `src/app/saved/saved-products-client.tsx`(약 451행): `href={/products/${product.id}}` → `/catalog/${product.id}`.
- `/products`(실시간 검색 페이지)와 그 클라이언트는 **유지**. 상세가 아닌 별도 검색 기능이다.

## 테스트

- **데이터 계층**: `fetchExternalProduct`가 존재/부재 상품에 대해 올바른 값/`null`을 반환. `fetchProductReviews`가 정렬·필드 매핑을 지킴.
- **페이지 분기**: stats 있는 상품은 풀 렌더(차트·stats 메타), stats 없고 external_products만 있는 상품은 폴백 메타로 렌더, 둘 다 없으면 `notFound()`.
- **JSON-LD**: 후기 있는 상품에 `aggregateRating`이 포함되고 값이 정확. 후기 없으면 미포함.
- **리다이렉트**: `/products/[id]` 접근 시 `/catalog/[id]`로 308.
- **회귀**: `seo-metadata.test.ts`, `sitemap.test.ts` 통과 유지. 기존 catalog 상세의 SEO 메타 회귀 없음.
- 후기 폼 제출/낙관적 추가는 기존 동작을 이전하므로 수동 확인 또는 최소 스모크.

## 미해결/주의

- **ISR 지연**: 후기는 `revalidate=3600` 캐시라 새 방문자 기준 최대 1시간 지연 노출. 작성자 본인은 client 낙관적 추가로 즉시 반영. `aggregateRating`도 동일하게 최대 1시간 지연. 허용 가능한 트레이드오프로 판단.
- **폴백 상품의 canonical**: 폴백 경로도 canonical을 `/catalog/${id}`로 유지(리다이렉트 대상과 일치).
- 리다이렉트는 `next/navigation`의 `permanentRedirect`(308) 사용. 엄격히 301이 필요하면 `next.config` redirects로 전환 검토(현재는 308로 충분하다고 판단).

## 범위 밖

- `/products` 실시간 검색 UX 변경.
- 후기 페이지네이션, 정렬 옵션.
- 리뷰 이미지/좋아요 등 신규 기능.
- 쿠팡 파트너스 등 2차 가격 소스 매칭(별도 프로젝트).
