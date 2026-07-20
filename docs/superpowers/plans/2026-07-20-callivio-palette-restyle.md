# Callivio 팔레트 리스킨 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** petpick-log의 포인트 컬러를 오렌지에서 Callivio 팔레트(블루/옐로우/그레이)로 교체하고, 그 과정에서 발견된 accent/danger 토큰 오용을 분리한다.

**Architecture:** 디자인 시스템이 `_tokens.scss` 한 곳의 CSS 변수로 집중되어 있어, 토큰값 교체만으로 대부분 자동 전파된다. 신규 토큰(surface/highlight/danger) 3개는 각각 정해진 소수의 컴포넌트에만 명시적으로 연결한다.

**Tech Stack:** Next.js 16 App Router, SCSS(CSS 커스텀 프로퍼티), Vitest(node 환경, 이 작업은 순수 스타일/마크업 변경이라 신규 단위 테스트 없음).

**Spec:** `docs/superpowers/specs/2026-07-20-callivio-palette-restyle-design.md`

## Global Constraints

- 새 토큰 값은 스펙에 명시된 정확한 hex를 그대로 사용한다: accent `#2c6496`, accent-soft `#82add4`, surface `#f0f0ed`, highlight `#ddfd2c`, danger `#ff4800`.
- `--color-accent`는 가격 하락/차액 정보 전용으로 되돌린다 — danger(에러/위험) 용도는 새 `--color-danger` 토큰으로 분리한다.
- 탭/버튼의 active 상태(`--color-ink` 배경 + `--color-canvas` 텍스트)는 이번 스코프에서 건드리지 않는다.
- `--color-accent-soft`는 홈 히어로 배경 외 다른 곳에 연결하지 않는다.
- 이번 작업은 순수 스타일(SCSS)+마크업(JSX 한 곳) 변경으로 새 로직이 없다 — 신규 단위 테스트를 만들지 않는다. 검증은 tsc/lint/build + 브라우저 확인으로 한다.
- 커밋 메시지는 한국어 관행(`feat:`, `fix:`, `style:` 접두사) 유지.

---

### Task 1: 토큰 교체 + danger 분리

`_tokens.scss`의 색상 값을 교체하고, `--color-accent`를 잘못 재사용하던 `.button--danger`/`.notice--error`를 새 `--color-danger` 토큰으로 옮긴다. 이 태스크만으로 가격 하락률·차액 텍스트(`price-card__drop`, `catalog-detail__drop`, `saved-item__diff--down`, `guide-card span`)는 토큰 교체가 자동 전파되어 오렌지 → 블루로 바뀐다 (해당 파일들은 수정하지 않는다).

**Files:**
- Modify: `src/app/styles/_tokens.scss:1-9`
- Modify: `src/app/styles/_base.scss:124-132` (`.button--danger`)
- Modify: `src/app/styles/_base.scss:141-145` (`.notice--error`)

**Interfaces:**
- Produces: CSS 커스텀 프로퍼티 `--color-accent` (신규값 `#2c6496`), `--color-accent-soft`(`#82add4`, 신규), `--color-surface`(`#f0f0ed`, 신규), `--color-highlight`(`#ddfd2c`, 신규), `--color-danger`(`#ff4800`, 신규) — Task 2~4가 `--color-surface`/`--color-highlight`/`--color-accent-soft`를 사용한다.

- [ ] **Step 1: `_tokens.scss`의 `:root` 블록을 아래로 교체**

```scss
:root {
  --color-canvas: #ffffff;
  --color-ink: #000000;
  --color-muted: #5d5d5d;
  --color-ink-secondary: #303033;
  --color-ink-tertiary: #474747;
  --color-border: #dddddd;
  --color-accent: #2c6496;
  --color-accent-soft: #82add4;
  --color-surface: #f0f0ed;
  --color-highlight: #ddfd2c;
  --color-danger: #ff4800;

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

- [ ] **Step 2: `_base.scss`의 `.button--danger` 블록(현재 124-132행)을 아래로 교체**

```scss
  &--danger {
    background: var(--color-canvas);
    color: var(--color-danger);
    border-color: var(--color-border);

    &:hover:not(:disabled) {
      border-color: var(--color-danger);
    }
  }
