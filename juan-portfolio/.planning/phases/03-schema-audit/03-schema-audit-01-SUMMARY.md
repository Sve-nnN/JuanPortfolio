---
phase: 03-schema-audit
plan: 01
subsystem: schema
tags: [audit, schema-org, structured-data]
key-files:
  created:
    - .planning/phases/03-schema-audit/03-AUDIT-NOTES.md
decisions:
  - generateArticleSchema.ts is dead code — active BlogPosting comes from generateSchema.ts
  - BreadcrumbList already wired on post and category pages — no SCHEMA-05 implementation needed
  - Homepage emits only FAQPage — Person and ProfessionalService are completely absent
metrics:
  duration: "~5min"
  completed: "2026-03-30"
  tasks: 1
  files: 1
---

# Phase 3 Plan 1: Schema Audit Summary

One-liner: Schema.org emission audit revealing two critical gaps — missing Person/ProfessionalService on homepage and missing mainEntityOfPage/@id on BlogPosting.

## What Was Found

### Schema Emission Map Summary

- **Homepage**: Only emits FAQPage (from layout blocks + expertFaq fallback). No Person, Organization, WebSite, or ProfessionalService.
- **Blog post pages**: Emits BlogPosting + BreadcrumbList via `@graph`. BlogPosting is missing `@id` and `mainEntityOfPage`.
- **Blog category pages**: Emits CollectionPage + BreadcrumbList + optional FAQPage. BreadcrumbList is correct.
- **Blog listing**: Handled via `[slug]/page.tsx` with slug=`blog-listing` — WebPage schema only.
- **Generic CMS pages**: WebPage schema or custom `meta.jsonLD`.

### Key Gaps Identified

1. **Homepage**: `generatePersonSchema` exists but is never called from `JsonLd.tsx`. `ProfessionalService` schema is not implemented anywhere.
2. **BlogPosting**: `generateSchema.ts` (the active generator for post pages) produces BlogPosting without `@id` or `mainEntityOfPage`. These are required by Google's Rich Results criteria.
3. **`generateArticleSchema.ts`**: Exported from schema index but not imported/called by any active page — dead code.
4. **BreadcrumbList**: Already correctly wired on post pages (4-item breadcrumb) and category pages (3-item breadcrumb) — no changes needed.

## Files Read During Audit

- `src/utilities/generateSchema.ts`
- `src/components/JsonLd.tsx`
- `src/app/(frontend)/[locale]/[slug]/page.tsx`
- `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx`
- `src/app/(frontend)/[locale]/blog/[category]/page.tsx`
- `src/utilities/schema/generateArticleSchema.ts`
- `src/utilities/schema/generatePersonSchema.ts`
- `src/utilities/schema/index.ts`

## Deviations from Plan

None — plan executed exactly as written.
