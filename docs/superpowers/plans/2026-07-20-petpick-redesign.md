# 펫픽 리디자인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** claude.ai/design 시안(`펫픽 리디자인.dc.html`)을 현재 Next.js 앱 전 페이지에 그대로 적용한다 — 로직 무변경, JSX·SCSS만 수정.

**Architecture:** 토큰 교체 → 공통 UI 컴포넌트(`src/components/ui/`) 구축 → 헤더/푸터/카드 → 페이지별 적용 순서. 데이터 페칭·Supabase 로직·라우팅은 그대로 두고 마크업과 스타일만 교체한다. 차트는 Recharts, 등장 애니메이션은 Motion.

**Tech Stack:** Next.js 16(App Router), React 19, Sass(SCSS 파셜), Recharts, Motion(`motion/react`)

**Reference:** 상세 디자인 값(색·라운드·그림자·문구)은 `docs/superpowers/specs/2026-07-20-petpick-redesign-design.md` 스펙 참조. 시안 원본은 claude.ai/design 프로젝트의 `펫픽 리디자인.dc.html`.

## Global Constraints

- 데이터 로직·Supabase 쿼리·API·라우팅 구조 변경 금지. JSX 마크업과 SCSS만 수정.
- 기존 기능 제거 금지 (후기 작성/조회, 관심상품 상태 select, 현재 가격 확인, 가격 기록 토글 등 전부 유지).
- 색상은 반드시 `_tokens.scss`의 CSS 변수 사용. 컴포넌트 SCSS에 hex 하드코딩 금지 (Recharts fill 등 SVG 속성은 `var(--...)` 문자열로 전달).
- 클래스 네이밍은 기존 BEM 관례 유지 (`block--elem__sub`, modifier `--active` 등 기존 코드 스타일 준용).
- 폰트: 기존 Pretendard Variable 유지 (`--font-sans` 변경 없음).
- 각 태스크 완료 시 `npm run lint && npm run build` 통과 후 커밋. 로직 미변경이므로 `npm run test`는 항상 통과해야 함(깨지면 잘못 건드린 것).
- 커밋 메시지는 한국어, 기존 관례(`feat:`, `style:`, `fix:`) 준수, Co-Authored-By 트레일러 포함.

---

### Task 1: 디자인 토큰 교체

**Files:**
- Modify: `src/app/styles/_tokens.scss` (전체 교체)
- Modify: `src/app/styles/_base.scss` (배경·링크·placeholder 기본값)

**Interfaces:**
- Produces: 이후 모든 태스크가 사용하는 CSS 변수. 이름은 아래 코드 그대로.

- [ ] **Step 1: `_tokens.scss` 전체 교체**

```scss
:root {
  --color-canvas: #f3f6fa;
  --color-surface: #ffffff;
  --color-ink: #17222b;
  --color-ink-secondary: #2b3a47;
  --color-muted: #5b6975;
  --color-muted-2: #7c8b98;
  --color-muted-3: #9aa8b5;
  --color-muted-4: #8a98a5;
  --color-border: #e5ecf2;
  --color-border-input: #e0e8ef;
  --color-divider: #eef3f7;

  --color-accent: #bfdf74;
  --color-accent-hover: #afd45c;
  --color-accent-strong: #a9ce5b;
  --color-accent-deep: #5e8f1f;
  --color-accent-deep-hover: #487114;
  --color-accent-ink: #2b3a16;
  --color-accent-soft: #f0f6e3;
  --color-accent-soft-2: #f6f9f1;
  --color-accent-nav: #edf3e0;
  --color-accent-nav-ink: #3e5c15;
  --color-accent-card: #deebc4;
  --color-accent-card-ink: #4e6428;
  --color-accent-logo: #c3e17e;
  --color-accent-badge-text: #cde68f;
  --color-accent-eyebrow: #8fbe3f;

  --color-surface-info: #eff5fb;
  --color-surface-info-ink: #4a5c6d;
  --color-chart-bar: #e3edf3;
  --color-danger: #b36a4a;
  --color-danger-hover: #8f4e33;

  --shadow-card: 0 1px 4px rgba(23, 42, 60, 0.05);
  --shadow-card-hover: 0 8px 22px rgba(23, 42, 60, 0.1);
  --shadow-modal: 0 2px 12px rgba(23, 42, 60, 0.06);

  --focus-ring: 0 0 0 3px rgba(169, 206, 91, 0.2);

  --font-sans: "Pretendard Variable", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Malgun Gothic", sans-serif;

  --space-xs: 2px;
  --space-sm: 4px;
  --space-md: 8px;
  --space-base: 16px;
  --space-lg: 24px;
  --space-xl: 28px;

  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-input: 14px;
  --radius-card: 20px;
  --radius-card-lg: 22px;
  --radius-card-xl: 26px;
  --radius-full: 9999px;
}
```

- [ ] **Step 2: `_base.scss`에서 시안 전역 스타일 반영**

기존 `_base.scss`를 읽고 다음을 적용(기존 유틸 클래스 `line-clamp-2`, `card-grid`, `empty-state`, `section-label`, `page-heading` 등은 유지하되 값 갱신):

**중요 — 전역 `main` 규칙 제거:** 현재 `_base.scss`에는 `main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 96px; }`가 있다. 이후 모든 태스크가 페이지별 컨테이너(`max-width` + `padding`)를 직접 지정하므로, 이 전역 규칙을 그대로 두면 폭·패딩이 이중 적용되어 시안과 어긋난다. 반드시 아래처럼 무력화한다.

```scss
main {
  display: block;
}
```

```scss
body {
  margin: 0;
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--color-accent-deep);
  text-decoration: none;

  &:hover {
    color: var(--color-accent-deep-hover);
  }
}

::placeholder {
  color: var(--color-muted-3);
}

.section-label {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--color-accent-eyebrow);
  letter-spacing: 0.05em;
  margin: 0 0 6px;
}

.page-heading {
  h1 {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.025em;
    margin: 0 0 10px;
  }

  &__copy {
    font-size: 15px;
    color: var(--color-muted);
    margin: 0 0 28px;
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}

.empty-state {
  background: var(--color-surface);
  border: 1px dashed #d5dfe8;
  border-radius: var(--radius-card-lg);
  padding: 48px 24px;
  text-align: center;
  color: var(--color-muted-2);
  font-size: 13px;

  strong {
    display: block;
    font-size: 14.5px;
    color: var(--color-ink);
    margin-bottom: 6px;
  }
}
```

참고: 기존 `_base.scss`에 있는 다른 공용 클래스(`notice`, `metric-grid`, `pagination`, `detail-list` 등)는 삭제하지 말고 새 토큰 변수로 색만 치환한다(이후 태스크에서 개별 재작성).

- [ ] **Step 3: 빌드 확인**

Run: `npm run lint; npm run build`
Expected: 둘 다 통과. 구버전 토큰 변수(`--color-highlight`, `--radius-chip` 등)를 참조하던 SCSS가 있으면 빌드는 통과하더라도 색이 비어 보이므로, `Grep`으로 `--color-highlight|--radius-chip|--color-ink-tertiary|--color-accent-soft(?!-)` 참조를 검색해 새 토큰으로 치환한다.

- [ ] **Step 4: 커밋**

```bash
git add src/app/styles/_tokens.scss src/app/styles/_base.scss
git commit -m "style: 디자인 토큰을 리디자인 시안 라임그린 팔레트로 교체"
```

---

