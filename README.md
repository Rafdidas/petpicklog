# 펫픽 (PetPick Log)

반려동물 용품의 가격을 **매일 자동으로 기록**하고, 최근 14일 최고가 대비 하락한 **급락 특가**와 **가격 추이**를 보여주는 가격추적 서비스입니다. 상품 찜, 사용자 리뷰, 공공데이터 기반 동물병원 검색, 반려생활 가이드를 함께 제공합니다.

**서비스 주소:** https://petpicklog.vercel.app/ (도메인 연결 전까지 배포 URL 사용)

## 주요 기능

- **급락 특가** — 매일 수집한 가격을 최근 14일 최고가와 비교해 하락률이 높은 상품을 모아 보여줍니다.
- **카탈로그 탐색** — 카테고리·펫종류·가격·하락률로 필터링하고 하락률/가격/최신순으로 정렬합니다.
- **가격 추이 차트** — 상품별 가격 히스토리를 차트로 확인합니다.
- **찜하기** — 로그인 후 관심 상품을 저장하고 저장 시점 가격을 기록합니다.
- **리뷰** — 별점·재구매 의향을 포함한 사용자 리뷰.
- **동물병원 찾기** — 공공데이터 기반 지역별 동물병원 정보.
- **반려생활 가이드** — 사료·위생·건강 관리 정보.

카테고리: 사료, 간식, 배변패드, 고양이 모래, 샴푸·위생용품, 영양제, 장난감, 하우스·이동장.

## 기술 스택

- **프레임워크** — Next.js 16 (App Router) · React 19
- **스타일** — Sass, Pretendard, Motion(모션), Recharts(차트)
- **백엔드/DB** — Supabase (PostgreSQL + Auth + RLS)
- **가격 소스** — 네이버 쇼핑 검색 API
- **수집 스크립트** — tsx로 실행, GitHub Actions로 매일 자동화
- **테스트** — Vitest

## 시작하기

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 http://localhost:3000 에서 실행됩니다.

## 환경 변수

`.env.example`을 복사해 `.env.local`을 만듭니다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 브라우저(anon) 클라이언트 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 가격 수집 스크립트가 사용하는 service-role 키. 브라우저에 노출되지 않도록 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. |
| `NAVER_SHOPPING_CLIENT_ID` | 네이버 쇼핑 검색 API 클라이언트 ID |
| `NAVER_SHOPPING_CLIENT_SECRET` | 네이버 쇼핑 검색 API 시크릿 |

> API 키가 없으면 상품 검색 화면은 데모 데이터로 대체되며, Supabase가 설정되지 않으면 가격 관련 화면은 빈 상태로 표시됩니다.

## 데이터베이스

Supabase에서 아래 SQL을 순서대로 실행합니다.

1. `supabase/schema.sql` — 기본 테이블(상품·가격 기록·찜·리뷰·동물병원)과 RLS 정책
2. `supabase/patches/*.sql` — 순번대로 적용하는 추가 마이그레이션 (찜 활성화, RLS 수정, 가격 갱신·리뷰, 카탈로그 추적)

## 가격 수집

카탈로그 발굴과 가격 갱신은 `scripts/collect-prices.ts`가 담당합니다.

```bash
npm run collect       # 발굴 + 가격 갱신 후 실제 DB에 기록
npm run collect:dry   # API 호출·매칭만 수행, DB 기록 없음
```

동작 흐름:

1. **발굴** — 카테고리별 키워드로 네이버 쇼핑을 검색해 `external_products`에 상품을 등록합니다.
2. **갱신** — 추적 중(`is_tracked`)인 상품의 최신 가격을 다시 조회해 매칭한 뒤, `external_products`를 업데이트하고 `price_histories`에 스냅샷을 남깁니다.

`.github/workflows/collect-prices.yml`이 cron `0 0 * * *`(매일 UTC 00:00 = 한국시각 오전 9:00)에 `npm run collect`를 자동 실행합니다. 수동 실행(`workflow_dispatch`)도 가능하며, 위 환경 변수는 저장소 Secrets에 등록해야 합니다.

## 테스트

```bash
npm run test        # 단발 실행
npm run test:watch  # 워치 모드
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run test` | 테스트 실행 |
| `npm run collect` | 가격 수집 (DB 기록) |
| `npm run collect:dry` | 가격 수집 드라이런 |

## 프로젝트 구조

```
src/
  app/           # Next.js App Router 페이지 (홈, 카탈로그, 특가, 상품, 찜, 인증, 병원, 가이드)
  components/    # UI 컴포넌트 (Header, Footer, PriceCard, ui/*)
  lib/           # 도메인 로직 (catalog, price-stats, naver-shopping, supabase 등)
  types/         # 공유 타입
scripts/         # 가격 수집 스크립트 및 발굴·매칭 로직
supabase/        # DB 스키마와 마이그레이션 패치
```