```

- [ ] **Step 3: `_base.scss`의 `.notice--error` 블록(현재 141-145행)을 아래로 교체**

```scss
  &--error {
    background: #fff5f0;
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }
```

- [ ] **Step 4: 전체 accent 사용처에 danger가 남아있지 않은지 확인**

Run: `grep -rn "color-accent" src/app/styles`
Expected: `_tokens.scss`(정의부), `_catalog.scss`의 `price-card__drop`/`catalog-detail__drop`, `_saved.scss`의 `saved-item__diff--down`, `_guide.scss`의 guide-card span만 남고, `_base.scss`의 `.button--danger`/`.notice--error`에는 더 이상 `color-accent`가 없어야 한다.

- [ ] **Step 5: 빌드 검증**

Run: `npx tsc --noEmit && npm run lint`
Expected: 에러 0 (SCSS는 tsc 대상이 아니므로 이 단계는 회귀 확인용)

- [ ] **Step 6: Commit**

```bash
git add src/app/styles/_tokens.scss src/app/styles/_base.scss
git commit -m "fix: accent/danger 토큰 분리 후 Callivio 팔레트로 교체"
```

---

### Task 2: `--color-surface` 적용 (통계 카드 + 빈 상태)

**Files:**
- Modify: `src/app/styles/_catalog.scss:95-124` (`.home-stats`)
- Modify: `src/app/styles/_base.scss:170-201` (`.metric-grid`)
- Modify: `src/app/styles/_base.scss:154-168` (`.empty-state`)

**Interfaces:**
- Consumes: Task 1의 `--color-surface` 토큰.

- [ ] **Step 1: `_catalog.scss`의 `.home-stats article` 블록에서 `background`를 교체**

`_catalog.scss:103-119`의 `article { ... }` 블록 안, `background: var(--color-canvas);`(108행)를 아래로 교체:

```scss
    background: var(--color-surface);
```

- [ ] **Step 2: `_base.scss`의 `.metric-grid article` 블록에서 `background`를 교체**

`_base.scss:180-196`의 `article { ... }` 블록 안, `background: var(--color-canvas);`(185행)를 아래로 교체:

```scss
    background: var(--color-surface);
```

- [ ] **Step 3: `_base.scss`의 `.empty-state`에 배경 추가**

`_base.scss:154-168`의 `.empty-state` 블록을 아래로 교체:

```scss
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 48px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 14px;

  p {
    margin: 0;
  }
}
```

- [ ] **Step 4: 빌드 검증**

Run: `npx tsc --noEmit && npm run lint`
Expected: 에러 0

- [ ] **Step 5: Commit**

```bash
git add src/app/styles/_catalog.scss src/app/styles/_base.scss
git commit -m "style: 통계 카드·빈 상태에 surface 배경 적용"
```

---

### Task 3: `--color-highlight` 배지 (역대 최저가 근접)

카탈로그 상세 페이지에서 이미 계산만 되고 시각적으로 쓰이지 않던 `nearAllTimeLow`를 노란 배지로 표시한다.

**Files:**
- Modify: `src/app/styles/_base.scss` (`.badge` 클래스 신규 추가, `.result-summary` 블록 뒤)
- Modify: `src/app/catalog/[id]/page.tsx:70-74`

**Interfaces:**
- Consumes: Task 1의 `--color-highlight` 토큰, 기존 `nearAllTimeLow: boolean` 변수(`src/app/catalog/[id]/page.tsx:39`, 이미 존재, 변경 없음).
- Produces: CSS 클래스 `.badge`, `.badge--highlight` — 이후 다른 배지가 필요하면 재사용 가능.

- [ ] **Step 1: `_base.scss` 끝(`.result-summary` 블록, 254-258행) 뒤에 배지 스타일 추가**

```scss
.badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-chip);
  font-size: 11px;
  font-weight: 700;

  &--highlight {
    background: var(--color-highlight);
    color: var(--color-ink);
  }
}
```

- [ ] **Step 2: `catalog/[id]/page.tsx`의 역대 최저가 표시(현재 72행)를 교체**

현재:
```tsx
            <div><dt>역대 최저가</dt><dd>{formatPrice(stats.minPriceAll)}{nearAllTimeLow ? " · 최저가 근접" : ""}</dd></div>
