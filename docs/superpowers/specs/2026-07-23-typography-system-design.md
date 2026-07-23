# PetPick Typography System Design

**Date:** 2026-07-23  
**Status:** Approved

## Goal

Adopt the typography roles defined in the Wishicon design system Figma node `18278:170` across PetPick. Replace page-specific `font-size`, `font-weight`, and `line-height` declarations with a typed React `Typography` component and a shared SCSS source of truth.

The migration covers all existing routes and shared components. Layout, color, spacing, and responsive positioning remain owned by their current page or component styles.

## Design Source

- Font family: Pretendard Variable
- Figma file: `tgemg81UlQoBxUOhELqPTl`
- Figma node: `18278:170`
- Roles: `display`, `headline`, `title`, `label`, `bodyBold`, `body`, `caption`
- Line height for every role-size pair: `150%`

The following public names translate Figma's `xlarge`, `large`, `medium`, `small`, and `xsmall` suffixes to `xl`, `lg`, `md`, `sm`, and `xs`.

| Type | Supported sizes | Font sizes | Weight |
| --- | --- | --- | --- |
| `display` | `xl`, `lg`, `md`, `sm`, `xs` | 44, 30, 26, 24, 18px | 700 |
| `headline` | `md`, `sm` | 28, 21px | 700 |
| `title` | `lg`, `md`, `sm`, `xs` | 20, 18, 16, 14px | 700 |
| `label` | `xl`, `lg`, `md`, `sm`, `xs` | 16, 15, 14, 13, 12px | 500 |
| `bodyBold` | `xl`, `lg`, `md` | 16, 15, 14px | 700 |
| `body` | `xl`, `lg`, `md`, `sm`, `xs` | 16, 15, 14, 13, 12px | 400 |
| `caption` | `lg`, `md`, `sm` | 12, 11, 10px | 400 |

Every role-size pair uses a unitless `1.5` line height.

## Component API

The public component lives at `src/components/ui/Typography.tsx`.

```tsx
<Typography
  as="p"
  type="bodyBold"
  size="xl"
  className="product-price"
>
  타이포그래피
</Typography>
```

Required behavior:

- `type` and `size` form a discriminated union so unsupported combinations fail TypeScript checking.
- `as` preserves semantic HTML. It defaults to `span`.
- Native attributes appropriate to the selected element pass through.
- `className` is appended after the component's base and variant classes.
- The component does not set a text color. Text inherits color or receives it from a caller-provided class.
- The component is server-compatible and contains no client state or effects.
- The generated classes are deterministic and use the `ui-typography` namespace.

Example class output:

```text
ui-typography ui-typography--body-bold ui-typography--xl product-price
```

## SCSS Architecture

`src/app/styles/_typography.scss` remains the single global typography stylesheet and continues to contain the existing line-clamp helpers.

It adds:

- typography role-size definitions;
- reusable SCSS mixins for native controls and exceptional selectors that cannot render a `Typography` element;
- component selectors under `.ui-typography`;
- no color utility classes.

The global stylesheet already loads this partial, so no additional stylesheet entry point is needed.

## Migration Strategy

Use `Typography` for every meaningful text node in pages and shared components:

- headings use the matching semantic `as="h1"` through `as="h6"`;
- paragraphs use `as="p"`;
- labels use `as="label"` when they label a form control;
- inline copy uses the default `span` or an explicit inline element;
- button, badge, navigation, card, status, and metadata copy use the closest Figma role by visual hierarchy.

Remove migrated `font-size`, `font-weight`, and `line-height` declarations from page and component SCSS. Keep declarations that belong to:

- layout and spacing;
- color and interaction states;
- responsive visibility or positioning;
- monospace diagnostic identifiers;
- form controls, placeholders, generated content, or third-party-rendered markup that cannot be wrapped safely.

For those exceptions, apply the same typography definition through the shared SCSS mixin. No ad hoc replacement font values may be introduced.

Responsive typography must switch between supported role-size pairs rather than overriding raw font values.

## Semantic Mapping Guidelines

- Primary editorial hero: `display`
- Page and major section headings: `headline`
- Card and subsection headings: `title`
- Controls, navigation, badges, and short metadata emphasis: `label`
- Emphasized body or price copy: `bodyBold`
- General prose and supporting text: `body`
- Auxiliary metadata and timestamps: `caption`

When an existing value sits between Figma sizes, choose the closest supported size while preserving hierarchy relative to surrounding text.

## Testing

Implement with test-driven development.

Component tests must verify:

- default `span` rendering;
- semantic `as` rendering;
- correct class composition for a representative role-size pair;
- custom `className` preservation;
- native attribute forwarding;
- representative valid combinations render correctly.

TypeScript provides compile-time enforcement for invalid role-size combinations. Lint and production build validate the migrated application.

The final verification set is:

```bash
npm test
npm run lint
npm run build
```

## Rollout and Compatibility

This is a repository-wide migration completed in one change set. Existing text content, links, interactions, accessibility names, and heading order must remain unchanged. The migration must not introduce Tailwind, CSS Modules, client-only behavior, or new runtime dependencies.

Existing unrelated working-tree changes are preserved. Files with overlapping user edits require a careful diff review before modification.
