# 펫픽 리디자인 스펙 (2026-07-20)

## 목표

claude.ai/design 프로젝트 "반려동물 용품 가격비교 사이트"의 시안(`펫픽 리디자인.dc.html`)을 **최대한 그대로** 현재 Next.js 앱에 적용한다.

- 절대 원칙: 시안 재현이 최우선. 기능 추가 없음.
- 시안에는 있으나 실제 기능이 없는 부분(후기 작성/통계 등)은 **정적(하드코딩) UI**로만 재현하고, 기능은 추후 별도 설계.
- 데이터 로직·Supabase·API·라우팅 구조는 변경하지 않는다. 마크업(JSX)과 SCSS만 변경.

## 디자인 토큰 (`src/app/styles/_tokens.scss` 전면 교체)

시안 팔레트로 완전 교체:

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-canvas` | `#F3F6FA` | 페이지 배경 |
| `--color-ink` | `#17222B` | 기본 텍스트, 다크 필 버튼/배지 배경 |
| `--color-ink-secondary` | `#2B3A47` | 보조 텍스트, 다크 버튼 hover |
| `--color-muted` | `#5B6975` | 본문 보조 |
| `--color-muted-2` | `#7C8B98` | 라벨/캡션 |
| `--color-muted-3` | `#9AA8B5` | 흐린 캡션, placeholder |
| `--color-muted-4` | `#8A98A5` | 헤더 서브텍스트 |
| `--color-border` | `#E5ECF2` | 카드/헤더 보더 |
| `--color-border-input` | `#E0E8EF` | 인풋/칩 보더 |
| `--color-divider` | `#EEF3F7` | 구분선 |
| `--color-accent` | `#BFDF74` | 주요 버튼(라임), hover `#AFD45C` |
| `--color-accent-strong` | `#A9CE5B` | 포커스 링, 도트 |
| `--color-accent-deep` | `#5E8F1F` | 그린 텍스트/링크, hover `#487114` |
| `--color-accent-ink` | `#2B3A16` | 라임 버튼 위 텍스트, 그린 카드 잉크 |
| `--color-accent-soft` | `#F0F6E3` | 그린 칩 배경 |
| `--color-accent-soft-2` | `#F6F9F1` | 통계 타일 배경 |
| `--color-accent-nav` | `#EDF3E0` | 활성 nav 배경 (텍스트 `#3E5C15`) |
| `--color-accent-card` | `#DEEBC4` | 그린 프로모 카드 배경 (잉크 `#4E6428`) |
| `--color-accent-logo` | `#C3E17E` | 로고 마크 |
| `--color-accent-badge-text` | `#CDE68F` | 다크 배지 위 라임 텍스트 |
| `--color-surface` | `#FFFFFF` | 카드 배경 |
| `--color-surface-info` | `#EFF5FB` | 파란 정보 스트립 (텍스트 `#4A5C6D`) |
| `--color-danger` | `#B36A4A` | 관심상품 해제 등 (hover `#8F4E33`) |
| `--shadow-card` | `0 1px 4px rgba(23,42,60,0.05)` | 카드 기본 |
| `--shadow-card-hover` | `0 8px 22px rgba(23,42,60,0.1)` | 카드 hover |
| `--shadow-modal` | `0 2px 12px rgba(23,42,60,0.06)` | 히어로/로그인 카드 |
| `--radius-card` | `20px` (대형 22~26px 변형) | 카드 |
| `--radius-input` | `12px`~`14px` | 인풋/버튼 |
| `--radius-full` | `9999px` | 필 버튼/칩/배지 |

포커스 스타일: `border-color: #A9CE5B; box-shadow: 0 0 0 3px rgba(169,206,91,0.2)`.

폰트는 기존 Pretendard Variable 유지.

## 공통 컴포넌트 (신규 `src/components/ui/`)

유지보수를 위해 반복 UI를 컴포넌트로 분리한다. 각각 SCSS 파셜 1개와 짝을 이룬다.

