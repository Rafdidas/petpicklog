# AGENTS.md — 펫픽(PetPick)

AI 에이전트가 이 저장소에서 작업할 때 따르는 지침이다. 사람도 읽기 좋게 작성한다.

## 프로젝트 개요

펫픽은 **카탈로그 기반 반려용품 가격추적 서비스**다. instmoa.com(악기 가격비교 서비스)을 참고해, 사용자 행동 없이도 매일 자동으로 쌓이는 가격 히스토리 위에서 "급락 특가" 피드와 상품별 가격 추이를 보여주는 것이 핵심 훅이다. 실시간 검색은 카탈로그에 없는 상품을 위한 보조 기능으로 남아 있다.

- 목적: 실제 출시/운영 (포트폴리오 아님)
- 리텐션 훅: 급락 특가 피드(최근 14일 최고가 대비 하락) + 상품별 가격 추이 차트, 매일 자동 갱신(관심상품 저장 여부와 무관)

> 전체 설계는 단일 소스로 [docs/superpowers/specs/2026-07-15-catalog-price-redesign-design.md](docs/superpowers/specs/2026-07-15-catalog-price-redesign-design.md)를 따른다. 구현 계획은 [백엔드](docs/superpowers/plans/2026-07-15-catalog-price-redesign-backend.md)/[프론트엔드](docs/superpowers/plans/2026-07-15-catalog-price-redesign-frontend.md). 이 파일과 충돌하면 설계서가 우선이다.
>
> `docs/superpowers/specs/2026-06-29-petfit-redesign-design.md`(옛 "펫핏" 기획, `/pets` 프로필·큐레이션 추천 중심)는 **구현되지 않고 폐기됐다**. 참고하지 말 것.

## 기술 스택

Next.js 16 / React 19 / TypeScript / SCSS / Supabase / Vercel / vitest.
Tailwind·CSS Module은 **사용하지 않는다** (SCSS 유지).

## 실행 / 환경

```bash
npm install
npm run dev           # 개발 서버
npm run build         # 프로덕션 빌드
npm run lint           # eslint
npm run test           # vitest (순수 로직 단위 테스트)
npm run collect:dry   # 가격 수집 스크립트를 DB 기록 없이 검증
npm run collect        # 가격 수집 스크립트 실제 실행 (service-role 키 필요)
```

환경 변수(`.env.example` 기준 `.env.local`):
- `NAVER_SHOPPING_CLIENT_ID`, `NAVER_SHOPPING_CLIENT_SECRET` — 네이버 쇼핑 검색 API (없으면 데모 데이터)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase 브라우저/서버 클라이언트
- `SUPABASE_SERVICE_ROLE_KEY` — 가격 수집 스크립트 전용. **Vercel(배포)에는 등록하지 않는다** — 배포된 앱 코드는 이 키를 쓰지 않는다. 로컬과 GitHub Actions Secrets에만 필요.

## IA / 라우트

```
/                홈 — 검색 히어로 + 카탈로그 통계 + 급락 특가 상위 6 + 카테고리 타일
/catalog         카탈로그 탐색 — 카테고리·펫타입·가격대 필터, 정렬
/catalog/[id]    카탈로그 상품 상세 — 현재 최저가 + 가격 추이 차트 + 관심상품 저장
/deals           급락 특가 전체 목록 — 카테고리 탭
/products        실시간 검색 — 네이버 쇼핑 즉시 검색 (카탈로그에 없는 상품용, 보조 기능)
/products/[id]   실시간 검색으로 저장한 상품의 상세 (기존 흐름 유지)
/saved           관심상품 — 가격 변화 추적 카드
/hospitals       동물병원 찾기 — 공공데이터 기반
/guide           반려생활 가이드
/auth            로그인 / 회원가입
```

`/pets` 프로필 페이지, 룰 기반 큐레이션은 없다(옛 기획에만 있던 기능, 구현 안 됨).

## 디렉터리 규칙

- `@/*` → `./src/*` (tsconfig paths)
- `src/app/*` — App Router 페이지. 클라이언트 로직은 `*-client.tsx` 분리 패턴
- `src/lib/*` — 데이터/외부 API 로직 (`naver-shopping`, `pet-search`, `catalog`, `price-stats`, `price-chart` 등)
- `src/lib/supabase/client.ts` — 브라우저 전용 클라이언트 / `src/lib/supabase/server.ts` — 서버 컴포넌트 전용 클라이언트
- `src/components/*` — 공용 컴포넌트 (`Header`, `PriceCard` 등)
- `src/app/styles/*` — 디자인 토큰(`_tokens.scss`) + 페이지·컴포넌트별 partial. `globals.scss`는 `@use` 집계만 한다(직접 스타일 작성 금지)
- `scripts/*` — 가격 수집 파이프라인(`collect-prices.ts`, `seeds.ts`, `lib/match.ts`, `lib/discovery.ts`). Node 스크립트로 tsx 실행, Next.js 런타임과 별개
- `supabase/schema.sql`, `supabase/patches/*` — DB 스키마/패치. 새 변경은 순번 SQL 파일로 추가

## 디자인 컨셉

29CM 레퍼런스 기반 블랙&화이트 에디토리얼. canvas `#ffffff` / ink `#000000` / muted `#5d5d5d` / border `#dddddd` / **accent `#ff4800`는 가격 하락 전용**(필 배지 금지, 텍스트만). 그림자 없음, 플랫. Pretendard Variable. 상세는 설계서 §2 참고.

## 가격 수집 아키텍처

`scripts/collect-prices.ts`가 매일 GitHub Actions(`.github/workflows/collect-prices.yml`)로 직접 실행된다(API 라우트 아님, 배포 상태와 무관). 두 단계:
1. **발굴**: `scripts/seeds.ts`의 카테고리별 키워드로 네이버 검색 → `external_products`에 upsert(`is_tracked=true`)
2. **갱신**: `is_tracked=true` 전체 상품을 제목으로 재검색 → `productId` 일치 시 `price_histories`에 스냅샷

카탈로그 통계는 `product_price_stats` SQL 뷰(`supabase/patches/004_catalog_tracking.sql`)가 계산하고, `src/lib/catalog.ts`가 이를 조회해 프론트엔드에 넘긴다.

`animal_hospitals`, `/hospitals`, `/guide`는 계속 범위 밖(삭제하지 않고 유지·재스타일만).

## 가격 표시 정책

- 사용 표현: "최근 수집된 가격", "네이버 쇼핑 기준 가격", "마지막 확인 시각"
- 금지 표현: "실시간 최저가", "무조건 최저가", "전체 쇼핑몰 최저가", "가장 저렴한 가격"
- 공통 안내: "최종 가격·배송비·재고 여부는 쇼핑몰에서 확인해주세요."

## 코드 컨벤션

- TypeScript strict. `any` 지양, 타입은 `src/types/*`에 정의
- 서버 시크릿(네이버 키, service-role 키)은 클라이언트에 노출 금지. `NEXT_PUBLIC_` 접두사 주의
- 새 DB 변경은 `supabase/patches/`에 순번 SQL로 추가하고 RLS를 항상 포함
- 순수 로직(가격 계산, 매칭, 변환)은 `src/lib/*`나 `scripts/lib/*`로 분리하고 vitest로 테스트
