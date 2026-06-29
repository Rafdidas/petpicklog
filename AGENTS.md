# AGENTS.md — 펫핏(PetFit)

AI 에이전트가 이 저장소에서 작업할 때 따르는 지침이다. 사람도 읽기 좋게 작성한다.

## 프로젝트 개요

펫핏은 **펫프렌즈식 반려용품 탐색 경험 + 다나와식 가격추적**을 결합한 반려용품 서비스다. 익숙한 커머스 UX로 둘러보고, 관심상품 가격추적·그래프로 다시 찾게 만드는 것이 핵심이다.

- 목적: 실제 출시/운영 (포트폴리오 아님)
- 타겟: 초보 반려인 + 가격·가성비 민감형 (추후 동반 외출 보호자)
- 리텐션 훅: 관심상품 가격추적 + 가격추이 그래프 (자동 1일 2회 갱신)

> 전체 설계는 단일 소스로 [docs/superpowers/specs/2026-06-29-petfit-redesign-design.md](docs/superpowers/specs/2026-06-29-petfit-redesign-design.md)를 따른다. 이 파일과 충돌하면 설계서가 우선이다.

## 기술 스택

Next.js 16 / React 19 / TypeScript / SCSS / Supabase / Vercel.
Tailwind·CSS Module은 **사용하지 않는다** (SCSS 유지).

## 실행 / 환경

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # eslint
```

환경 변수(`.env.example` 기준 `.env.local`):
- `NAVER_SHOPPING_CLIENT_ID`, `NAVER_SHOPPING_CLIENT_SECRET` — 네이버 쇼핑 검색 API (없으면 데모 데이터)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase 브라우저 클라이언트

## IA / 라우트

```
/                홈 — 큐레이션 추천 + 내 관심상품 가격 요약
/products        가격 확인 — 네이버 쇼핑 검색 + 가격순 정렬/필터
/products/[id]   상품 상세 — 현재가 + 가격추이 그래프 + 리뷰
/saved           관심상품 — 가격 변화 추적 카드
/pets            내 아이 프로필 — 선택 입력(단일), 추천 정밀도 ↑
/auth            로그인 / 회원가입
── 추후 ── /places(동반 장소), /guide(가이드)
```

## 디렉터리 규칙

- `@/*` → `./src/*` (tsconfig paths)
- `src/app/*` — App Router 페이지. 클라이언트 로직은 `*-client.tsx` 분리 패턴
- `src/lib/*` — 데이터/외부 API 로직 (`naver-shopping`, `pet-search`, `curation` 등)
- `src/components/*` — 공용 컴포넌트
- `supabase/schema.sql`, `supabase/patches/*` — DB 스키마/패치

## 재설계 작업 시 핵심 규칙

1. **프론트엔드는 전면 신규 설계.** 기존 페이지 UI/마크업·`Header`·`globals.scss`·`styles/*` 토큰·레이아웃은 **폐기**하고 처음부터 다시 만든다. 기존 화면은 참고하지 않는다.
2. **재사용은 백엔드/데이터/로직 계층에 한정.** `lib/naver-shopping`, `lib/pet-search`, `api/products/search`, Supabase 스키마, auth, saved/price/review 데이터 로직은 살린다.
3. **프로필은 선택 입력.** 미입력 유저도 전체 기능을 쓸 수 있어야 한다. 추천만 정밀도가 달라진다.
4. **추천은 룰 기반.** `src/lib/curation.ts` 정적 매핑(`pet_type × 나이대`). ML 아님.
5. **가격 갱신**: 자동 1일 2회(`POST /api/cron/refresh-prices`, 시크릿 토큰 검증, GitHub Actions 스케줄) + 수동 버튼. 대상은 관심상품에 담긴 distinct `external_products`.
6. `animal_hospitals`, `/hospitals`, `/guide`는 이번 범위 밖(보류, 삭제하지 않음).

## 가격 표시 정책

- 사용 표현: "현재/최근 확인 가격", "네이버 쇼핑 기준 가격", "마지막 가격 확인 시각"
- 금지 표현: "실시간 최저가", "무조건 최저가", "전체 쇼핑몰 최저가", "가장 저렴한 가격"
- 공통 안내: "최종 가격·배송비·재고 여부는 쇼핑몰에서 확인해주세요."

## 코드 컨벤션

- TypeScript strict. `any` 지양, 타입은 `src/types/*`에 정의
- 서버 시크릿(네이버 키, cron 토큰)은 클라이언트에 노출 금지. `NEXT_PUBLIC_` 접두사 주의
- 새 DB 변경은 `supabase/patches/`에 순번 SQL로 추가하고 RLS를 항상 포함
