# petpick-log 전면 개편: 카탈로그 기반 가격추적 서비스

날짜: 2026-07-15
상태: 설계 확정 대기 (사용자 리뷰 전)

## 1. 개요 & 목표

현재 petpick-log는 네이버 쇼핑 API를 실시간으로 통과시키는 검색 UI로, 데이터가 축적되지 않아 차별점이 없다. instmoa.com(악기다모아)의 구조를 참고해 **자체 카탈로그 + 자동 가격 수집 + 급락 특가 피드**를 축으로 하는 가격추적 서비스로 피벗한다.

핵심 가치: 사용자 행동 없이도 매일 쌓이는 가격 히스토리 → "최근 14일 최고가 대비 하락" 피드와 상품별 가격 추이 차트가 재방문과 SEO 유입을 만든다.

기존 기능 처리: 동물병원 찾기·반려생활 가이드·관심상품·실시간 검색은 유지하되 보조 메뉴로 축소. 미사용 `products` 테이블은 건드리지 않는다.

## 2. 컨셉 & 비주얼 디자인

29CM 디자인 레퍼런스(사용자 제공 DESIGN.md) 기반의 **블랙&화이트 에디토리얼 커머스** 컨셉으로 전면 재스타일링한다. 현재의 그린 계열 토큰(`--platform-green` 등)과 장식적 스타일(그라데이션 orbit, 큰 그림자, 라운드 카드)을 걷어내고 플랫하고 절제된 시스템으로 교체한다.

### 디자인 토큰 (globals.scss 재작성)

- 색상: canvas `#ffffff`, ink `#000000`, muted `#5d5d5d`, ink-secondary `#303033`, ink-tertiary `#474747`, border `#dddddd`, accent `#ff4800`
- **accent는 가격 하락 정보 전용** — 하락률 텍스트(`-23%`)를 투명 배경 + 0px radius 텍스트로 표시. 필 배지 금지.
- 그림자: 없음(flat). 구분은 `1px solid #dddddd` 보더로.
- radius: 기본 0~4px, 칩 10px. 큰 라운드 카드 금지.
- 폰트: **Pretendard Variable** (`pretendard` npm 패키지, dynamic-subset).
- 타이포 대비가 시그니처: 히어로/섹션 타이틀은 크게(28~40px/700), 상품 메타데이터는 컴팩트하게 — 브랜드 11px/700, 상품명 12~13px/400, 가격 13~14px/700, 플래그(몰명·날짜) 10~11px/500.

### 컴포넌트 스타일

- 상품 카드: 배경 투명, 이미지 + 컴팩트 메타(브랜드/상품명/하락률·가격/몰명·수집일) 세로 스택. 보더·그림자 없는 리스트 아이템.
- 버튼: ghost-outline(흰 배경, 검정 텍스트, `#dddddd` 1px 보더, radius 4px) 기본. 주요 CTA는 검정 배경 + 흰 텍스트.
- 인풋: 흰 배경, `#dddddd` 1px 보더, radius 0~4px.
- 서비스 톤: "반려용품 가격을 기록하는 셀렉트샵" — 내비·메타는 간결하게, 히어로·가이드 카피는 에디토리얼하게.

### 재스타일링 범위

- 홈·카탈로그·상세·특가(신규 포함 4개 화면): 새 컨셉으로 완전 재설계.
- 관심상품·실시간 검색·병원·가이드·인증(기존 5개 화면): 새 토큰·컴포넌트 스타일 적용 수준의 재스타일(레이아웃 대개편은 하지 않음).
- Header: 로고 + 카탈로그·특가 중심 내비 + 보조 링크(실시간 검색·병원·가이드·관심상품·로그인)로 재구성.

## 3. 데이터 모델 (Supabase)

새 테이블 없이 기존 스키마 확장. 패치 파일 `supabase/patches/004_catalog_tracking.sql`로 적용.

### `external_products` 컬럼 추가

- `is_tracked boolean not null default false` — 카탈로그 편입 여부
- `category_slug text` — food / snack / pad / litter / shampoo / supplement / toy / house
- `pet_type text` — dog / cat / both
- 인덱스: `(is_tracked, category_slug)`

네이버 `productId`(`external_id`) + `source='NAVER'`가 카탈로그 식별자.

### `price_histories`

- 구조 그대로 일일 스냅샷 저장.
- `checked_date date not null default ((now() at time zone 'Asia/Seoul')::date)` 컬럼 추가(KST 기준 수집일). timestamptz→date 캐스팅은 immutable이 아니라 표현식 유니크 인덱스에 쓸 수 없으므로 컬럼으로 둔다.
- 같은 날 재실행 중복 방지: `(external_product_id, checked_date)` 부분 유니크 인덱스(`where external_product_id is not null`) 추가, 수집은 이 키로 upsert.

### `product_price_stats` 뷰 (신규)

추적 상품별로 계산: `current_price`(최신 스냅샷), `max_price_14d`(최근 14일 최고가), `drop_pct`(하락률, `(max_price_14d - current_price) / max_price_14d`), `min_price_all`(역대 최저가), `last_checked_at`. 급락 피드·카탈로그 목록·상세 페이지가 모두 이 뷰를 읽는다. 카탈로그 수백 개 규모에서는 일반 뷰로 충분(materialized 불필요).

### 시드 키워드

