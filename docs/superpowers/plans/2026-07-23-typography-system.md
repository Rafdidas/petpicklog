# PetPick Typography System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce the Figma typography scale as a typed React component and migrate every PetPick screen away from page-local font sizing.

**Architecture:** `Typography.tsx` owns semantic rendering and compile-time-valid role/size combinations. `_typography.scss` owns every font size, weight, and line height; JSX supplies typography classes through the component, while native form controls use the same SCSS mixin. Existing page partials retain only layout, spacing, color, and interaction styling.

**Tech Stack:** Next.js 16, React 19, TypeScript 6 strict mode, SCSS, Vitest 4, `react-dom/server`

## Global Constraints

- Use Pretendard Variable through the existing `--font-sans` token.
- Use only `display`, `headline`, `title`, `label`, `bodyBold`, `body`, and `caption`.
- Use only the role-size pairs documented in `docs/superpowers/specs/2026-07-23-typography-system-design.md`.
- Every role-size pair uses `line-height: 1.5`.
- `Typography` defaults to `span`, preserves semantic HTML through `as`, forwards native attributes, and never sets color.
- Do not introduce Tailwind, CSS Modules, client state, runtime dependencies, or ad hoc font values.
- Keep monospace diagnostic placeholders as explicit exceptions.
- Preserve all existing text, heading order, links, interactions, and accessibility names.
- Preserve unrelated working-tree changes and review overlapping diffs before editing.

---

## File Structure

**Create**

- `src/components/ui/Typography.tsx` — typed polymorphic text renderer and class-name composition.
- `src/components/ui/Typography.test.tsx` — server-rendered behavior tests.

**Modify**

- `src/app/styles/_typography.scss` — Figma scale, generated classes, native-control mixin, existing line-clamp helpers.
- `src/app/styles/_base.scss` — body fallback and residual global text styles.
- `src/app/styles/_ui.scss` — native inputs/selects/textareas and shared UI layout only.
- `src/components/ui/{Badge,Button,Chip,EmptyState,Loading,Pagination,SectionHeading,StatTile}.tsx` — shared component migration.
- `src/components/{CategoryTopProducts,Footer,Header,PriceCard}.tsx` — application-shell and card migration.
- `src/app/page.tsx`, `src/app/styles/_home.scss` — home migration.
- `src/app/catalog/page.tsx`, `src/app/catalog/catalog-filters-client.tsx`, `src/app/catalog/[id]/page.tsx`, `src/app/catalog/[id]/reviews-section.tsx`, `src/app/catalog/[id]/save-button-client.tsx`, `src/app/deals/page.tsx`, `src/app/deals/deals-list-client.tsx`, `src/app/deals/deals-tabs-client.tsx`, `src/app/styles/_catalog.scss`, `src/app/styles/_detail.scss` — catalog, deals, and detail migration.
- `src/app/products/page.tsx`, `src/app/products/product-search-client.tsx`, `src/app/saved/saved-products-client.tsx`, `src/app/styles/_products.scss`, `src/app/styles/_saved.scss` — search and saved-product migration.
- `src/app/auth/auth-client.tsx`, `src/app/hospitals/hospitals-client.tsx`, `src/app/guide/page.tsx`, `src/app/price-tracking/page.tsx`, `src/app/loading.tsx`, `src/app/styles/_auth.scss`, `src/app/styles/_hospitals.scss`, `src/app/styles/_guide.scss`, `src/app/styles/_price-tracking.scss`, `src/app/styles/_loading.scss` — remaining route migration.
- `src/app/styles/_header.scss`, `src/app/styles/_footer.scss` — shell layout cleanup after component migration.

**Do not modify**

- `src/app/opengraph-image.tsx` — its inline image-generation styles run outside the application SCSS system.
- Chart-library rendering and monospace image placeholders — they are documented exceptions.

---

### Task 1: Typed Typography Primitive

**Files:**

- Create: `src/components/ui/Typography.test.tsx`
- Create: `src/components/ui/Typography.tsx`
- Modify: `src/app/styles/_typography.scss`