### Task 2: 라이브러리 설치 + 공통 UI 컴포넌트

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Chip.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/StatTile.tsx`
- Create: `src/components/ui/SectionHeading.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/Reveal.tsx`
- Create: `src/app/styles/_ui.scss`
- Modify: `src/app/globals.scss` (`@use "./styles/ui";` 추가)

**Interfaces:**
- Produces (이후 태스크 전부가 사용):
  - `Button`: `{ variant?: "primary" | "dark" | "outline" | "ghost" | "green-dark" | "danger-text"; size?: "md" | "sm"; href?: string; external?: boolean; ...ButtonHTMLAttributes }` — `href` 있으면 `Link`(external이면 `<a target="_blank">`) 렌더
  - `Chip`: `{ active?: boolean; ...ButtonHTMLAttributes }`
  - `Badge`: `{ variant: "drop" | "category" | "state" }` + children
  - `StatTile`: `{ label: string; value: ReactNode; boxed?: boolean }` — `boxed`는 흰 카드형(관심상품/후기 통계), 기본은 그린 소프트 타일(홈 히어로)
  - `SectionHeading`: `{ eyebrow: string; title: string; action?: ReactNode; level?: 1 | 2 }`
  - `EmptyState`: `{ title?: string; children: ReactNode; action?: ReactNode }`
  - `Reveal`: `{ children; delay?: number; className?: string }` — Motion fade+slide-up 래퍼(클라이언트 컴포넌트)

- [ ] **Step 1: 라이브러리 설치**

```bash
npm i recharts motion
```

- [ ] **Step 2: Button 구현**

`src/components/ui/Button.tsx`:

```tsx
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "dark" | "outline" | "ghost" | "green-dark" | "danger-text";

