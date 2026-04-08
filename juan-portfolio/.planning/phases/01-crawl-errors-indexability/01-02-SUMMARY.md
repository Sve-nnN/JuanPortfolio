---
phase: 01-crawl-errors-indexability
plan: 02
subsystem: CMS, redirects, categories
tags: [slug-rename, redirect, noindex, general-category]
dependency_graph:
  requires: []
  provides:
    - mejores-cursos-seo-espanol.md (ascii slug, no ñ)
    - 301 redirects from both ñ URL variants to ascii slug
    - General category has noindex=true
    - content-sync.json updated with new slug
  affects:
    - content/posts/seo/mejores-cursos-seo-espanol.md
    - content/content-sync.json
    - MongoDB redirects collection (2 new records)
    - MongoDB categories collection (noindex=true on General)
tech_stack:
  added: []
  patterns:
    - Direct MongoDB insert used to bypass Next.js revalidateTag hook in local API mode
key_files:
  created:
    - content/posts/seo/mejores-cursos-seo-espanol.md
  modified:
    - content/content-sync.json
decisions:
  - "Used direct MongoDB insert for redirects to bypass revalidateRedirects hook (calls revalidateTag which requires Next.js server context)"
  - "Redirects use 'reference' type pointing to the post object, consistent with plugin-redirects schema"
metrics:
  duration: "~20 min"
  completed: "2026-03-31"
  tasks_completed: 2
  files_changed: 2
---

# Phase 1 Plan 02: Slug Rename + Redirects + noindex General Summary

Rename mejores-cursos slug (removing ñ), create 301 redirects for old URLs, and apply noindex to the General category.

## What Was Built

**Task 1: Rename mejores-cursos file**
- Renamed `mejores-cursos-seo-en-español.md` → `mejores-cursos-seo-espanol.md` (bash mv)
- Added explicit `slug: mejores-cursos-seo-espanol` to frontmatter
- File was untracked in git (never committed) so added as new file

**Task 2: CMS operations**
- Operation A: Updated CMS post slug from `mejores-cursos-seo-en-español` to `mejores-cursos-seo-espanol` via Payload local API
- Operation B: Created two 301 redirect records in MongoDB redirects collection:
  - `/blog/seo/mejores-cursos-seo-en-espa%C3%B1ol` → reference to mejores-cursos post
  - `/blog/seo/mejores-cursos-seo-en-español` (literal ñ) → reference to mejores-cursos post
- Operation C: Set `noindex: true` on General category via Payload local API
- Pushed mejores-cursos-seo-espanol.md via `pnpm sync push` — content-sync.json updated

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] revalidateRedirects hook blocks Payload local API**
- **Found during:** Task 2, Operation B
- **Issue:** `src/hooks/revalidateRedirects.ts` calls `revalidateTag('redirects')` from `next/cache`. This requires Next.js static generation store context, which is absent in the local API / script execution environment. Every `payload.create({ collection: 'redirects' })` call threw `Invariant: static generation store missing`.
- **Fix:** Used direct MongoDB insert via `mongodb` driver to bypass the hook entirely. The records are correctly persisted in the `redirects` collection.
- **Files modified:** None (direct DB operation, no code change needed)

## Commits

| Hash | Description |
|------|-------------|
| 9ebb415 | feat(01-02): add mejores-cursos with ascii slug (rename from ñ-slug) |
| 62f17d3 | feat(01-02): rename CMS slug, create 301 redirects, noindex General category |

## Self-Check: PASSED

- content/posts/seo/mejores-cursos-seo-espanol.md: exists
- Old ñ-slug file: does not exist
- CMS post slug: mejores-cursos-seo-espanol (confirmed by Payload query)
- Redirects: 2 records in MongoDB (confirmed by countDocuments)
- General category noindex: true (confirmed by Payload query)
- content-sync.json: contains mejores-cursos-seo-espanol entry