```

아래로 교체:
```tsx
            <div>
              <dt>역대 최저가</dt>
              <dd>
                {formatPrice(stats.minPriceAll)}
                {nearAllTimeLow ? <span className="badge badge--highlight">최저가 근접</span> : null}
              </dd>
            </div>
```

- [ ] **Step 3: 빌드 검증**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: 에러 0, 기존 테스트 전체 PASS (이 변경은 `nearAllTimeLow`의 계산 로직을 건드리지 않으므로 `price-stats.test.ts` 등 기존 테스트는 그대로 통과해야 한다)

- [ ] **Step 4: Commit**

```bash
git add src/app/styles/_base.scss "src/app/catalog/[id]/page.tsx"
git commit -m "feat: 역대 최저가 근접 표시를 노란 배지로 전환"
```

---

### Task 4: `--color-accent-soft` 홈 히어로 배경 + 대비 보정

**Files:**
- Modify: `src/app/styles/_catalog.scss:52-93` (`.home-hero`)

**Interfaces:**
- Consumes: Task 1의 `--color-accent-soft` 토큰.

- [ ] **Step 1: `_catalog.scss`의 `.home-hero` 블록(현재 52-93행) 전체를 아래로 교체**

```scss
.home-hero {
  padding: 64px 0 40px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-accent-soft);

  h1 {
    margin: 16px 0;
    font-size: 40px;
    font-weight: 700;
    line-height: 1.3;
  }

  p {
    margin: 0 0 24px;
    max-width: 560px;
    color: var(--color-ink);
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
    background: var(--color-canvas);

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
```

변경 요약: `background: var(--color-accent-soft);` 추가, `p`의 `color`를 `var(--color-muted)` → `var(--color-ink)`로, `&__search`에 `background: var(--color-canvas);` 추가. 나머지는 기존과 동일.

- [ ] **Step 2: 빌드 검증**

Run: `npx tsc --noEmit && npm run lint`
Expected: 에러 0

- [ ] **Step 3: Commit**

```bash
git add src/app/styles/_catalog.scss
git commit -m "style: 홈 히어로에 accent-soft 블루 배경 적용"
```

---

### Task 5: 전체 검증 (브라우저 + 빌드)

**Files:**
- 코드 변경 없음 — 검증 전용 태스크.

- [ ] **Step 1: 전체 자동 검증**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: 테스트 전체 PASS, 타입/린트 에러 0, 프로덕션 빌드 성공

- [ ] **Step 2: 브라우저로 페이지별 색상 반영 확인**

개발 서버(`mcp__Claude_Browser__preview_start`, `{"name": "dev"}`)를 띄우고 아래를 확인한다:

1. 홈(`/`): 히어로 섹션 배경이 연한 블루, 카피/검색창 텍스트 대비 이상 없음, "카탈로그 현황" 통계 카드가 옅은 회색 채움, "급락 특가"/"카테고리별 인기상품" 카드의 하락률이 블루로 표시
2. 카탈로그(`/catalog`): 상품 카드 하락률 블루, 빈 상태(검색 결과 없을 때) 배경이 옅은 회색
3. 카탈로그 상세(`/catalog/[id]`): 하락률 블루, 역대 최저가 근접 상품이 있으면 노란 배지("최저가 근접") 표시 확인 — 없으면 콘솔에서 `product_price_stats`를 조회해 `current_price`가 `min_price_all`에 가까운 상품 URL을 찾아 접속
4. 급락 특가(`/deals`): 하락률 블루
5. 관심상품(`/saved`): 가격 하락 표시(`saved-item__diff--down`) 블루
6. 가이드(`/guide`): 카드 라벨 블루
7. 인증(`/auth`): 의도적으로 잘못된 값을 입력해 에러 배너(`.notice--error`)가 여전히 오렌지로 표시되는지 확인 (danger 분리가 색을 안 바꿨는지 검증)
8. 콘솔 에러 없음 확인, 모바일 뷰포트(375px)에서 홈 히어로 레이아웃 확인
9. 스크린샷 1~2장 캡처해 사용자에게 공유

- [ ] **Step 3: 문제 발견 시**

브라우저 확인에서 대비·레이아웃 문제가 발견되면 해당 태스크(1~4)의 파일로 돌아가 수정하고, 이 태스크의 Step 1~2를 다시 실행한다. 새 커밋으로 분리한다(기존 태스크 커밋을 amend하지 않는다).