DB가 아닌 리포 내 설정 파일 `scripts/seeds.ts`로 관리. 카테고리 슬러그별 `{ keywords: string[], petType }` 목록. git으로 버전 관리, 관리 화면 불필요.

### 권한

수집 스크립트는 service-role 키 사용(RLS 우회) — 정책 변경 불필요. 앱 읽기는 기존 anon select 정책 그대로. 뷰는 `security_invoker`로 생성해 기반 테이블 정책을 따른다.

## 4. 수집 파이프라인

### `scripts/collect-prices.ts`

tsx로 실행, 기존 `src/lib/naver-shopping.ts` 재사용. 매일 2단계:

1. **발굴(discovery)**: `seeds.ts`의 카테고리별 시드 키워드로 네이버 검색(display=20, sort=sim) → 상위 결과를 `external_products`에 upsert(`is_tracked=true`, `category_slug`, `pet_type` 설정). 카탈로그가 자동으로 성장.
2. **갱신(refresh)**: `is_tracked=true` 전체 상품에 대해 상품명으로 재검색 → 결과에서 `productId` 일치 항목의 현재 최저가를 `price_histories`에 upsert. `productId` 불일치 시 그날 스냅샷 스킵하고 매칭 실패 카운트. (네이버 API는 ID 직접 조회 미지원 — 기존 관심상품 새로고침과 같은 제목 재검색 방식.)

- 호출량: 카탈로그 300개 기준 일 ~350콜(한도 25,000/일). 호출 간 150ms 대기.
- `--dry-run` 플래그: API 호출·매칭까지 수행하되 DB 기록 없이 요약만 출력.
- 실행 끝에 요약 로그: 발굴 n건 / 스냅샷 n건 / 매칭 실패 n건.
- npm 스크립트: `npm run collect`, `npm run collect:dry`.

### `.github/workflows/collect-prices.yml`

- 스케줄: 매일 00:00 UTC(09:00 KST) + `workflow_dispatch`(수동 실행).
- 단계: checkout → node 세팅 → `npm ci` → `npx tsx scripts/collect-prices.ts`.
- GitHub Secrets: `NAVER_SHOPPING_CLIENT_ID`, `NAVER_SHOPPING_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## 5. 페이지 구성 (IA)

| 경로 | 상태 | 내용 |
|---|---|---|
| `/` | 개편 | 검색 히어로(카탈로그 검색 연결) + 통계 배너(추적 상품 N개 · 가격 기록 N건 · 최근 수집일) + 급락 특가 상위 6 + 카테고리 타일 + 하단 보조 섹션(병원·가이드 링크) |
| `/catalog` | 신규 | 카탈로그 탐색 — 카테고리·펫타입·가격대 필터, 정렬(하락률/최저가/최신). 서버 컴포넌트 + URL 쿼리(searchParams) 기반, 페이지네이션 |
| `/catalog/[id]` | 신규 | 상품 상세 — 현재 최저가, 가격 추이 라인차트(자체 SVG, 외부 라이브러리 없음), 14일 최고 대비 하락 표시, 역대 최저가, 관심상품 저장(기존 `saved_products` 재사용), 네이버 구매 링크 |
| `/deals` | 신규 | 급락 특가 전체 — 하락률순, 카테고리 탭 |
| `/products` | 유지 | "실시간 검색"으로 리네이밍, 보조 배치 |
| `/saved` `/hospitals` `/guide` `/auth` | 유지 | 새 토큰으로 재스타일만 |

- 데이터 접근: 홈·`/catalog`·`/deals`·상세는 서버 컴포넌트에서 Supabase anon 클라이언트로 조회. 갱신 주기가 일 1회이므로 ISR(`revalidate: 3600`) 적용.
- SEO: `/catalog/[id]`에 `generateMetadata`(상품명·최저가) + JSON-LD `Product` 구조화 데이터.

## 6. 에러 처리

- 수집: 상품 단위 실패는 스킵 + 집계. 치명 오류(네이버 401/429 연속, Supabase 연결 실패)는 exit 1 → Actions 실패 알림(GitHub 이메일).
- 앱 빈 상태: 수집 데이터가 없는 초기 상태를 위한 빈 상태 UI — 홈 급락 섹션("아직 수집된 가격이 없어요"), `/catalog`, `/deals`, 상세 차트(스냅샷 1개 이하일 때 차트 대신 안내) 각각.
- API 키 없는 로컬: 카탈로그 계열 페이지는 DB만 있으면 동작. 실시간 검색(`/products`)은 기존 데모 데이터 동작 유지.

## 7. 테스트

- vitest 최소 구성 추가 (`npm run test`).
- 단위 테스트 대상(순수 로직으로 분리):
  - 하락률 계산·스탯 가공 (`src/lib/price-stats.ts`)
  - 재검색 결과 → 추적 상품 매칭 (`scripts/lib/match.ts` — productId 일치 판정)
  - 시드 → upsert 페이로드 변환
- 수집 스크립트 통합 검증은 `--dry-run`으로 실제 API 대상 수동 확인.

## 8. 이번 범위에서 제외 (2차 이후)

- 관심상품 가격하락 메일/푸시 알림
- 관심상품 목록의 하락 배지 강화
- 수동 큐레이션 관리 화면 (시드 파일로 대체)
- 브랜드·스펙 단위 필터(무게, 연령 등 — 네이버 데이터에 구조화 스펙이 없음)
- 커뮤니티·중고 연계
- 다크 테마