**Interfaces:**

- Consumes: React `ElementType`, `ComponentPropsWithoutRef`, and `ReactNode`.
- Produces: default export `Typography<T extends ElementType = "span">(props: TypographyProps<T>)`.
- Produces: exported `TypographyType`, `TypographySize`, and `TypographyProps<T>`.
- Produces: SCSS mixin `typography.style($type, $size)` for selectors that cannot render a React text element.

- [ ] **Step 1: Write the failing component tests**

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Typography from "./Typography";

describe("Typography", () => {
  it("renders a span with deterministic role and size classes", () => {
    const html = renderToStaticMarkup(
      <Typography type="bodyBold" size="xl">타이포그래피</Typography>,
    );

    expect(html).toBe(
      '<span class="ui-typography ui-typography--body-bold ui-typography--xl">타이포그래피</span>',
    );
  });

  it("preserves a semantic element, custom class, and native attributes", () => {
    const html = renderToStaticMarkup(
      <Typography
        as="a"
        type="label"
        size="md"
        className="product-link"
        href="/catalog"
        aria-label="카탈로그 열기"
      >
        카탈로그
      </Typography>,
    );

    expect(html).toContain("<a");
    expect(html).toContain('href="/catalog"');
    expect(html).toContain('aria-label="카탈로그 열기"');
    expect(html).toContain(
      'class="ui-typography ui-typography--label ui-typography--md product-link"',
    );
  });

  it.each([
    ["display", "xs"],
    ["headline", "md"],
    ["title", "lg"],
    ["body", "sm"],
    ["caption", "sm"],
  ] as const)("renders the valid %s/%s pair", (type, size) => {
    const html = renderToStaticMarkup(
      <Typography type={type} size={size}>텍스트</Typography>,
    );

    expect(html).toContain(`ui-typography--${type}`);
    expect(html).toContain(`ui-typography--${size}`);
  });
});
```

- [ ] **Step 2: Run the test and verify the RED state**

Run:

```bash
npm test -- src/components/ui/Typography.test.tsx
```

Expected: FAIL because `./Typography` does not exist.

- [ ] **Step 3: Implement the typed component**

```tsx
import {
  createElement,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";

export type TypographyType =
  | "display"
  | "headline"
  | "title"
  | "label"
  | "bodyBold"
  | "body"
  | "caption";

export type TypographySize = "xl" | "lg" | "md" | "sm" | "xs";

type TypographyVariant =
  | { type: "display"; size: TypographySize }
  | { type: "headline"; size: "md" | "sm" }
  | { type: "title"; size: "lg" | "md" | "sm" | "xs" }
  | { type: "label"; size: TypographySize }
  | { type: "bodyBold"; size: "xl" | "lg" | "md" }
  | { type: "body"; size: TypographySize }
  | { type: "caption"; size: "lg" | "md" | "sm" };

type TypographyOwnProps<T extends ElementType> = TypographyVariant & {
  as?: T;
  children: ReactNode;
  className?: string;
};

export type TypographyProps<T extends ElementType = "span"> =
  TypographyOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof TypographyOwnProps<T> | "as">;

function roleClass(type: TypographyType) {
  return type === "bodyBold" ? "body-bold" : type;
}

export default function Typography<T extends ElementType = "span">({
  as,
  type,
  size,
  className,
  children,
  ...rest
}: TypographyProps<T>) {
  const classes = [
    "ui-typography",
    `ui-typography--${roleClass(type)}`,
    `ui-typography--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createElement(as ?? "span", { ...rest, className: classes }, children);
}
```

- [ ] **Step 4: Add the SCSS source of truth without removing line-clamp helpers**

```scss
@use "sass:list";
@use "sass:map";

$styles: (
  display: (
    xl: (44px, 700),
    lg: (30px, 700),
    md: (26px, 700),
    sm: (24px, 700),
    xs: (18px, 700),
  ),
  headline: (
    md: (28px, 700),
    sm: (21px, 700),
  ),
  title: (
    lg: (20px, 700),
    md: (18px, 700),
    sm: (16px, 700),
    xs: (14px, 700),
  ),
  label: (
    xl: (16px, 500),
    lg: (15px, 500),
    md: (14px, 500),
    sm: (13px, 500),
    xs: (12px, 500),
  ),
  body-bold: (
    xl: (16px, 700),
    lg: (15px, 700),
    md: (14px, 700),
  ),
  body: (
    xl: (16px, 400),
    lg: (15px, 400),
    md: (14px, 400),
    sm: (13px, 400),
    xs: (12px, 400),
  ),
  caption: (
    lg: (12px, 400),
    md: (11px, 400),
    sm: (10px, 400),
  ),
);

@mixin style($type, $size) {
  $values: map.get(map.get($styles, $type), $size);

  font-family: var(--font-sans);
  font-size: list.nth($values, 1);
  font-weight: list.nth($values, 2);
  line-height: 1.5;
}

.ui-typography {
  margin: 0;
  color: inherit;
}

@each $type, $sizes in $styles {
  @each $size, $values in $sizes {
    .ui-typography--#{$type}.ui-typography--#{$size} {
      @include style($type, $size);
    }
  }
}
```

Keep the line-clamp helpers after these definitions:

```scss
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

- [ ] **Step 5: Verify GREEN and compile-time checking**

Run:

```bash
npm test -- src/components/ui/Typography.test.tsx
npx tsc --noEmit
```

Expected: component tests PASS and TypeScript exits with code 0.

- [ ] **Step 6: Commit the primitive**

```bash
git add src/components/ui/Typography.tsx src/components/ui/Typography.test.tsx src/app/styles/_typography.scss
git commit -m "feat: add typed typography primitive"
```

---

### Task 2: Shared UI and Application Shell

**Files:**

- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Chip.tsx`
- Modify: `src/components/ui/EmptyState.tsx`
- Modify: `src/components/ui/Loading.tsx`
- Modify: `src/components/ui/Pagination.tsx`
- Modify: `src/components/ui/SectionHeading.tsx`
- Modify: `src/components/ui/StatTile.tsx`
- Modify: `src/components/CategoryTopProducts.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/PriceCard.tsx`
- Modify: `src/app/styles/_base.scss`
- Modify: `src/app/styles/_ui.scss`
- Modify: `src/app/styles/_header.scss`
- Modify: `src/app/styles/_footer.scss`

**Interfaces:**

- Consumes: `Typography` from `@/components/ui/Typography`.
- Produces: shared components whose visible text receives a Figma role-size pair.
- Produces: native-control typography through `@include typography.style(...)`.

- [ ] **Step 1: Add a failing shared-component regression test**

Extend `src/components/ui/Typography.test.tsx`:

```tsx
import SectionHeading from "./SectionHeading";

it("lets shared components preserve semantic heading levels", () => {
  const html = renderToStaticMarkup(
    <SectionHeading eyebrow="급락 특가" title="오늘의 가격 하락" level={1} />,
  );

  expect(html).toContain(
    '<h1 class="ui-typography ui-typography--headline ui-typography--md ui-section-heading__title">',
  );
  expect(html).toContain(
    '<p class="ui-typography ui-typography--label ui-typography--xs section-label">',
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- src/components/ui/Typography.test.tsx
```

Expected: FAIL because `SectionHeading` still renders raw `p` and heading elements without typography classes.

- [ ] **Step 3: Migrate shared components with this exact role mapping**

| Component text | JSX |
| --- | --- |
| `SectionHeading` eyebrow | `<Typography as="p" type="label" size="xs" className="section-label">` |
| `SectionHeading` title | `<Typography as={Heading} type="headline" size={level === 1 ? "md" : "sm"} className="ui-section-heading__title">` |
| `StatTile` label/value | `caption/lg`, `title/lg` |
| `PriceCard` source/title/price/meta | `caption/lg`, `body/lg`, `title/md`, `caption/lg` |
| `CategoryTopProducts` name/price/meta/more | `body/md`, `title/md`, `caption/lg`, `label/md` |
| `Header` brand/subtitle/nav/auth | `title/md`, `caption/lg`, `label/sm`, `label/sm` |
| `Footer` copy/link | `body/sm`, `label/sm` |
| `Badge` variants | `label/xs` |
| `Chip` | `label/sm` |
| `EmptyState` title/copy | `bodyBold/md`, `body/sm` |
| `Loading` copy | `body/lg` |
| `Pagination` summary/navigation | `body/sm`, `label/md` |
| `Button` children | `bodyBold/md` for `md`, `label/sm` for `sm` |

Use this import in each file:

```tsx
import Typography from "@/components/ui/Typography";
```

Use semantic tags exactly where the existing element carries meaning:

```tsx
const Heading = level === 1 ? "h1" : "h2";

<Typography
  as={Heading}
  type="headline"
  size={level === 1 ? "md" : "sm"}
  className="ui-section-heading__title"
>
  {title}
</Typography>
```

- [ ] **Step 4: Route native controls through the shared mixin**

At the top of `_base.scss` and `_ui.scss`:

```scss
@use "./typography";
```

Apply only to elements that cannot safely receive `Typography`:

```scss
body {
  @include typography.style(body, lg);
}

.ui-input,
.ui-select,
.ui-textarea {
  @include typography.style(body, lg);

  &--sm {
    @include typography.style(body, md);
  }

  &--xs {
    @include typography.style(body, sm);
  }
}
```

Remove the migrated `font-size`, `font-weight`, and `line-height` declarations from `_base.scss`, `_ui.scss`, `_header.scss`, and `_footer.scss`. Preserve component spacing, color, letter spacing, borders, and interaction styles.

- [ ] **Step 5: Run focused tests and the type checker**

Run:

```bash
npm test -- src/components/ui/Typography.test.tsx
npx tsc --noEmit
```

Expected: PASS with exit code 0.

- [ ] **Step 6: Commit shared migration**

```bash
git add src/components src/app/styles/_base.scss src/app/styles/_ui.scss src/app/styles/_header.scss src/app/styles/_footer.scss
git commit -m "refactor: migrate shared UI to typography roles"
```

---

### Task 3: Home, Catalog, Deals, and Catalog Detail

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/app/catalog/page.tsx`
- Modify: `src/app/catalog/catalog-filters-client.tsx`
- Modify: `src/app/catalog/[id]/page.tsx`
- Modify: `src/app/catalog/[id]/reviews-section.tsx`
- Modify: `src/app/catalog/[id]/save-button-client.tsx`
- Modify: `src/app/deals/page.tsx`
- Modify: `src/app/deals/deals-list-client.tsx`
- Modify: `src/app/deals/deals-tabs-client.tsx`
- Modify: `src/app/styles/_home.scss`
- Modify: `src/app/styles/_catalog.scss`
- Modify: `src/app/styles/_detail.scss`

**Interfaces:**

- Consumes: `Typography`.
- Produces: semantic page text with no page-local proportional-font size, weight, or line-height declarations.

- [ ] **Step 1: Add failing markup assertions for representative route hierarchies**

Create `src/app/typography-migration.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("route typography migration", () => {
  it("uses display typography for the home hero", () => {
    const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

    expect(source).toContain(
      '<Typography as="h1" type="display" size="xl"',
    );
  });

  it("uses headline typography for the deals page title", () => {
    const source = readFileSync(
      new URL("./deals/page.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain(
      '<Typography as="h1" type="headline" size="md"',
    );
  });
});
```

- [ ] **Step 2: Run the route test and verify it fails**

Run:

```bash
npm test -- src/app/typography-migration.test.ts
```

Expected: FAIL because the current headings do not contain typography classes.

- [ ] **Step 3: Migrate route text using the exact hierarchy**

| Route text | Role/size |
| --- | --- |
| Home hero status/title/copy | `label/xs`, `display/xl`, `body/xl` |
| Home panel labels/stats/notice | `label/xs`, `title/lg`, `body/sm` |
| Home category name/meta | `bodyBold/lg`, `caption/lg` |
| Catalog and deals page titles/copy | `headline/md`, `body/lg` |
| Filter labels/options/result count | `label/xs`, `body/md`, `body/sm` |
| Catalog card name/price/meta | `body/md`, `title/md`, `caption/lg` |
| Detail source/title/price/notice | `caption/lg`, `display/sm`, `display/lg`, `caption/lg` |
| Detail facts/reviews | `body/sm`, `bodyBold/lg`, `caption/lg` |
| Save and deal controls | `label/sm` |

Apply the import:

```tsx
import Typography from "@/components/ui/Typography";
```

Preserve headings:

```tsx
<Typography as="h1" type="display" size="xl" className="home-hero__title">
  반려용품 가격을 매일 기록합니다
</Typography>
```

Preserve definition-list semantics by rendering text inside the existing `dt` and `dd`:

```tsx
<dt><Typography type="body" size="sm">{label}</Typography></dt>
<dd><Typography type="bodyBold" size="lg">{value}</Typography></dd>
```

- [ ] **Step 4: Remove migrated font declarations**

Delete proportional-font `font-size`, `font-weight`, and `line-height` declarations from `_home.scss`, `_catalog.scss`, and `_detail.scss`.

Keep these documented exceptions:

```scss
.catalog-card__placeholder,
.product-detail__image span {
  font-family: ui-monospace, monospace;
  font-size: 11px;
}
```

For the mobile home hero, change the role-size class in JSX through responsive duplicate markup only if markup already differs by breakpoint; otherwise keep one Figma size and remove the raw `34px` media override.

- [ ] **Step 5: Run route and existing detail tests**

Run:

```bash
npm test -- src/app/typography-migration.test.ts src/app/catalog/[id]/reviews-section.test.tsx
npx tsc --noEmit
```

Expected: PASS with exit code 0.

- [ ] **Step 6: Commit catalog-family migration**

```bash
git add src/app/page.tsx src/app/catalog src/app/deals src/app/styles/_home.scss src/app/styles/_catalog.scss src/app/styles/_detail.scss src/app/typography-migration.test.ts
git commit -m "refactor: migrate catalog screens to typography roles"
```

---

### Task 4: Search, Saved Products, Authentication, and Supporting Routes

**Files:**

- Modify: `src/app/products/page.tsx`
- Modify: `src/app/products/product-search-client.tsx`
- Modify: `src/app/saved/saved-products-client.tsx`
- Modify: `src/app/auth/auth-client.tsx`
- Modify: `src/app/hospitals/hospitals-client.tsx`
- Modify: `src/app/guide/page.tsx`
- Modify: `src/app/price-tracking/page.tsx`
- Modify: `src/app/loading.tsx`
- Modify: `src/app/styles/_products.scss`
- Modify: `src/app/styles/_saved.scss`
- Modify: `src/app/styles/_auth.scss`
- Modify: `src/app/styles/_hospitals.scss`
- Modify: `src/app/styles/_guide.scss`
- Modify: `src/app/styles/_price-tracking.scss`
- Modify: `src/app/styles/_loading.scss`

**Interfaces:**

- Consumes: `Typography`.
- Produces: all remaining visible application text on the shared scale.

- [ ] **Step 1: Extend the route regression test**

Add imports and a rendered-route case to `src/app/typography-migration.test.ts`:

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import GuidePage from "./guide/page";
import PriceTrackingPage from "./price-tracking/page";

it("uses headline typography on supporting routes", () => {
  const guide = renderToStaticMarkup(createElement(GuidePage));
  const tracking = renderToStaticMarkup(createElement(PriceTrackingPage));

  expect(guide).toContain("ui-typography--headline");
  expect(tracking).toContain("ui-typography--headline");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- src/app/typography-migration.test.ts
```

Expected: FAIL because the supporting routes still use raw heading elements.

- [ ] **Step 3: Migrate remaining routes using the exact hierarchy**

| Content | Role/size |
| --- | --- |
| Page title/supporting copy | `headline/md`, `body/lg` |
| Product search title/meta/price | `body/md`, `caption/lg`, `title/md` |
| Saved source/title/price/meta | `caption/md`, `bodyBold/lg`, `title/md`, `caption/lg` |
| Auth brand/hero/form title | `title/md`, `headline/md`, `display/sm` |
| Auth field/helper/action | `label/sm`, `body/sm`, `bodyBold/lg` |
| Hospital category/name/address/link | `caption/md`, `bodyBold/lg`, `body/xs`, `label/xs` |
| Guide card title/copy/meta | `title/sm`, `body/sm`, `caption/lg` |
| Price-tracking title/section/copy | `headline/md`, `title/md`, `body/lg` |
| Loading copy | `body/lg` |

Use:

```tsx
<Typography as="h2" type="title" size="md" className="guide-card__title">
  {title}
</Typography>
```

For input, textarea, select, and placeholder text, keep the native elements and rely on the shared `_ui.scss` typography mixin from Task 2.

- [ ] **Step 4: Remove remaining proportional-font declarations**

Remove migrated `font-size`, `font-weight`, and `line-height` declarations from `_products.scss`, `_saved.scss`, `_auth.scss`, `_hospitals.scss`, `_guide.scss`, `_price-tracking.scss`, and `_loading.scss`.

Keep only the saved-image diagnostic exception:

```scss
.saved-card__image span {
  font-family: ui-monospace, monospace;
  font-size: 10px;
}
```

- [ ] **Step 5: Run route tests and type checking**

Run:

```bash
npm test -- src/app/typography-migration.test.ts src/app/price-tracking/page.test.tsx
npx tsc --noEmit
```

Expected: PASS with exit code 0.

- [ ] **Step 6: Commit remaining route migration**

```bash
git add src/app/products src/app/saved src/app/auth src/app/hospitals src/app/guide src/app/price-tracking src/app/loading.tsx src/app/styles
git commit -m "refactor: migrate remaining screens to typography roles"
```

---

### Task 5: Repository Audit and Final Verification

**Files:**

- Modify only files identified by the audit as missed migration sites.

**Interfaces:**

- Consumes: all prior migration tasks.
- Produces: a verified repository-wide typography migration with only documented exceptions.

- [ ] **Step 1: Audit raw typography declarations**

Run:

```bash
rg -n "font-size|font-weight|line-height" src/app/styles --glob "*.scss"
```

Expected matches:

- `_typography.scss` scale and line-clamp code;
- `_base.scss` font smoothing or non-size font properties;
- `_ui.scss` typography mixin calls;
- monospace placeholder exceptions in `_catalog.scss`, `_detail.scss`, and `_saved.scss`;
- deliberate `line-height: 1` for icon-only pagination navigation, if still required.

No proportional text selector may retain an ad hoc numeric font size, weight, or line height.

- [ ] **Step 2: Audit visible JSX text**

Run:

```bash
rg -n "<(h[1-6]|p|small|strong|label)(\\s|>)" src --glob "*.tsx"
```

Expected: every application text node is either a `Typography` call or a documented structural wrapper whose direct child is `Typography`. `opengraph-image.tsx` and JSON-LD script content are excluded.

- [ ] **Step 3: Fix each missed audit site using the established API**

Use only:

```tsx
<Typography as="p" type="body" size="sm" className="existing-layout-class">
  {copy}
</Typography>
```

or, for a native control selector:

```scss
@use "./typography";

.native-control {
  @include typography.style(body, md);
}
```

- [ ] **Step 4: Run the full verification suite**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected:

- all Vitest suites PASS;
- ESLint exits with code 0;
- Next.js production build succeeds;
- `git diff --check` prints no whitespace errors.

- [ ] **Step 5: Review the final diff for unrelated changes**

Run:

```bash
git status --short
git diff --stat
git diff -- src/components src/app
```

Expected: only typography migration files and pre-existing user changes are present. Do not stage pre-existing unrelated changes.

- [ ] **Step 6: Commit audit corrections**

```bash
git add src/components src/app
git commit -m "test: verify typography migration"
```