| 컴포넌트 | Props(핵심) | 시안 대응 |
|---|---|---|
| `Button` | `variant: "primary"(라임 필) \| "dark"(다크 필) \| "outline"(흰 보더 필) \| "ghost"(텍스트) \| "green-dark"(#2B3A16 필)`, `size`, `href?`(Link 렌더) | 검색하기/로그인/구매하러 가기/관심상품 저장/병원 보기 등 |
| `Input` | 표준 input 위임, 시안 포커스 링 내장 | 검색·로그인 폼 |
| `Chip` | `active: boolean`, 클릭 핸들러 | 카테고리/펫 필터 칩 (활성=다크 필) |
| `SectionHeading` | `eyebrow`(그린 라벨), `title`, `action?`(우측 링크) | "급락 특가 / 최근 가격이 내려간 상품" 패턴 |
| `StatTile` | `label`, `value` | 홈 수집 현황·관심상품/후기 통계 |
| `Badge` | `variant: "drop"(다크+라임 텍스트) \| "category"(그린 소프트)` | 카드 하락률·카테고리 배지 |
| `EmptyState` | `title`, `description`, `dashed?` | 검색 전/빈 목록 |

기존 `PriceCard`는 시안 카드 구조로 재작성(이미지 위 drop 배지 오버레이, 카테고리 칩, hover 리프트)하되 props 인터페이스는 유지.

## 페이지별 작업

시안 → 실제 라우트 매핑. 모든 페이지에서 데이터 소스는 기존 그대로.

