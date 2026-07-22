# PetPick Logo, SEO, and GEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Pick Signal logo and make public PetPick pages crawlable, shareable, and factually understandable by search engines and generative AI.

**Architecture:** `src/lib/site.ts` owns the canonical site URL and brand copy. App Router metadata routes expose the icon, robots, sitemap, and OG card; server pages add factual JSON-LD and a public price-tracking explanation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, SVG, Next Metadata API, Next `ImageResponse`, Supabase, Vitest, SCSS.

## Global Constraints

- Use `NEXT_PUBLIC_SITE_URL` as the only production URL source; default to `http://localhost:3000` only when it is absent.
- Preserve the approved SVG at `src/assets/brand/petpick-pick-signal.svg` without changing its paths.
- Keep the Korean Header lockup: `펫픽 · 반려용품 가격추적`.
- Use actual catalog data only. Do not claim real-time prices, price guarantees, whole-market lowest prices, or stock availability.
- Allow `OAI-SearchBot` on public pages and keep private routes out of the sitemap.
- Retain SCSS; do not add Tailwind or CSS Modules.

---

### Task 1: Brand asset and canonical URL helper

**Files:**

- Create: `src/lib/site.ts`
- Create: `src/lib/site.test.ts`
- Create: `src/app/icon.svg`
- Modify: `.env.example`, `src/components/Header.tsx`, `src/app/styles/_header.scss`
- Stage: `src/assets/brand/petpick-pick-signal.svg`

**Interfaces:**

- Produces `SITE_NAME`, `SITE_DESCRIPTION`, `getSiteUrl(rawUrl?: string): URL`, `getAbsoluteUrl(path: string, rawUrl?: string): string`.
- Header renders `/icon.svg` at 34×34 and retains the existing Korean wordmark/subtitle.

- [ ] **Step 1: Write the failing helper test**

Create `src/lib/site.test.ts` with this exact test:

```ts
import { describe, expect, it } from "vitest";
import { getAbsoluteUrl, getSiteUrl } from "./site";

describe("site URL helpers", () => {
  it("uses localhost when no site URL exists", () => {
    expect(getSiteUrl(undefined).toString()).toBe("http://localhost:3000/");
  });
  it("builds paths from the configured URL", () => {
    expect(getAbsoluteUrl("/catalog", "https://petpick.kr/")).toBe("https://petpick.kr/catalog");
  });
});
```

- [ ] **Step 2: Confirm the test fails**

Run `npm run test -- src/lib/site.test.ts`. Expected: failure because `./site` does not exist.

- [ ] **Step 3: Implement the helper**

Create `src/lib/site.ts` with this exact implementation:

```ts
export const SITE_NAME = "펫픽";
export const SITE_DESCRIPTION = "반려동물 용품의 가격을 매일 기록하고, 급락 특가와 가격 추이를 확인하는 가격추적 서비스입니다.";
const fallbackSiteUrl = "http://localhost:3000";
export function getSiteUrl(rawUrl = process.env.NEXT_PUBLIC_SITE_URL): URL {
  return new URL(rawUrl?.trim() || fallbackSiteUrl);
}
export function getAbsoluteUrl(path: string, rawUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  return new URL(path, getSiteUrl(rawUrl)).toString();
}
```

Append `NEXT_PUBLIC_SITE_URL=https://your-production-domain.example` to `.env.example`.

- [ ] **Step 4: Apply the logo asset**

Copy the exact SVG content from `src/assets/brand/petpick-pick-signal.svg` to `src/app/icon.svg`. In `Header.tsx`, replace the literal `P` with `<img alt="" height={34} src="/icon.svg" width={34} />`. Replace `header__logo-mark` background and text styles with a 34px `inline-flex` box whose child image is `display: block; width: 100%; height: 100%;`.

- [ ] **Step 5: Verify and commit**

Run `npm run test -- src/lib/site.test.ts` and `npm run lint`; both must pass. Commit with `feat: apply Pick Signal brand foundation` after staging only the files listed in this task.

### Task 2: Crawling, canonical URLs, and Open Graph

**Files:**

- Create: `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/opengraph-image.tsx`
- Modify: `src/app/layout.tsx`, `src/lib/catalog.ts`, `src/lib/catalog.test.ts`

**Interfaces:**

- Produces `/robots.txt`, `/sitemap.xml`, and a 1200×630 PNG at `/opengraph-image`.
- Produces `fetchSitemapProducts(): Promise<Array<{ externalProductId: string; lastCheckedAt: string }>>`.

- [ ] **Step 1: Write the failing sitemap data test**

Add a mocked Supabase test to `src/lib/catalog.test.ts` that imports `fetchSitemapProducts`, returns `[ { external_product_id: "p1", last_checked_at: "2026-07-22T00:00:00Z" } ]`, and expects `[ { externalProductId: "p1", lastCheckedAt: "2026-07-22T00:00:00Z" } ]`.

- [ ] **Step 2: Confirm it fails**

Run `npm run test -- src/lib/catalog.test.ts`. Expected: failure because `fetchSitemapProducts` is not exported.

- [ ] **Step 3: Implement the product query and routes**

Add `fetchSitemapProducts` to `src/lib/catalog.ts`. It must return `[]` when `createServerSupabaseClient()` is null; otherwise select `external_product_id,last_checked_at` from `product_price_stats`, exclude null `last_checked_at`, order by `last_checked_at` descending, and map snake_case to camelCase.