type CommonProps = {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buttonClass({ variant = "primary", size = "md", className }: CommonProps) {
  return ["ui-button", `ui-button--${variant}`, size === "sm" ? "ui-button--sm" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
}

export default function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant, size, className, external, href, children, ...rest } = props;
    const cls = buttonClass({ variant, size, className, children });
    if (external) {
      return (
        <a className={cls} href={href} target="_blank" rel="noreferrer" {...rest}>
          {children}
        </a>
      );
    }
    return (
      <Link className={cls} href={href} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant, size, className, children, type, ...rest } = props;
  return (
    <button className={buttonClass({ variant, size, className, children })} type={type ?? "button"} {...rest}>
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Chip / Badge / StatTile / SectionHeading / EmptyState 구현**

`src/components/ui/Chip.tsx`:

```tsx
import type { ButtonHTMLAttributes } from "react";

export default function Chip({ active = false, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  const cls = ["ui-chip", active ? "ui-chip--active" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <button className={cls} type="button" {...rest}>
      {children}
    </button>
  );
}
```

`src/components/ui/Badge.tsx`:

```tsx
import type { ReactNode } from "react";

export default function Badge({ variant, children }: { variant: "drop" | "category" | "state"; children: ReactNode }) {
  return <span className={`ui-badge ui-badge--${variant}`}>{children}</span>;
}
```

`src/components/ui/StatTile.tsx`:

```tsx
import type { ReactNode } from "react";

export default function StatTile({ label, value, boxed = false }: { label: string; value: ReactNode; boxed?: boolean }) {
  return (
    <article className={boxed ? "ui-stat ui-stat--boxed" : "ui-stat"}>
      <span className="ui-stat__label">{label}</span>
      <strong className="ui-stat__value">{value}</strong>
    </article>
  );
}
```

`src/components/ui/SectionHeading.tsx`:

```tsx
import type { ReactNode } from "react";

export default function SectionHeading({ eyebrow, title, action, level = 2 }: { eyebrow: string; title: string; action?: ReactNode; level?: 1 | 2 }) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="ui-section-heading">
      <div>
        <p className="section-label">{eyebrow}</p>
        <Heading className="ui-section-heading__title">{title}</Heading>
      </div>
      {action ?? null}
    </div>
  );
}
```

`src/components/ui/EmptyState.tsx`:

```tsx
import type { ReactNode } from "react";

export default function EmptyState({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {title ? <strong>{title}</strong> : null}
      <p>{children}</p>
      {action ?? null}
    </div>
  );
}
```

- [ ] **Step 4: Reveal (Motion 래퍼) 구현**

`src/components/ui/Reveal.tsx`:

```tsx
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 5: `_ui.scss` 작성 + globals 등록**

`src/app/styles/_ui.scss`:

```scss
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  padding: 12px 22px;
  border-radius: var(--radius-full);
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &--sm {
    font-size: 12.5px;
    padding: 9px 16px;
  }

  &--primary {
    background: var(--color-accent);
    color: var(--color-accent-ink);

    &:hover { background: var(--color-accent-hover); }
  }

  &--dark {
    background: var(--color-ink);
    color: var(--color-surface);

    &:hover { background: var(--color-ink-secondary); }
  }

  &--outline {
    background: var(--color-surface);
    border: 1px solid var(--color-border-input);
    color: var(--color-ink-secondary);

    &:hover {
      border-color: var(--color-accent);
      background: #fbfdf6;
    }
  }

  &--ghost {
    background: none;
    color: var(--color-accent-deep);
    padding-inline: 8px;

    &:hover { color: var(--color-accent-deep-hover); }
  }

  &--green-dark {
    background: var(--color-accent-ink);
    color: #ddedbb;

    &:hover { background: #3e5220; }
  }

  &--danger-text {
    background: none;
    color: var(--color-danger);
    font-weight: 600;
    font-size: 12px;
    padding: 6px;

    &:hover { color: var(--color-danger-hover); }
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
}

.ui-chip {
  border: 1px solid var(--color-border-input);
  background: var(--color-surface);
  color: var(--color-surface-info-ink);
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 15px;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover { border-color: var(--color-accent-strong); }

  &--active {
    border-color: var(--color-ink);
    background: var(--color-ink);
    color: var(--color-surface);
    font-weight: 700;
  }
}

.ui-badge {
  display: inline-block;
  border-radius: var(--radius-full);
  font-weight: 700;

  &--drop {
    background: var(--color-ink);
    color: var(--color-accent-badge-text);
    font-size: 12px;
    font-weight: 800;
    padding: 4px 9px;
  }

  &--category {
    background: var(--color-accent-soft);
    color: var(--color-accent-deep);
    font-size: 11px;
    padding: 3px 9px;
  }

  &--state {
    background: var(--color-accent-soft);
    color: var(--color-accent-deep);
    font-size: 12px;
    padding: 3px 9px;
  }
}

.ui-stat {
  background: var(--color-accent-soft-2);
  border-radius: 16px;
  padding: 18px 16px;

  &--boxed {
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  &__label {
    display: block;
    font-size: 12px;
    color: var(--color-muted-2);
    margin-bottom: 6px;
  }

  &__value {
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
}

.ui-section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;

  &__title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0;
  }

  h1.ui-section-heading__title { font-size: 32px; }
}

.ui-input {
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-input);
  padding: 14px 18px;
  font-size: 14.5px;
  font-family: inherit;
  background: var(--color-surface);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: var(--color-accent-strong);
    box-shadow: var(--focus-ring);
  }
}

select.ui-input,
textarea.ui-input {
  border-radius: var(--radius-md);
  padding: 11px 12px;
  font-size: 13.5px;
}

textarea.ui-input {
  min-height: 96px;
  resize: vertical;
}
```

`src/app/globals.scss`의 `@use "./styles/base";` 다음 줄에 `@use "./styles/ui";` 추가.

참고: `Input`은 별도 컴포넌트 대신 `.ui-input` 클래스로 제공한다(기존 코드가 raw `<input>`에 id/label 연결을 이미 갖고 있어 클래스 부착이 가장 단순·유지보수 용이).

- [ ] **Step 6: 빌드 확인 + 커밋**

Run: `npm run lint; npm run build`
Expected: 통과

```bash
git add src/components/ui src/app/styles/_ui.scss src/app/globals.scss package.json package-lock.json
git commit -m "feat: 공통 UI 컴포넌트(Button·Chip·Badge·StatTile 등)와 ui 스타일 추가"
```

---

### Task 3: 헤더 + 푸터

**Files:**
- Modify: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`
- Modify: `src/app/layout.tsx` (Footer 추가)
- Modify: `src/app/styles/_header.scss` (전체 재작성)
- Create: `src/app/styles/_footer.scss`
- Modify: `src/app/globals.scss` (`@use "./styles/footer";` 추가)

**Interfaces:**
- Consumes: Task 1 토큰
- Produces: 없음 (독립 레이아웃)

- [ ] **Step 1: Header.tsx 마크업 교체**

로직(수퍼베이스 auth, handleSignOut, loginHref)은 그대로 두고 JSX만 교체. `usePathname`으로 활성 nav 표시:

```tsx
const navItems = [
  { href: "/catalog", label: "카탈로그" },
  { href: "/deals", label: "급락 특가" },
  { href: "/products", label: "실시간 검색" },
  { href: "/hospitals", label: "동물병원" },
  { href: "/guide", label: "가이드" },
  { href: "/saved", label: "관심상품" }
];
```

```tsx
return (
  <header className="header">
    <div className="header__inner">
      <Link className="header__logo" href="/">
        <span className="header__logo-mark" aria-hidden="true">P</span>
        <strong>펫픽</strong>
        <small>반려용품 가격추적</small>
      </Link>
      <nav className="header__nav" aria-label="주요 메뉴">
        {navItems.map((item) => (
          <Link
            className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "header__nav-link header__nav-link--active" : "header__nav-link"}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
        {isReady && user ? (
          <button className="header__auth" type="button" onClick={handleSignOut}>로그아웃</button>
        ) : (
          <Link className="header__auth" href={loginHref}>로그인</Link>
        )}
      </nav>
    </div>
  </header>
);
```

- [ ] **Step 2: `_header.scss` 재작성**

```scss
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--color-ink);

    &:hover { color: var(--color-ink); }

    strong {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    small {
      font-size: 12px;
      color: var(--color-muted-4);
      font-weight: 400;
    }
  }

  &__logo-mark {
    width: 34px;
    height: 34px;
    border-radius: 11px;
    background: var(--color-accent-logo);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
    color: var(--color-accent-ink);
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__nav-link {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--color-surface-info-ink);
    padding: 9px 14px;
    border-radius: var(--radius-full);

    &:hover {
      background: var(--color-accent-nav);
      color: var(--color-accent-nav-ink);
    }

    &--active {
      background: var(--color-accent-nav);
      color: var(--color-accent-nav-ink);
      font-weight: 700;
    }
  }

  &__auth {
    margin-left: 8px;
    border: none;
    cursor: pointer;
    background: var(--color-ink);
    color: var(--color-surface);
    font-size: 13px;
    font-weight: 600;
    padding: 9px 16px;
    border-radius: var(--radius-full);
    font-family: inherit;

    &:hover {
      background: var(--color-ink-secondary);
      color: var(--color-surface);
    }
  }
}
```

- [ ] **Step 3: Footer 생성 + layout 등록**

`src/components/Footer.tsx`:

```tsx
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>펫픽 · 반려동물 용품 가격추적 서비스</span>
        <small>표시 가격은 수집 시점 기준이며 실제 판매가와 다를 수 있습니다.</small>
      </div>
    </footer>
  );
}
```

`src/app/styles/_footer.scss`:

```scss
.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  margin-top: 80px;

  &__inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 28px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;

    span { font-size: 12.5px; color: var(--color-muted-3); }
    small { font-size: 12px; color: #b4c0ca; }
  }
}
```

`layout.tsx`의 `{children}` 아래에 `<Footer />` 추가, `globals.scss`에 `@use "./styles/footer";` 추가.

- [ ] **Step 4: 검증 + 커밋**

Run: `npm run lint; npm run build`
브라우저(preview_start `dev`)로 헤더 sticky/blur, 활성 nav 필, 푸터 확인.

```bash
git add src/components/Header.tsx src/components/Footer.tsx src/app/layout.tsx src/app/styles/_header.scss src/app/styles/_footer.scss src/app/globals.scss
git commit -m "feat: 시안 스타일 헤더·푸터 적용"
```

---

### Task 4: PriceCard 재작성

**Files:**
- Modify: `src/components/PriceCard.tsx`
- Modify: `src/app/styles/_catalog.scss`의 `.price-card` 블록 (전체 재작성)

**Interfaces:**
- Consumes: `Badge`(Task 2), `ProductPriceStats`(기존 `@/lib/price-stats`), `formatDropLabel`, `formatPrice`
- Produces: `PriceCard({ stats })` — props 기존과 동일. 홈/카탈로그/특가에서 그대로 사용.

- [ ] **Step 1: PriceCard.tsx 교체**

`ProductPriceStats`의 카테고리 필드는 `category`가 아니라 **`categorySlug: string | null`** 이다. 시안의 카테고리 칩을 표시하려면 `@/lib/categories`의 `categories` 배열로 slug → 라벨을 변환한다. 새 데이터 페칭 없이 기존 필드만 사용하므로 로직 무변경 원칙에 부합한다.

```tsx
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { categories } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { formatDropLabel } from "@/lib/price-stats";
import type { ProductPriceStats } from "@/lib/price-stats";

export default function PriceCard({ stats }: { stats: ProductPriceStats }) {
  const dropLabel = formatDropLabel(stats.dropPct);
  const categoryLabel = categories.find((category) => category.slug === stats.categorySlug)?.label;

  return (
    <Link className="price-card" href={`/catalog/${stats.externalProductId}`}>
      <div className="price-card__media">
        {stats.imageUrl ? <Image src={stats.imageUrl} alt="" width={240} height={180} /> : <span className="price-card__placeholder">상품 이미지</span>}
        {dropLabel ? <span className="price-card__drop"><Badge variant="drop">{dropLabel}</Badge></span> : null}
      </div>
      {categoryLabel ? <Badge variant="category">{categoryLabel}</Badge> : null}
      <span className="price-card__name line-clamp-2">{stats.title}</span>
      <div className="price-card__foot">
        <em className="price-card__price">{formatPrice(stats.currentPrice)}</em>
        <small className="price-card__meta">{stats.mallName ?? "쇼핑몰 확인 필요"}</small>
      </div>
    </Link>
  );
}
```

`.price-card`에 `display: flex`를 쓰므로 카테고리 Badge(`align-self: flex-start`)가 늘어나지 않도록 SCSS에서 `.ui-badge { align-self: flex-start; }`를 `.price-card` 블록에 포함한다.

- [ ] **Step 2: `.price-card` SCSS 재작성**

```scss
.price-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 14px;
  color: var(--color-ink);
  box-shadow: var(--shadow-card);
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
    color: var(--color-ink);
  }

  &__media {
    position: relative;
    height: 160px;
    border-radius: var(--radius-input);
    background: var(--color-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 6px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__placeholder {
    font-family: ui-monospace, monospace;
    font-size: 11px;
    color: #93a3b0;
  }

  &__drop {
    position: absolute;
    top: 10px;
    left: 10px;
  }

  &__name {
    font-size: 13.5px;
    line-height: 1.45;
    color: #3a4854;
    min-height: 39px;
  }

  &__foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  &__price {
    font-style: normal;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  &__meta {
    font-size: 11.5px;
    color: var(--color-muted-3);
  }
}
```

- [ ] **Step 3: 검증 + 커밋**

Run: `npm run lint; npm run build`
브라우저로 홈/카탈로그 카드가 시안(다크 drop 배지 오버레이, hover 리프트)과 일치하는지 확인.

```bash
git add src/components/PriceCard.tsx src/app/styles/_catalog.scss
git commit -m "style: PriceCard를 시안 카드(배지 오버레이·hover 리프트)로 재작성"
```

---

### Task 5: 홈 페이지

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/CategoryTopProducts.tsx` (칩 스타일만 교체, 기능·ARIA 유지)
- Create: `src/app/styles/_home.scss`
- Modify: `src/app/globals.scss` (`@use "./styles/home";` 추가)

**Interfaces:**
- Consumes: `Button`, `StatTile`, `SectionHeading`, `Reveal`, `Chip`, `PriceCard`, 기존 `fetchCatalogSummary/fetchTopDrops/fetchCategoryTopDrops`, `categories`, `formatCheckedAt`

**결정 사항 (사용자 승인):** `CategoryTopProducts`(카테고리별 인기 상품 탭)는 시안에 없지만 **유지**한다. 직전 플랜에서 의도적으로 만든 기능이므로 삭제하지 않고, 카테고리 타일 섹션 아래에 그대로 두되 새 디자인 토큰·`Chip` 스타일로만 재스타일링한다. `fetchCategoryTopDrops` 호출도 유지.

- [ ] **Step 1: page.tsx 마크업 교체**

주요 변경: 히어로 2열 그리드(좌 카피+검색 / 우 "오늘의 수집 현황" 카드), 급락 특가 4개(`fetchTopDrops(4)`), 카테고리 타일 버튼형, 하단 2열 카드(병원=그린, 가이드=흰). `CategoryTopProducts`는 유지. 시안 문구 그대로:

```tsx
import Link from "next/link";
import PriceCard from "@/components/PriceCard";
import CategoryTopProducts from "@/components/CategoryTopProducts";
import Button from "@/components/ui/Button";
import StatTile from "@/components/ui/StatTile";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import EmptyState from "@/components/ui/EmptyState";
import { fetchCatalogSummary, fetchCategoryTopDrops, fetchTopDrops } from "@/lib/catalog";
import { formatCheckedAt } from "@/lib/format";
import { categories } from "@/lib/categories";

export const revalidate = 3600;

export default async function HomePage() {
  const [summary, topDrops, categoryTop] = await Promise.all([
    fetchCatalogSummary(),
    fetchTopDrops(4),
    fetchCategoryTopDrops(8)
  ]);

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="home-hero__status">
            <span aria-hidden="true" />
            매일 오전 자동 수집 중
          </p>
          <h1>반려용품 최저가를<br />매일 기록합니다.</h1>
          <p>등록된 상품의 가격을 매일 확인해, 최근 14일 최고가 대비 하락한 상품을 모아 보여드려요.</p>
          <form className="home-hero__search" action="/catalog">
            <input className="ui-input" name="query" aria-label="상품 검색어" placeholder="강아지 사료, 고양이 모래, 배변패드 검색" />
            <Button type="submit" variant="primary">검색하기</Button>
          </form>
        </div>
        <aside className="home-hero__panel">
          <span className="home-hero__panel-label">오늘의 수집 현황</span>
          <div className="home-hero__stats">
            <StatTile label="추적 상품" value={`${summary.trackedCount.toLocaleString("ko-KR")}개`} />
            <StatTile label="가격 기록" value={`${summary.historyCount.toLocaleString("ko-KR")}건`} />
            <StatTile label="오늘 하락" value={`${topDrops.length}개`} />
          </div>
          <div className="home-hero__collect">
            <span>최근 수집 · {summary.lastCollectedAt ? formatCheckedAt(summary.lastCollectedAt) : "수집 전"}</span>
            <strong>{summary.lastCollectedAt ? "정상 작동" : "대기 중"}</strong>
          </div>
        </aside>
      </section>

      <Reveal>
        <section className="home-section">
          <SectionHeading eyebrow="급락 특가" title="최근 가격이 내려간 상품" action={<Link className="home-section__more" href="/deals">전체 보기 →</Link>} />
          {topDrops.length ? (
            <div className="card-grid">
              {topDrops.map((stats) => (
                <PriceCard stats={stats} key={stats.externalProductId} />
              ))}
            </div>
          ) : (
            <EmptyState>아직 수집된 가격이 없어요. 매일 자동 수집이 시작되면 이곳에 급락 특가가 표시됩니다.</EmptyState>
          )}
        </section>
      </Reveal>

      <Reveal>
        <section className="home-section">
          <SectionHeading eyebrow="카테고리" title="카테고리로 둘러보기" />
          <div className="home-cats">
            {categories.map((category) => (
              <Link className="home-cats__item" href={`/catalog?category=${category.slug}`} key={category.slug}>
                <span>{category.label}</span>
                <small>둘러보기 →</small>
              </Link>
            ))}
          </div>
          {Object.keys(categoryTop).length ? (
            <CategoryTopProducts categories={categories} productsByCategory={categoryTop} />
          ) : null}
        </section>
      </Reveal>

      <Reveal>
        <section className="home-links">
          <div className="home-links__card home-links__card--green">
            <strong>동물병원 찾기</strong>
            <p>공공데이터 기반으로 우리 동네 동물병원을 확인하세요.</p>
            <Button href="/hospitals" variant="green-dark" size="sm">병원 보기</Button>
          </div>
          <div className="home-links__card">
            <strong>반려생활 가이드</strong>
            <p>사료, 위생, 건강 관리에 필요한 정보를 확인하세요.</p>
            <Button href="/guide" variant="outline" size="sm">가이드 보기</Button>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
```

참고: 시안의 카테고리 타일 "n개 추적" 카운트는 카테고리별 개수 쿼리가 없으므로 "둘러보기 →"로 대체(로직 추가 금지 원칙).

- [ ] **Step 1b: CategoryTopProducts 재스타일링**

`src/components/CategoryTopProducts.tsx`의 로직·상태·ARIA 속성(`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `id`, `aria-labelledby`, `role="tabpanel"`)은 **한 글자도 바꾸지 말고**, 탭 버튼의 `.filter-strip__item` 클래스만 `Chip` 컴포넌트로 교체한다. `Chip`은 `...rest`를 전달하므로 ARIA 속성이 그대로 통과한다:

```tsx
<div className="filter-strip" role="tablist" aria-label="카테고리별 인기상품">
  {categories.map((category) => (
    <Chip
      key={category.slug}
      id={`category-top-tab-${category.slug}`}
      active={selected === category.slug}
      role="tab"
      aria-selected={selected === category.slug}
      aria-controls="category-top-panel"
      onClick={() => setSelected(category.slug)}
    >
      {category.label}
    </Chip>
  ))}
</div>
```

`.filter-strip`은 `_home.scss`에서 `display: flex; flex-wrap: wrap; gap: 7px; margin: 24px 0 16px;`로 재정의(구 `_base.scss` 블록은 Task 12에서 정리). `.category-top__more`는 `font-size: 13.5px; font-weight: 600;`.

- [ ] **Step 2: `_home.scss` 작성**

```scss
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

.home-hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 56px 0 40px;

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 7px 14px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--color-accent-deep);
    margin: 0 0 20px;

    span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-accent-strong);
    }
  }

  h1 {
    font-size: 44px;
    line-height: 1.22;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0 0 16px;
    text-wrap: pretty;
  }

  &__copy > p:not(.home-hero__status) {
    font-size: 16px;
    line-height: 1.65;
    color: var(--color-muted);
    margin: 0 0 28px;
    max-width: 440px;
  }

  &__search {
    display: flex;
    gap: 8px;
    max-width: 480px;

    input { flex: 1; }
  }

  &__panel {
    background: var(--color-surface);
    border-radius: 24px;
    padding: 28px;
    box-shadow: var(--shadow-modal);
    display: grid;
    gap: 14px;
  }

  &__panel-label {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--color-muted-4);
    letter-spacing: 0.04em;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .ui-stat__value { font-size: 21px; }
  }

  &__collect {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-surface-info);
    border-radius: 16px;
    padding: 14px 18px;

    span { font-size: 13px; color: var(--color-surface-info-ink); }
    strong { font-size: 12px; font-weight: 700; color: var(--color-accent-deep); }
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    padding-top: 36px;

    h1 { font-size: 34px; }
  }
}

.home-section {
  padding: 32px 0;

  &__more {
    font-size: 13.5px;
    font-weight: 600;
  }
}

.home-cats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;

  &__item {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    border-radius: 16px;
    padding: 20px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--color-ink-secondary);
    transition: border-color 0.15s, background 0.15s;

    span { font-size: 14.5px; font-weight: 700; }
    small { font-size: 12px; color: var(--color-muted-3); }

    &:hover {
      border-color: var(--color-accent);
      background: #fbfdf6;
      color: var(--color-ink-secondary);
    }
  }
}

.home-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 32px 0 0;

  &__card {
    background: var(--color-surface);
    border-radius: var(--radius-card-lg);
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    box-shadow: var(--shadow-card);

    strong { font-size: 16.5px; font-weight: 800; }
    p { font-size: 13.5px; line-height: 1.6; color: var(--color-muted); margin: 0 0 6px; }

    &--green {
      background: var(--color-accent-card);
      box-shadow: none;

      strong { color: var(--color-accent-ink); }
      p { color: var(--color-accent-card-ink); }
    }
  }

  @media (max-width: 720px) { grid-template-columns: 1fr; }
}
```

`globals.scss`에 `@use "./styles/home";` 추가.

- [ ] **Step 3: 검증 + 커밋**

Run: `npm run lint; npm run build`
브라우저로 홈 전체가 시안과 일치하는지 대조(히어로 2열, 수집 현황 카드, 카드 4개, 카테고리 타일, 하단 2열).

```bash
git add src/app/page.tsx src/components/CategoryTopProducts.tsx src/app/styles/_home.scss src/app/globals.scss
git commit -m "feat: 홈을 리디자인 시안 레이아웃으로 교체"
```

기존 `_base.scss`/`_catalog.scss`에 남은 `.home-hero`, `.home-stats`, `.home-links`, `.category-tiles` 구버전 블록이 있으면 이 커밋에서 삭제(`.category-top` 블록은 유지·갱신).

브라우저 확인 시 카테고리 탭 클릭 → 카드 목록 전환, `aria-selected` 갱신이 기존대로 작동하는지 함께 확인.

---

### Task 6: 카탈로그 + 급락 특가

**Files:**
- Modify: `src/app/catalog/page.tsx`
- Modify: `src/app/catalog/catalog-filters-client.tsx` (읽고 칩·인풋 클래스만 교체)
- Modify: `src/app/deals/page.tsx`
- Modify: `src/app/deals/deals-tabs-client.tsx` (칩 클래스 교체)
- Modify: `src/app/styles/_catalog.scss` (필터 카드·결과 라인·페이지네이션)

**Interfaces:**
- Consumes: `Chip`, `Button`, `EmptyState`, `PriceCard`, `.ui-input`

- [ ] **Step 1: 필터 클라이언트 두 개 읽기**

`catalog-filters-client.tsx`, `deals-tabs-client.tsx`를 읽고 현재 구조 파악. 로직(라우터 push, 파라미터 구성)은 유지.

- [ ] **Step 2: 카탈로그 필터를 시안 카드로 감싸기**

`catalog-filters-client.tsx`에서 검색 인풋+버튼과 카테고리 버튼 행을 다음 구조로:

```tsx
<div className="filter-card">
  <form className="filter-card__search" /* 기존 submit 로직 */>
    <input className="ui-input" /* 기존 value/onChange */ placeholder="상품명 검색" />
    <Button type="submit" variant="dark">검색</Button>
  </form>
  <div className="filter-card__chips">
    {/* 전체 + categories: 기존 클릭 로직 그대로, 렌더만 Chip으로 */}
    <Chip active={/* 현재 선택 */} onClick={/* 기존 */}>{label}</Chip>
  </div>
</div>
```

기존에 정렬 select·펫 필터·가격 필터 등이 있으면 제거하지 말고 `filter-card__chips` 아래 행에 `.ui-input`/`Chip`으로 배치.

`deals-tabs-client.tsx`는 카드 없이 `Chip` 행만(`<div className="chip-row">`).

- [ ] **Step 3: 페이지 마크업 정리**

`catalog/page.tsx`: `page-heading` 유지(시안 문구 동일), 결과 라인은 `<p className="result-summary">총 {total}개 상품 · 하락률순</p>` 형태(페이지 정보는 유지 가능), `EmptyState` 컴포넌트로 교체, 페이지네이션 링크는 `.ui-button ui-button--outline ui-button--sm` 클래스 적용.
`deals/page.tsx`: 동일 패턴.

- [ ] **Step 4: `_catalog.scss` 재작성 (price-card 블록은 Task 4에서 완료)**

```scss
.catalog-page,
.deals-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.filter-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 18px 20px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 26px;

  &__search {
    display: flex;
    gap: 8px;

    input {
      flex: 1;
      max-width: 340px;
      border-radius: var(--radius-md);
      padding: 11px 15px;
      font-size: 14px;
    }
  }

  &__chips {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
  }
}

.chip-row {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-bottom: 26px;
}

.result-summary {
  font-size: 13px;
  color: var(--color-muted-2);
  margin: 0 0 16px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;

  span { font-size: 13px; color: var(--color-muted-2); }
}
```

참고: 스펙의 "칩 전환 시 그리드 layout 애니메이션"은 카탈로그/특가가 URL 파라미터 기반 서버 렌더링이라 로직 무변경 원칙과 충돌하므로 적용하지 않는다(추후 클라이언트 필터링 전환 시 재검토). Motion은 홈의 `Reveal`만 사용.

- [ ] **Step 5: 검증 + 커밋**

Run: `npm run lint; npm run build`
브라우저로 `/catalog`(필터 카드, 칩 활성=다크 필), `/deals`(칩 행) 확인. 필터 동작(카테고리 클릭 → URL 변경 → 목록 갱신)이 기존대로 작동하는지 클릭 테스트.

```bash
git add src/app/catalog src/app/deals src/app/styles/_catalog.scss
git commit -m "feat: 카탈로그·급락 특가 페이지 시안 적용"
```

---

### Task 7: 실시간 검색 페이지

**Files:**
- Modify: `src/app/products/product-search-client.tsx`
- Modify: `src/app/styles/_products.scss` (검색 카드·결과 카드 재작성)

**Interfaces:**
- Consumes: `Chip`, `Button`, `EmptyState`, `Badge`, `.ui-input`

- [ ] **Step 1: 마크업 교체 (로직 전부 유지)**

`product-search-client.tsx`의 state·handler는 그대로. JSX 구조를 시안대로:

- `<main className="products-page">` max-width 900px.
- page-heading 유지(문구 동일).
- 검색 폼 + 펫 칩 + 실제 검색어 + 빠른 검색어를 하나의 `search-card`로 통합:

```tsx
<div className="search-card">
  <form className="search-card__row" onSubmit={handleSearch}>
    <input className="ui-input" id="product-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="사료, 간식, 배변패드" aria-label="검색어" />
    <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? "검색 중" : "검색"}</Button>
  </form>
  <div className="search-card__pets">
    {petOptions.map((option) => (
      <Chip key={option.value} active={petType === option.value} onClick={() => setPetType(option.value)}>{option.label}</Chip>
    ))}
    <span className="search-card__effective">실제 검색어: <strong>{query.trim() ? buildPetShoppingQuery(query, { petType, customPet }) : "검색어 입력 전"}</strong></span>
  </div>
  {petType === "custom" ? (
    <label className="search-card__custom" htmlFor="custom-pet">
      반려동물 직접입력
      <input className="ui-input" id="custom-pet" value={customPet} onChange={(e) => setCustomPet(e.target.value)} placeholder="예: 앵무새, 거북이, 햄스터" />
    </label>
  ) : null}
  <div className="search-card__quick">
    {recommendedQueries.map((item) => (
      <button className="search-card__quick-item" type="button" key={item} onClick={() => { setQuery(item); searchProducts(item, petType, customPet); }}>{item}</button>
    ))}
  </div>
</div>
```

- 빈 상태: `<EmptyState title="검색어를 입력해 보세요">반려동물 용품의 실시간 가격을 확인해드려요.</EmptyState>`
- 결과 카드(`product-card`)는 PriceCard 스타일 준용 + 하단 버튼 3개(`Button variant="outline"` 관심상품 저장 / `variant="ghost"` 상세 보기 / `variant="primary"` href external 구매하러 가기).

- [ ] **Step 2: `_products.scss` 재작성**

```scss
.products-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.search-card {
  background: var(--color-surface);
  border-radius: var(--radius-card-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 26px;

  &__row {
    display: flex;
    gap: 8px;

    input { flex: 1; }
  }

  &__pets {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  &__effective {
    font-size: 12.5px;
    color: var(--color-muted-3);
    margin-left: 6px;

    strong { color: #3a4854; }
  }

  &__custom {
    display: grid;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--color-surface-info-ink);
  }

  &__quick {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
    border-top: 1px solid var(--color-divider);
    padding-top: 16px;
  }

  &__quick-item {
    border: 1px solid var(--color-border);
    background: #f8fafc;
    color: var(--color-surface-info-ink);
    font-size: 12.5px;
    font-weight: 600;
    padding: 7px 13px;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-family: inherit;

    &:hover {
      border-color: var(--color-accent-strong);
      background: #fbfdf6;
    }
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
  margin-top: 26px;
}

.product-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 14px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 8px;

  img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: var(--radius-input);
  }

  h2 {
    font-size: 13.5px;
    line-height: 1.45;
    font-weight: 400;
    color: #3a4854;
    margin: 0;
  }

  &--meta {
    display: flex;
    justify-content: space-between;
    font-size: 11.5px;
    color: var(--color-muted-3);

    em { font-style: normal; }
  }

  &--body p {
    font-size: 17px;
    font-weight: 800;
    margin: 0;
  }

  &--body small {
    font-size: 11.5px;
    color: var(--color-muted-3);
  }

  &--actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 6px;
  }
}

.notice {
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 13px;
  margin: 0 0 16px;

  &--error {
    background: #fdf1ec;
    color: var(--color-danger);
  }

  &--success {
    background: var(--color-accent-soft);
    color: var(--color-accent-deep);
  }
}
```

- [ ] **Step 3: 검증 + 커밋**

Run: `npm run lint; npm run build`
브라우저에서 `/products` 검색 실행(예: "강아지 사료") → 결과 카드·저장 버튼 동작 확인, 빈 상태 점선 카드 확인.

```bash
git add src/app/products/product-search-client.tsx src/app/styles/_products.scss
git commit -m "feat: 실시간 검색 페이지 시안 적용"
```

---

### Task 8: 상품 상세 (catalog/[id] + Recharts 차트)

**Files:**
- Modify: `src/app/catalog/[id]/page.tsx`
- Modify: `src/app/catalog/[id]/price-chart.tsx` (Recharts 막대그래프로 교체)
- Modify: `src/app/catalog/[id]/save-button-client.tsx` (버튼 클래스만)
- Create: `src/app/styles/_detail.scss`
- Modify: `src/app/globals.scss` (`@use "./styles/detail";`)

**Interfaces:**
- Consumes: `Button`, `Badge`, `SectionHeading`, `EmptyState`, 기존 `PriceHistoryPoint = { price: number; checkedAt: string; mallName: string | null }`, `src/lib/price-chart.ts`의 기존 데이터 가공 함수(파일 읽고 재사용)
- Produces: `PriceChart({ points }: { points: PriceHistoryPoint[] })` — 시그니처 유지

- [ ] **Step 1: 기존 price-chart.tsx와 lib/price-chart.ts 읽기**

데이터 가공(일자 집계 등) 로직 파악. 가공 로직은 lib에 있으면 재사용.

- [ ] **Step 2: PriceChart를 Recharts 막대그래프로 교체**

```tsx
"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis } from "recharts";
import type { PriceHistoryPoint } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export default function PriceChart({ points }: { points: PriceHistoryPoint[] }) {
  const data = points.slice(-7).map((point) => ({
    date: new Date(point.checkedAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }),
    price: point.price
  }));
  const lastIndex = data.length - 1;
  const min = Math.min(...data.map((d) => d.price));

  return (
    <div className="price-history-chart">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 24, left: 8, right: 8 }}>
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-3)" }} />
          <Bar dataKey="price" radius={[10, 10, 4, 4]} maxBarSize={52} isAnimationActive>
            {data.map((entry, index) => (
              <Cell key={entry.date} fill={index === lastIndex ? "var(--color-accent)" : "var(--color-chart-bar)"} />
            ))}
            <LabelList dataKey="price" position="top" formatter={(value: number) => formatPrice(value)} style={{ fontSize: 11.5, fontWeight: 700, fill: "var(--color-accent-deep)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

주의: 기존 lib/price-chart.ts에 일자별 최저가 집계 함수가 있으면 `points.slice(-7)` 대신 그것을 사용. Y축 도메인은 시안처럼 막대 높이 차이가 보이도록 `<YAxis hide domain={[min - (max - min || min * 0.05), "dataMax"]} />` 추가 검토(막대가 전부 같은 높이로 보이면 적용).

- [ ] **Step 3: 상세 페이지 마크업 교체**

`catalog/[id]/page.tsx` — 데이터 페칭·JSON-LD 유지, JSX를 시안 구조로:

```tsx
<main className="detail-page">
  {/* JSON-LD script 유지 */}
  <section className="detail-card">
    <div className="detail-card__media">
      {stats.imageUrl ? <Image src={stats.imageUrl} alt="" width={480} height={360} /> : <span>상품 이미지</span>}
    </div>
    <div className="detail-card__body">
      <p className="detail-card__source">네이버 쇼핑 기준</p>
      <h1>{stats.title}</h1>
      <div className="detail-card__price">
        <strong>{formatPrice(stats.currentPrice)}</strong>
        {dropLabel ? <Badge variant="drop">{dropLabel}</Badge> : null}
      </div>
      <dl className="detail-meta">
        <div><dt>14일 최고가</dt><dd>{formatPrice(stats.maxPrice14d)}</dd></div>
        <div>
          <dt>역대 최저가</dt>
          <dd>
            {formatPrice(stats.minPriceAll)}
            {nearAllTimeLow ? <Badge variant="state">최저가 근접</Badge> : null}
          </dd>
        </div>
        <div><dt>마지막 가격 확인</dt><dd>{formatCheckedAt(stats.lastCheckedAt)}</dd></div>
      </dl>
      <div className="detail-card__actions">
        <SaveButtonClient externalProductId={stats.externalProductId} currentPrice={stats.currentPrice} />
        <Button href={stats.productUrl} external variant="primary">구매하러 가기</Button>
      </div>
      <p className="detail-card__notice">표시된 가격은 최근 확인된 가격이며, 실제 구매 가격은 쇼핑몰에서 달라질 수 있습니다.</p>
    </div>
  </section>

  <section className="detail-section">
    <SectionHeading eyebrow="가격 기록" title="최근 확인된 가격 기록" />
    {history.length >= 2 ? (
      <div className="detail-chart-card"><PriceChart points={history} /></div>
    ) : (
      <EmptyState>가격 기록이 더 쌓이면 추이 차트가 표시됩니다.</EmptyState>
    )}
  </section>
</main>
```

`save-button-client.tsx`는 읽은 뒤 렌더 버튼에 `ui-button ui-button--outline` 클래스 적용(로직 유지).

- [ ] **Step 4: `_detail.scss` 작성**

```scss
.detail-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.detail-card {
  background: var(--color-surface);
  border-radius: var(--radius-card-xl);
  padding: 28px;
  box-shadow: var(--shadow-card);
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 32px;
  align-items: start;

  &__media {
    height: 340px;
    border-radius: 18px;
    background: var(--color-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
    span { font-family: ui-monospace, monospace; font-size: 11px; color: #93a3b0; }
  }

  &__source {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-muted-4);
    margin: 0 0 10px;
  }

  h1 {
    font-size: 24px;
    line-height: 1.4;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 14px;
    text-wrap: pretty;
  }

  &__price {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    strong { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__notice {
    font-size: 12px;
    color: var(--color-muted-3);
    margin: 14px 0 0;
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;

    &__media { height: 260px; }
  }
}

.detail-meta {
  margin: 0 0 22px;
  border-top: 1px solid var(--color-divider);

  div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-divider);
    font-size: 13.5px;

    dt { color: var(--color-muted-2); }
    dd {
      margin: 0;
      font-weight: 600;
      color: var(--color-ink-secondary);
      text-align: right;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.detail-section {
  margin-top: 40px;
}

.detail-chart-card {
  background: var(--color-surface);
  border-radius: var(--radius-card-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
}
```

- [ ] **Step 5: 검증 + 커밋**

Run: `npm run lint; npm run test; npm run build`
Expected: `price-chart.test.ts` 포함 전부 통과(가공 로직을 lib에서 재사용했으므로).
브라우저로 상세 페이지: 2열 카드, 메타 리스트, 막대 차트(마지막 막대 라임) 확인.

```bash
git add src/app/catalog/[id] src/app/styles/_detail.scss src/app/globals.scss
git commit -m "feat: 카탈로그 상세를 시안 레이아웃 + Recharts 막대 차트로 교체"
```

---

### Task 9: 실시간 검색 상세 (products/[id])

**Files:**
- Modify: `src/app/products/[id]/product-detail-client.tsx`
- Modify: `src/app/styles/_detail.scss` (후기·가격 기록 리스트 블록 추가)

**Interfaces:**
- Consumes: Task 8의 `.detail-card`/`.detail-meta`/`.detail-section`, `Button`, `StatTile`, `SectionHeading`, `EmptyState`, `.ui-input`

- [ ] **Step 1: 마크업 교체 (로직 전부 유지)**

`product-detail-client.tsx`의 state·Supabase 로직·handler는 그대로. JSX만:

- 상단: Task 8과 동일한 `.detail-card` 구조 (source 라벨은 기존 `getSourceLabel(product.source)` 사용, 메타는 카테고리/쇼핑몰/마지막 가격 확인).
- 가격 기록: `SectionHeading eyebrow="가격 기록" title="최근 확인된 가격 기록"` + 기존 히스토리 리스트를 흰 카드 행으로:

```tsx
<div className="history-card">
  {histories.map((history) => (
    <article className="history-card__row" key={history.id}>
      <strong>{formatPrice(history.price)}</strong>
      <span>{history.mall_name || getSourceLabel(history.source)}</span>
      <small>{formatCheckedAt(history.checked_at)}</small>
      <a href={history.product_url} target="_blank" rel="noreferrer">상품 링크</a>
    </article>
  ))}
</div>
```

- 후기: `SectionHeading eyebrow="후기" title="저장 상품과 연결된 후기"` + StatTile 4개(boxed, 기존 계산값) + 작성 폼을 흰 카드로:

```tsx
<div className="review-card">
  <form onSubmit={handleSubmitReview}>
    <div className="review-card__row">
      <label>별점
        <select className="ui-input" value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>
          {/* 기존 option 유지 */}
        </select>
      </label>
      <label>재구매 의사
        <select className="ui-input" value={repurchaseIntent} onChange={(e) => setRepurchaseIntent(e.target.value)}>
          {/* 기존 option 유지 */}
        </select>
      </label>
    </div>
    <label className="review-card__content">후기
      <textarea className="ui-input" value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} placeholder="써보니 어땠나요?" />
    </label>
    <Button type="submit" variant="dark" disabled={isSubmitting}>{isSubmitting ? "저장 중" : "후기 저장"}</Button>
  </form>
</div>
```

- 후기 목록은 흰 카드 리스트(`review-card__item`)로 유지.

- [ ] **Step 2: `_detail.scss`에 블록 추가**

```scss
.detail-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 18px;

  @media (max-width: 720px) { grid-template-columns: repeat(2, 1fr); }
}

.history-card {
  background: var(--color-surface);
  border-radius: var(--radius-card-lg);
  padding: 8px 24px;
  box-shadow: var(--shadow-card);

  &__row {
    display: flex;
    align-items: baseline;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid var(--color-divider);
    font-size: 13.5px;

    &:last-child { border-bottom: none; }

    strong { font-size: 15px; font-weight: 800; min-width: 90px; }
    span { color: var(--color-muted); flex: 1; }
    small { color: var(--color-muted-3); }
    a { font-size: 12.5px; font-weight: 600; }
  }
}

.review-card {
  background: var(--color-surface);
  border-radius: var(--radius-card-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);

  form { display: grid; gap: 14px; }

  label {
    display: grid;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--color-surface-info-ink);
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .ui-button { justify-self: start; }

  &__item {
    border-top: 1px solid var(--color-divider);
    padding: 16px 0;
    font-size: 13.5px;

    strong { font-weight: 800; margin-right: 8px; }
    span { color: var(--color-accent-deep); font-size: 12px; }
    p { margin: 8px 0 4px; line-height: 1.6; color: var(--color-ink-secondary); }
    small { color: var(--color-muted-3); }
  }
}
```

- [ ] **Step 3: 검증 + 커밋**

Run: `npm run lint; npm run build`
브라우저: 관심상품 저장/후기 작성 동작 확인(로그인 상태에서), 스타일 시안 대조.

```bash
git add src/app/products/[id]/product-detail-client.tsx src/app/styles/_detail.scss
git commit -m "feat: 실시간 검색 상세에 시안 스타일 적용 (후기 기능 유지)"
```

---

### Task 10: 관심상품 페이지

**Files:**
- Modify: `src/app/saved/saved-products-client.tsx`
- Modify: `src/app/styles/_saved.scss` (전체 재작성)

**Interfaces:**
- Consumes: `Button`, `Badge`, `StatTile`, `EmptyState`, `.ui-input`

- [ ] **Step 1: 마크업 교체 (로직·기능 전부 유지)**

state·handler(상태 변경, 가격 재조회, 후기, 삭제, 히스토리 토글) 그대로. JSX 구조:

- 통계: `<section className="detail-stat-grid">` + `StatTile boxed` 4개(기존 summary 값).
- 리스트 카드:

```tsx
<article className="saved-card" key={item.id}>
  <div className="saved-card__media">
    {product.image_url ? <Image src={product.image_url} alt="" width={180} height={135} /> : <span>이미지</span>}
  </div>
  <div className="saved-card__body">
    <span className="saved-card__source">{product.mall_name ?? "쇼핑몰 확인 필요"} · {getSourceLabel(product.source)}</span>
    <Link className="saved-card__title" href={`/products/${product.id}`}>{product.title}</Link>
    <div className="saved-card__price-row">
      <strong>{formatPrice(product.latest_price)}</strong>
      {priceDiff !== null ? <Badge variant="state">{getDiffLabel(priceDiff) || "가격 변동 없음"}</Badge> : null}
      <small>마지막 확인 {formatCheckedAt(product.last_synced_at)}</small>
    </div>
    <label className="saved-card__status" htmlFor={`status-${item.id}`}>
      상태
      <select className="ui-input" /* 기존 로직 */>{/* 기존 option */}</select>
    </label>
  </div>
  <div className="saved-card__actions">
    <Button variant="outline" size="sm" onClick={() => handleToggleHistory(item)}>{expandedHistoryId === item.id ? "가격 기록 닫기" : "가격 기록 보기"}</Button>
    <Button variant="outline" size="sm" onClick={() => handleRefreshPrice(item)} disabled={pendingId === item.id}>{pendingId === item.id ? "확인 중" : "현재 가격 확인"}</Button>
    <Button variant="primary" size="sm" href={product.product_url} external>구매하러 가기</Button>
    <Button variant="outline" size="sm" onClick={() => openReviewForm(item.id)}>후기 작성</Button>
    <Button variant="danger-text" size="sm" onClick={() => handleDelete(item.id)} disabled={pendingId === item.id}>관심상품 해제</Button>
  </div>
  {/* reviewingId === item.id: 기존 후기 폼을 .review-card 마크업(Task 9와 동일 클래스)으로 */}
  {/* expandedHistoryId === item.id: 기존 히스토리를 .history-card 마크업으로 */}
</article>
```

가격 변동 Badge: 하락이면 `variant="state"`(그린), 상승이면 `<span className="ui-badge ui-badge--up">` 사용 — `_saved.scss`에 `.ui-badge--up { background: #fdf1ec; color: var(--color-danger); font-size: 12px; padding: 3px 9px; }` 추가.

- [ ] **Step 2: `_saved.scss` 재작성**

```scss
.saved-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.saved-list {
  display: grid;
  gap: 16px;
}

.saved-card {
  background: var(--color-surface);
  border-radius: var(--radius-card-lg);
  padding: 20px;
  box-shadow: var(--shadow-card);
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 20px;
  align-items: center;

  &__media {
    height: 100px;
    border-radius: var(--radius-input);
    background: var(--color-canvas);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
    span { font-family: ui-monospace, monospace; font-size: 10px; color: #93a3b0; }
  }

  &__source {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--color-muted-4);
    margin-bottom: 6px;
  }

  &__title {
    display: block;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.5;
    color: var(--color-ink);
    margin-bottom: 8px;

    &:hover { color: var(--color-accent-deep); }
  }

  &__price-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;

    strong { font-size: 18px; font-weight: 800; }
    small { font-size: 12px; color: var(--color-muted-3); }
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--color-surface-info-ink);

    select { width: auto; }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;

    &__actions { flex-direction: row; flex-wrap: wrap; }
  }
}
```

기존 `_saved.scss`의 `.review-form`/`.saved-history` 스타일은 Task 9의 `.review-card`/`.history-card` 클래스를 재사용하므로 삭제.

- [ ] **Step 3: 검증 + 커밋**

Run: `npm run lint; npm run build`
브라우저(로그인 상태): 통계 4칸, 카드 레이아웃, 버튼 동작(상태 변경·기록 토글·해제 confirm) 확인.

```bash
git add src/app/saved/saved-products-client.tsx src/app/styles/_saved.scss
git commit -m "feat: 관심상품 페이지 시안 적용 (기존 기능 유지)"
```

---

### Task 11: 가이드 + 로그인

**Files:**
- Modify: `src/app/guide/page.tsx`
- Modify: `src/app/styles/_guide.scss`
- Modify: `src/app/auth/auth-client.tsx`
- Modify: `src/app/styles/_auth.scss`

**Interfaces:**
- Consumes: `Button`, `Badge`, `Reveal`, `.ui-input`

- [ ] **Step 1: 가이드 마크업 + SCSS**

`guide/page.tsx`: 카드에 `Badge variant="category"` 태그, CTA를 시안 그린 배너로(`Button href="/catalog" variant="green-dark"` — 시안의 이동 대상이 카탈로그이므로 기존 `/products`에서 변경):

```tsx
<section className="guide-cta">
  <div>
    <p className="guide-cta__label">용품 가격 확인</p>
    <strong>가이드에서 살펴본 용품의 가격도 확인해보세요.</strong>
  </div>
  <Button href="/catalog" variant="green-dark">가격 확인하기</Button>
</section>
```

`_guide.scss`:

```scss
.guide-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.guide-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.guide-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 24px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.15s;

  &:hover { transform: translateY(-3px); }

  h2 {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.01em;
    margin: 0;
  }

  p {
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-muted);
    margin: 0;
    flex: 1;
  }

  small { font-size: 12px; color: var(--color-muted-3); }

  .ui-badge { align-self: flex-start; }
}

.guide-cta {
  margin-top: 28px;
  background: var(--color-accent-card);
  border-radius: var(--radius-card-lg);
  padding: 26px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;

  &__label {
    font-size: 12px;
    font-weight: 700;
    color: var(--color-accent-card-ink);
    margin: 0 0 6px;
  }

  strong {
    font-size: 16.5px;
    font-weight: 800;
    color: var(--color-accent-ink);
  }
}
```

- [ ] **Step 2: 로그인 마크업 + SCSS**

`auth-client.tsx` — 로직 유지, JSX를 시안대로(중앙 로고 마크 + 타이틀 + 서브카피, 카드 안 혜택 박스 + 폼):

```tsx
<main className="auth-page">
  <div className="auth-head">
    <span className="auth-head__mark" aria-hidden="true">P</span>
    <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
    <p>로그인 후 관심상품 저장과 가격 변화 알림을 이용할 수 있어요.</p>
  </div>
  <section className="auth-card">
    <div className="auth-card__benefits">
      <strong>로그인 후 이용할 수 있어요.</strong>
      <span>· 관심상품 저장</span>
      <span>· 저장한 상품 가격 변화 확인</span>
      <span>· 상품 후기 작성</span>
    </div>
    <form className="auth-card__form" onSubmit={handleSubmit}>
      <label htmlFor="email">이메일
        <input className="ui-input" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
      </label>
      <label htmlFor="password">비밀번호
        <input className="ui-input" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="········" minLength={6} required />
      </label>
      <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? "처리 중" : mode === "login" ? "로그인" : "회원가입"}</Button>
    </form>
    {message ? <p className="notice notice--error">{message}</p> : null}
    <button className="auth-card__switch" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
      {mode === "login" ? "계정이 없으면 회원가입" : "이미 계정이 있으면 로그인"}
    </button>
  </section>
</main>
```

`_auth.scss`:

```scss
.auth-page {
  max-width: 440px;
  margin: 0 auto;
  padding: 64px 24px 80px;
}

.auth-head {
  text-align: center;
  margin-bottom: 28px;

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: var(--color-accent-logo);
    font-weight: 800;
    font-size: 22px;
    color: var(--color-accent-ink);
    margin-bottom: 14px;
  }

  h1 {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 8px;
  }

  p {
    font-size: 13.5px;
    color: var(--color-muted-2);
    margin: 0;
  }
}

.auth-card {
  background: var(--color-surface);
  border-radius: 24px;
  padding: 28px;
  box-shadow: var(--shadow-modal);
  display: grid;
  gap: 16px;

  &__benefits {
    background: var(--color-accent-soft-2);
    border-radius: var(--radius-input);
    padding: 16px 18px;
    display: grid;
    gap: 5px;

    strong { font-size: 13px; margin-bottom: 3px; }
    span { font-size: 12.5px; color: var(--color-muted); }
  }

  &__form {
    display: grid;
    gap: 14px;

    label {
      display: grid;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--color-surface-info-ink);
    }

    .ui-button {
      font-size: 14.5px;
      font-weight: 800;
      padding: 14px;
      border-radius: var(--radius-input);
    }
  }

  &__switch {
    border: none;
    background: none;
    cursor: pointer;
    color: var(--color-muted-2);
    font-size: 12.5px;
    font-weight: 600;
    font-family: inherit;
    text-decoration: underline;

    &:hover { color: var(--color-accent-deep); }
  }
}
```

- [ ] **Step 3: 검증 + 커밋**

Run: `npm run lint; npm run build`
브라우저: `/guide`, `/auth` 시안 대조, 로그인/회원가입 전환 동작 확인.

```bash
git add src/app/guide src/app/auth src/app/styles/_guide.scss src/app/styles/_auth.scss
git commit -m "feat: 가이드·로그인 페이지 시안 적용"
```

---

### Task 12: 동물병원 + 최종 정리·검증

**Files:**
- Modify: `src/app/hospitals/hospitals-client.tsx` (클래스만: 카드→흰 카드+토큰, 버튼→Button/Chip)
- Modify: `src/app/styles/_hospitals.scss` (새 토큰·카드 스타일로 색/라운드 치환)
- Modify: 잔여 구버전 스타일 정리

- [ ] **Step 1: hospitals 페이지 토큰 통일**

`hospitals-client.tsx`와 `_hospitals.scss`를 읽고: 레이아웃 구조는 유지, 색은 전부 토큰 변수로, 카드 radius는 `--radius-card`, 필터류 버튼은 `Chip`, 액션 버튼은 `Button`으로 교체. 페이지 컨테이너는 `max-width: 1200px; padding: 48px 24px 80px;`로 통일.

- [ ] **Step 2: 전역 잔여물 정리**

- `Grep`으로 `#2c6496|#82add4|#ddfd2c|#ff4800|--color-highlight|--color-ink-tertiary|--radius-chip` 검색 → 남은 참조 전부 새 토큰으로 치환.
- `Grep`으로 `button--primary|button--secondary|button--ghost|button--danger` 검색 → 남은 사용처를 `ui-button` 클래스 또는 `Button` 컴포넌트로 교체하고, `_base.scss`의 구 `.button` 블록 삭제.
- `_typography.scss` 확인: 시안 letter-spacing(-0.02~-0.03em)·굵기(800) 반영 여부 점검.

- [ ] **Step 3: 전체 검증**

Run: `npm run lint; npm run test; npm run build`
Expected: 전부 통과.

브라우저로 8개 라우트 전부 순회(`/`, `/catalog`, `/deals`, `/products`, `/catalog/[id]`, `/saved`, `/guide`, `/auth`, `/hospitals`) — 각 화면 스크린샷을 시안과 대조. 콘솔 에러 0건 확인(`read_console_messages`).

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "style: 동물병원 페이지 토큰 통일 및 구버전 스타일 정리"
```
