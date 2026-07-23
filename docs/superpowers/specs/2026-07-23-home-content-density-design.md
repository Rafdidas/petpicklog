# Home Content Density Design

**Date:** 2026-07-23  
**Status:** Approved

## Goal

Increase the visible content density of PetPick's home and search surfaces without duplicating items.

## Changes

- Expand the shared catalog category list from 6 to 12 real categories by adding `장난감`, `산책`, `이동장·외출`, `미용`, `생활·가구`, and `훈련·안전`.
- Render all 12 categories in `.home-cats` and in `CategoryTopProducts`' category chip row.
- Request 10 products per category for `#category-top-panel`.
- Request 5 products for the home "급락 특가" grid.
- Expand the realtime-search quick-query list to 12 distinct search terms.
- Keep the existing responsive CSS grid behavior: wide screens fill columns naturally; narrow screens wrap without horizontal scrolling.

## Data and Fallback Behavior

- Category labels and slugs remain defined in the existing shared category source; no duplicate local arrays are introduced.
- Product grids render as many real catalog results as available. The requested counts are maximums, not fabricated product cards.
- Quick queries are static search shortcuts and each activates the existing search flow.

## Verification

- Add a focused source/data test covering 12 categories, five home drop requests, ten category-top requests, and 12 quick queries.
- Run the full Vitest suite, ESLint, and production build.