Create `robots.ts` with `rules: [{ userAgent: "*", allow: "/" }, { userAgent: "OAI-SearchBot", allow: "/" }]` and `sitemap: getAbsoluteUrl("/sitemap.xml")`.

Create `sitemap.ts` that includes `/`, `/catalog`, `/deals`, `/products`, `/hospitals`, `/guide`, and `/price-tracking`, then appends `/catalog/${externalProductId}` entries using each actual `lastCheckedAt` as `lastModified`. It must not include `/auth` or `/saved`.

- [ ] **Step 4: Add metadata and the social card**

Set `metadataBase: getSiteUrl()` in `layout.tsx`. Add default/title-template metadata, canonical `/`, Korean `openGraph` (`locale: "ko_KR"`, `siteName: "펫픽"`, image `/opengraph-image`), `twitter: { card: "summary_large_image" }`, and index/follow robots.

Create `opengraph-image.tsx` with `size = { width: 1200, height: 630 }`, `contentType = "image/png"`, and `ImageResponse`. Render the approved paw as inline SVG elements, then `펫픽`, `반려용품 가격추적`, and `반려용품 최저가를 매일 기록합니다.` using the existing blue-gray, navy, and lime colors. Do not use an emoji or remote font.

- [ ] **Step 5: Verify and commit**

Run `npm run test -- src/lib/catalog.test.ts src/lib/site.test.ts`. Start the dev server, then verify `/robots.txt` has `OAI-SearchBot`, `/sitemap.xml` has `/price-tracking`, and `/opengraph-image` responds as `image/png`. Commit with `feat: add crawl and sharing metadata`.

### Task 3: Publish the price-tracking reference page

**Files:**

- Create: `src/app/price-tracking/page.tsx`, `src/app/styles/_price-tracking.scss`
- Modify: `src/app/styles/globals.scss`, `src/components/Footer.tsx`

**Interfaces:**

- Produces public `/price-tracking`, including visible FAQ content and matching `AboutPage` and `FAQPage` JSON-LD.

- [ ] **Step 1: Build the factual page**

Create the page with metadata title `가격 기록 방식 | 펫픽`, description `펫픽이 반려용품 가격을 수집하고 하락률을 계산하는 기준을 안내합니다.`, and canonical `/price-tracking`.

The visible sections must use these four headings: `펫픽이 기록하는 가격`, `가격은 어떻게 수집하나요?`, `14일 하락률은 어떻게 계산하나요?`, and `마지막 확인 시각은 무엇인가요?`.

The visible copy and the FAQ answers must include exactly these facts: `펫픽은 카탈로그에 등록된 반려용품의 네이버 쇼핑 기준 가격을 매일 기록합니다.`, `하락률은 최근 14일 동안 기록된 최고가와 가장 최근 수집 가격을 비교해 계산합니다.`, and `표시 가격은 수집 시점 기준입니다. 최종 가격·배송비·재고 여부는 판매처에서 확인해주세요.`

Emit `AboutPage` and `FAQPage` scripts with `JSON.stringify(value).replace(/</g, "\\u003c")`; every FAQ entity must be visibly rendered on the page.

- [ ] **Step 2: Add SCSS and navigation**

Create `.price-tracking` styles with `max-width: 900px`, `padding: 56px 24px 80px`, white information blocks, `1px solid var(--color-border)`, and existing radius tokens. Add `@use "price-tracking";` to `globals.scss`. Add `가격 기록 방식` linking to `/price-tracking` in `Footer.tsx` without changing the disclaimer.

- [ ] **Step 3: Verify and commit**

Check `http://localhost:3001/price-tracking` HTML for `AboutPage`, `FAQPage`, and `최종 가격·배송비·재고 여부`. Run lint. Commit with `feat: add price tracking transparency page`.

### Task 4: Enrich catalog metadata and perform final QA

**Files:**

- Modify: `src/app/catalog/[id]/page.tsx`, `src/app/page.tsx`, `src/app/deals/page.tsx`

**Interfaces:**

- Product pages expose factual canonical and Open Graph metadata plus Product JSON-LD with the existing `lastCheckedAt` source data.
- Home and deals have page-specific metadata.

- [ ] **Step 1: Add page-level metadata**

Add static metadata to home and deals with Korean title, description, canonical URL, and Open Graph URL from `getAbsoluteUrl`. In catalog detail `generateMetadata`, add canonical `/catalog/${id}` and Korean Open Graph title/description using `최근 수집 가격`; never use `실시간 최저가` or `최저가 보장`.

- [ ] **Step 2: Add factual Product properties**

Keep the existing Product/Offer values. Add only this `additionalProperty` to the Product JSON-LD: `{ "@type": "PropertyValue", name: "마지막 가격 확인 시각", value: stats.lastCheckedAt }`. Do not add availability or a made-up `priceValidUntil` value.

- [ ] **Step 3: Run final verification**

Run `npm run lint`, `npm run test`, and `npm run build`; all must exit 0. In the browser, verify the logo at desktop and 390px mobile widths, and confirm canonical/JSON-LD on home, deals, price-tracking, and one catalog detail page.

- [ ] **Step 4: Commit the catalog metadata work**

Commit the task files with `feat: enrich catalog SEO metadata`.
