---
phase: 01-crawl-errors-indexability
plan: 01
subsystem: sync-module, generateMeta, CMS
tags: [noindex, seo, sync, generateMeta, types]
dependency_graph:
  requires: []
  provides:
    - noindex field on PostFrontmatter and PayloadPostData
    - generateMeta emits robots noindex
    - CMS: guia-eeat EN and sql-vs-nosql EN have noindex=true
    - experiencia-de-usuario EN stub created and synced
  affects:
    - src/scripts/sync/types.ts
    - src/scripts/sync/postParser.ts
    - src/utilities/generateMeta.ts
    - src/collections/Posts/index.ts
    - src/payload-types.ts
tech_stack:
  added: []
  patterns:
    - noindex as top-level field on Post document (matches Category pattern from seoFields.ts)
    - PayloadPostData.noindex (top-level) mirrors CMS schema
key_files:
  created:
    - content/posts/cs-fundamentals/experiencia-de-usuario.en.md
  modified:
    - src/scripts/sync/types.ts
    - src/scripts/sync/postParser.ts
    - src/utilities/generateMeta.ts
    - src/collections/Posts/index.ts
    - src/payload-types.ts
    - tests/unit/sync/postParser.test.ts
decisions:
  - "noindex is top-level on Post document (not in meta group) — consistent with Category schema and seoFields.ts pattern"
  - "Added noindex checkbox to Posts collection schema since official @payloadcms/plugin-seo does not include it"
  - "generateMeta checks doc.noindex first (via doc cast) as primary signal for Posts; meta?.noindex fallback handles future cases"
metrics:
  duration: "~35 min"
  completed: "2026-03-31"
  tasks_completed: 3
  files_changed: 6
---

# Phase 1 Plan 01: Fix noindex End-to-End Summary

Wire the noindex field end-to-end: sync module type contracts, postParser wiring, Posts collection schema, generateMeta robots emission, and CMS updates for three affected EN posts.

## What Was Built

**Task 1 (TDD RED+GREEN): Add noindex to sync type contracts**
- Added `NOINDEX_FRONTMATTER` fixture and 4 new tests to `tests/unit/sync/postParser.test.ts`
- Added `noindex?: boolean` to `PostFrontmatter` in `types.ts`
- Moved `noindex?: boolean` to top-level of `PayloadPostData` (not inside `meta`) to match CMS schema
- All 35 postParser tests pass

**Task 2: Wire noindex through postParser and generateMeta**
- Updated `postParser.ts` `buildPostData` to include `noindex: post.frontmatter.noindex` at the top-level of the return value
- Updated `generateMeta.ts` to derive `noindex` flag from `doc?.noindex` and emit `robots: { index: false, follow: false }` when truthy

**Task 3: Posts collection schema + CMS updates + EN stub**
- Added `noindex` checkbox field to `src/collections/Posts/index.ts`
- Regenerated `payload-types.ts` — `Post.noindex?: boolean | null` now in generated types
- Set `noindex: true` on guia-eeat (EN locale) in CMS via Payload local API
- Set `noindex: true` on sql-vs-nosql (EN locale) in CMS via Payload local API
- Created `content/posts/cs-fundamentals/experiencia-de-usuario.en.md` stub with `noindex: true`
- Pushed stub to CMS via `pnpm sync push` — `experiencia-de-usuario` EN record has `noindex: true`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] noindex field is top-level on Post, not in meta group**
- **Found during:** Task 3
- **Issue:** The PLAN assumed `meta.noindex` based on CONTEXT.md notes about `@payloadcms/plugin-seo`. But the official plugin only adds `meta.title`, `meta.description`, `meta.image`. The custom `seoFields.ts` adds `noindex` as a top-level field on Category. Posts had no `noindex` field at all.
- **Fix:**
  1. Added `noindex` checkbox to `Posts/index.ts` collection schema (top-level, sidebar position)
  2. Changed `PayloadPostData.meta.noindex` → `PayloadPostData.noindex` (top-level)
  3. Changed `postParser.ts` to place `noindex` at top-level in return value
  4. Updated 2 test assertions: `data.meta.noindex` → `data.noindex`
  5. Regenerated `payload-types.ts`
- **Files modified:** `src/collections/Posts/index.ts`, `src/scripts/sync/types.ts`, `src/scripts/sync/postParser.ts`, `src/payload-types.ts`, `tests/unit/sync/postParser.test.ts`
- **Commit:** 72cbc93

## Commits

| Hash | Description |
|------|-------------|
| 6c90e12 | test(01-01): add failing noindex tests for postParser |
| ca8fd30 | feat(01-01): add noindex to sync type contracts and postParser |
| 414c2ff | feat(01-01): generateMeta emits robots noindex when meta.noindex or doc.noindex is true |
| 72cbc93 | feat(01-01): add noindex field to Posts collection and wire end-to-end |

## Self-Check: PASSED

All files exist. All commits found in git log.