### 홈 `/`
- 히어로 2열(1.2fr/1fr): 좌측 "매일 오전 자동 수집 중" 도트 배지 + 카피 + 검색폼, 우측 "오늘의 수집 현황" 카드(StatTile 3개 + 파란 정보 스트립 "최근 수집 · … / 정상 작동" — 실데이터 `summary` 활용).
- 급락 특가 4개(PriceCard) + "전체 보기 →".
- 카테고리 타일: 카드형 버튼(라벨 + "n개 추적" — 실데이터 개수, 없으면 개수 생략).
- 하단 2열: 동물병원(그린 카드 #DEEBC4) / 가이드(흰 카드).
- 기존 `CategoryTopProducts` 섹션은 시안에 없으므로 제거.

### 카탈로그 `/catalog`
- 그린 eyebrow + 타이틀 + 설명, 흰 카드 안에 검색줄(인풋+다크 검색 버튼) + 카테고리 Chip 행.
- "총 n개 상품 · 하락률순" 카운트 라인, PriceCard 그리드(240px min).

### 급락 특가 `/deals`
- eyebrow/타이틀/설명 + Chip 행(카드 없이 노출) + PriceCard 그리드.

### 실시간 검색 `/products`
- max-width 900px. 흰 카드: 검색줄(라임 검색 버튼) + 펫 Chip 행 + "실제 검색어: …" + 구분선 아래 빠른 검색어 칩.
- 결과 없음 상태: 점선 보더 카드 "검색어를 입력해 보세요".
- 검색 결과 카드는 PriceCard 스타일 준용.

### 상품 상세 `/catalog/[id]`, `/products/[id]`
- 상단 흰 카드 2열(420px/1fr): 이미지 / "네이버 쇼핑 기준" 라벨 + 상품명 + 가격 + 메타 리스트(카테고리·쇼핑몰·마지막 가격 확인, divider 행) + 버튼 2개(관심상품 저장 outline, 구매하러 가기 라임) + 고지 문구.
- "가격 기록" 섹션: 흰 카드 안 Recharts 막대그래프(기존 price-chart 데이터 사용, 마지막 막대만 라임 `#BFDF74`, 나머지 `#E3EDF3`, 상단 가격 라벨, 하단 날짜 행). 상세는 "신규 라이브러리" 섹션 참조.
- "후기" 섹션: 코드 확인 결과 후기 기능이 **이미 존재**함(`product_reviews` 테이블, `/products/[id]`의 작성·조회 로직). 기존 기능을 그대로 유지하고 시안 스타일만 적용: StatTile 4개(후기 n개/평균 별점/재구매 의사/내 후기 — 실데이터) + 작성 폼(별점·재구매 select, textarea, 다크 "후기 저장" 버튼) + 후기 목록.
- `/products/[id]`(실시간 검색 상세)는 가격 기록 리스트·후기 기능 등 기존 동작 전부 유지, 스타일만 시안으로 교체.

### 관심상품 `/saved`
- eyebrow/타이틀/설명 + StatTile 4개(관심상품 n개/가격 하락/가격 상승/최근 확인 — 실데이터 계산 가능 범위, 불가하면 시안 문구).
- 가로형 리스트 카드(120px 이미지 / 본문 / 우측 버튼 열). "가격 변동 없음" 그린 칩은 실데이터 변동 상태로 표기.
- 기존 기능(상태 select, 현재 가격 확인, 최근 가격 기록 토글, 후기 작성, 관심상품 해제)은 시안에 없어도 **전부 유지**하고 시안 버튼 스타일(outline/라임/텍스트 danger)로 통일. 기능 제거 없음.

### 가이드 `/guide`
- eyebrow/타이틀/설명(수의사 상담 고지 포함) + 가이드 카드 그리드(태그 칩·제목·설명·"콘텐츠 준비 중").
- 하단 그린 CTA 배너(#DEEBC4, "가격 확인하기" → /catalog).

### 로그인 `/auth`
- max-width 440px 중앙. 로고 마크 + 타이틀 + 서브카피, 흰 카드(그린 혜택 안내 박스 + 이메일/비밀번호 Input + 라임 제출 버튼 + 밑줄 전환 링크). 로그인/회원가입 전환은 기존 `auth-client` 로직 유지, 스타일만 교체.

### 동물병원 `/hospitals`
- 시안에 없는 페이지. 새 디자인 언어(흰 카드·필 칩·라운드·토큰)로 통일감만 맞춘다. 레이아웃 재구성은 하지 않음.

## 신규 라이브러리

- **Recharts** — 상품 상세 가격 기록 차트를 Recharts `<BarChart>`로 구현. SVG 기반이라 CSS 토큰을 fill에 직접 사용, 마지막 막대만 `var(--color-accent)`(라임), 나머지 `#E3EDF3`. 막대 상단 가격 라벨(`LabelList`), 하단 날짜 축, 둥근 모서리(`radius`). 기존 `price-chart.ts` 데이터 가공 로직은 그대로 사용.
- **Motion (구 Framer Motion)** — `npm i motion`, `import { motion } from "motion/react"`. 적용 범위:
  - 섹션/카드 진입 시 fade + slide-up 스태거
  - 칩 필터 전환 시 그리드 레이아웃 애니메이션(`layout`)
  - hover 리프트 등 단순 전환은 기존 CSS transition 유지 (과용 금지)
  - 서버 컴포넌트 페이지에서는 애니메이션 래퍼만 클라이언트 컴포넌트로 분리(`ui/Reveal.tsx` 등)

## 공통 레이아웃

### 헤더 (`Header.tsx` + `_header.scss`)
- sticky, `rgba(255,255,255,0.92)` + `backdrop-filter: blur(12px)`, 하단 보더.
- 로고: 라임 사각 마크(34px, radius 11px, "P") + "펫픽" + "반려용품 가격추적".
- nav: 필 버튼형 링크, 활성(현재 경로)은 `#EDF3E0` 배경 + `#3E5C15`. 링크 구성 기존 유지(카탈로그/급락 특가/실시간 검색/동물병원/가이드/관심상품).
- 로그인: 다크 필 버튼. 로그아웃도 동일 스타일.

### 푸터 (신규 `Footer.tsx`)
- 상단 보더 + 흰 배경, 좌 "펫픽 · 반려동물 용품 가격추적 서비스" / 우 가격 고지 문구. `layout.tsx`에 추가.

## SCSS 구조

- `_tokens.scss` 교체, `_base.scss`(배경·링크·placeholder·공용 카드/그리드) 갱신.
- 신규: `_ui.scss`(Button/Input/Chip/Badge/StatTile/EmptyState/SectionHeading), `_footer.scss`, `_home.scss`(홈 전용 분리), `_detail.scss`(상세 전용).
- 기존 파셜(`_catalog`, `_products`, `_saved`, `_guide`, `_auth`, `_hospitals`, `_header`)은 새 토큰·컴포넌트 기준으로 재작성.
- BEM 스타일 클래스 네이밍 기존 관례 유지.

## 검증

- `npm run dev` + 브라우저 프리뷰로 페이지별 시안 대조(스크린샷 비교).
- `npm run lint`, `npm run test`(기존 유닛 테스트 회귀 없음 — 로직 미변경이므로 통과해야 함).
- `npm run build` 통과.

## 범위 제외 (추후 별도 설계)

- 후기 저장/조회 기능(백엔드 포함)
- 다크 모드
- 반응형 상세 최적화(시안이 데스크톱 기준 — 기존 반응형 수준만 유지)
