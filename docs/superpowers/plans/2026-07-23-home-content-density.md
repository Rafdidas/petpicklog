# Home Content Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the home and search surfaces with the requested 12 category/query options and wider product grids.

**Architecture:** Keep category data in `src/lib/categories.ts`, adjust only home fetch limits, and keep quick queries local to the search UI. No placeholder product data is created; product grids display up to the requested limits from the existing catalog query.

**Tech Stack:** Next.js 16, TypeScript, React, Vitest

## Global Constraints

- Categories must be unique shared `slug`/`label` values.
- Home top drops request 5 products and category-top products request 10 products.
- Quick queries contain 12 unique values and use the existing search callback.
- Responsive grids wrap normally and do not add horizontal scrolling.

---

### Task 1: Expand Shared Content Data

**Files:**
- Modify: `src/lib/categories.ts`
- Modify: `src/app/products/product-search-client.tsx`
- Create: `src/lib/categories.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { categories } from "./categories";

describe("categories", () => {
  it("defines twelve unique category slugs", () => {
    expect(categories).toHaveLength(12);
    expect(new Set(categories.map((category) => category.slug)).size).toBe(12);
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd test -- src/lib/categories.test.ts`  
Expected: FAIL because the shared category list has 8 entries.

- [ ] **Step 3: Implement the content additions**

Append these entries to `categories`:

```ts
{ slug: "walk", label: "산책" },
{ slug: "grooming", label: "미용" },
{ slug: "living", label: "생활·가구" },
{ slug: "training", label: "훈련·안전" }
```

Replace `recommendedQueries` with 12 unique terms:

```ts
[
  "강아지 사료", "고양이 모래", "배변패드", "강아지 샴푸",
  "고양이 간식", "반려동물 영양제", "강아지 장난감", "고양이 장난감",
  "강아지 하네스", "고양이 이동장", "강아지 미용용품", "반려동물 안전문"
]
```

- [ ] **Step 4: Verify GREEN**

Run: `npm.cmd test -- src/lib/categories.test.ts`  
Expected: PASS.

### Task 2: Increase Home Catalog Requests

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/home-content-density.test.ts`

- [ ] **Step 1: Write the failing source test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

it("requests five top drops and ten category products", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  expect(source).toContain("fetchTopDrops(5)");
  expect(source).toContain("fetchCategoryTopDrops(10)");
});
```

- [ ] **Step 2: Verify RED**

Run: `npm.cmd test -- src/app/home-content-density.test.ts`  
Expected: FAIL because the page requests 4 and 8 products.

- [ ] **Step 3: Implement limits**

```ts
fetchTopDrops(5),
fetchCategoryTopDrops(10)
```

- [ ] **Step 4: Verify and validate application output**

Run:

```bash
npm.cmd test -- src/app/home-content-density.test.ts src/lib/categories.test.ts
npm.cmd run lint
npm.cmd run build
```

Expected: tests pass, lint has no errors, and build succeeds.
