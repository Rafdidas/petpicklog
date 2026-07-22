# Final Review Fixes Report

Date: 2026-07-22
Branch: `codex/logo-seo-geo`

## Changes

- Removed the root `alternates.canonical: "/"` from `src/app/layout.tsx`, preventing child routes from inheriting the home canonical. The home page continues to define its own `/` canonical in `src/app/page.tsx`.
- Added self-canonical metadata to the indexable public routes that lacked it:
  - `/catalog`
  - `/products`
  - `/products/[id]` via `generateMetadata`
  - `/hospitals`
  - `/guide`
- Added `noindex, nofollow` robots metadata to the existing `/auth` and `/saved` pages without changing their components or rendering behavior.
- Added `export const revalidate = 3600;` to `src/app/sitemap.ts`. The existing `fetchSitemapProducts()` fallback remains unchanged, so an unavailable Supabase client still produces the static public route entries.
- Removed the unused `SITE_NAME` import from `src/app/price-tracking/page.tsx`.
- Added focused regression coverage:
  - `src/app/seo-metadata.test.ts` verifies the root has no canonical, each requested public route has a self-canonical, the dynamic product route includes its ID, and `/auth` plus `/saved` are noindex.
  - `src/app/sitemap.test.ts` verifies the one-hour sitemap cache policy and the existing public-route fallback when no catalog products are available.
- No SVG source paths or SVG assets were modified.

## TDD Evidence

### Initial RED run

Command:

```text
npm.cmd test -- src/app/sitemap.test.ts src/app/seo-metadata.test.ts
```

Result: exit 1; 2 test files failed; 8 tests failed and 1 passed. Failures were the missing `revalidate`, four missing static canonicals, missing dynamic product metadata, and missing `/auth` and `/saved` robots metadata.

### Root-canonical regression RED run

The removed root canonical was temporarily restored after adding the root regression assertion.

Command:

```text
npm.cmd test -- src/app/seo-metadata.test.ts -t "does not define a root canonical"
```

Result: exit 1; the focused test failed with `expected '/' to be undefined`. The root canonical was then removed again.

### Focused GREEN run

Command:

```text
npm.cmd test -- src/app/sitemap.test.ts src/app/seo-metadata.test.ts
```

Result: exit 0; 2 test files passed; 10 tests passed.

## Final Validation

### Lint

Command:

```text
npm.cmd run lint
```

Result: exit 0; 0 errors, 1 pre-existing warning in `src/components/Header.tsx:71` for `@next/next/no-img-element`.

### Full Vitest suite

Command:

```text
npm.cmd test
```

Result: exit 0; 9 test files passed; 35 tests passed.

### Production build

Command:

```text
npm.cmd run build
```

Result: exit 0; compiled successfully, TypeScript completed, 16/16 static pages generated. The route table reports `/sitemap.xml` with `Revalidate 1h`. Build emitted one workspace-root warning because both the parent repository and worktree contain `package-lock.json` files.

### Runtime canonical inspection

Started the completed production build on local port 3107 and fetched `/catalog` and `/hospitals`.

Observed markup:

```html
<link rel="canonical" href="http://localhost:3000/catalog">
<link rel="canonical" href="http://localhost:3000/hospitals">
```

The host is derived from the configured local metadata base; the path component is correct and self-canonical for both routes.

### Diff hygiene

Command:

```text
git diff --check
```

Result: exit 0; no whitespace errors. Git printed only the repository's LF-to-CRLF working-copy notices.

## Concerns

- The existing `Header.tsx` raw-image lint warning remains. It was outside this final-fix scope, and the instruction not to modify source SVG paths was preserved.
- The build's multi-lockfile workspace-root warning remains and is unrelated to these metadata changes.
