---
phase: 03-schema-audit
plan: 03
subsystem: schema
tags: [schema-org, blogposting, structured-data, rich-results]
key-files:
  modified:
    - src/utilities/generateSchema.ts
decisions:
  - '@id' set to the canonical post URL (same as the url field) — self-referencing IRI per schema.org spec
  - mainEntityOfPage uses @type WebPage + @id pointing to same canonical URL — required by Google Rich Results
metrics:
  duration: "~3min"
  completed: "2026-03-31"
  tasks: 1
  files: 1
---

# Phase 3 Plan 3: Fix BlogPosting Schema Summary

One-liner: Added `@id` and `mainEntityOfPage` to the BlogPosting node in `generateSchema.ts`, satisfying Google Rich Results required fields for Article schema.

## Exact Lines Changed in generateSchema.ts

Before (posts branch BlogPosting object, lines 58-71):
```typescript
mainEntity = {
  ...baseSchema,
  '@type': 'BlogPosting',
  headline: title,
  // ...
  author: { ... }
}
```

After (lines 58-76):
```typescript
mainEntity = {
  ...baseSchema,
  '@type': 'BlogPosting',
  '@id': url,                        // NEW — self-referencing IRI
  headline: title,
  // ...
  author: { ... },
  mainEntityOfPage: {                 // NEW — Google Rich Results requirement
    '@type': 'WebPage',
    '@id': url,
  },
}
```

## BreadcrumbList Status

Already wired in post page (`/blog/[category]/[slug]/page.tsx`): builds 4-item breadcrumb array (Home → Blog → Category → Post) and passes to `generateSchema`. The function wraps BlogPosting + BreadcrumbList in a `@graph`. No changes needed.

Category pages also already call `generateBreadcrumbSchema` directly. No changes needed.

## TypeScript Check Result

`grep -n "mainEntityOfPage" src/utilities/generateSchema.ts` — returns line 72: PASS
`grep -n "'@id': url" src/utilities/generateSchema.ts` — returns lines 61 and 74: PASS
No new TypeScript errors in generateSchema.ts.

## Deviations from Plan

None — plan executed exactly as written.
