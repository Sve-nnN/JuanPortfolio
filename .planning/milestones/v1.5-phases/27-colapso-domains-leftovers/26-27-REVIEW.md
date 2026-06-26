---
phase: 26-27-colapso-domains-leftovers
reviewed: 2026-06-26T14:14:00Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - src/utilities/seo/seoAnalyzer.ts
  - src/utilities/seo/keywordCoverageAudit.ts
  - src/utilities/seo/seoFields.ts
  - src/utilities/seo/keywordScore.ts
  - src/utilities/seo/seoAnalyzer.test.ts
  - src/utilities/seo/keywordCoverageAudit.test.ts
  - src/collections/AdBanners/index.ts
  - src/app/api/seo/keyword-score/route.ts
  - src/app/api/seo/keyword-coverage/route.ts
  - src/components/admin/KeywordScorePanel.tsx
  - src/components/admin/KeywordCoverageView.tsx
  - src/scripts/audit-keywords.ts
  - src/payload.config.ts
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: clean
---

# Phase 26+27: Code Review Report

**Reviewed:** 2026-06-26T14:14:00Z
**Depth:** deep
**Files Reviewed:** 13
**Status:** clean

## Summary

Pure move/delete refactor (CLEAN-01/02/03): relocate 4 live SEO modules
`plugins/seo/* -> utilities/seo/*`, delete the never-registered homemade SEO
plugin (13 dead files), move AdBanner `domains/content/ad-banners/domain ->
collections/AdBanners`, and delete the entire DDD scaffolding (`domains/**`,
`domain/**`) plus a `.backup` leftover.

I traced all five subtle-breakage vectors the green gates would not catch.
Every one came back clean. Two cosmetic Info items only — no Critical/High,
nothing that should block the merge.

### Item-by-item verification

1. **Content preservation (SEO modules) — clean.** Diffing with rename
   detection (`git show 46697c6 -M`) confirms the only deltas are import-path
   fixes: `seoAnalyzer.ts` and `keywordCoverageAudit.ts` changed
   `../types/keywordScore -> ./keywordScore`; `seoAnalyzer.test.ts` changed two
   import lines the same way. `seoFields.ts`, `keywordScore.ts` and
   `keywordCoverageAudit.test.ts` are byte-identical pure renames (0 content
   changes). No edits to scoring logic, field definitions, or types. Moved
   tests run green locally (38 passed: 27 analyzer + 11 coverage).

2. **AdBanner move — clean.** The collection body (slug `ad-banners`, access
   `authenticated`/`authenticatedOrPublished`, labels, 4 fields, admin config)
   is identical to the deleted `domains/.../AdBanner.ts`. The only change is the
   access import depth: `../../../../access -> ../../access`, which from
   `src/collections/AdBanners/` correctly resolves to `src/access/`
   (`authenticated.ts` and `authenticatedOrPublished.ts` both confirmed
   present). `payload.config.ts` imports `AdBannersCollection` from
   `./collections/AdBanners` (lines 21/130/175 consistent). No behavior change.

3. **`natural` stays server-side — clean.** Both admin client components are
   `'use client'` and import the audit/score modules type-only:
   `KeywordCoverageView.tsx:7` uses `import type { CoverageRow,
   KeywordCoverageReport } from '@/utilities/seo/keywordCoverageAudit'` (erased
   at compile, never pulls the analyzer runtime), and its sole value import is
   `CHECK_LABELS` from `keywordScore` (a leaf module with zero imports — no
   `natural`). `KeywordScorePanel.tsx:7` is also `import type` from
   `keywordScore`. The `natural` NLP stemmer reaches the bundle only through the
   server endpoints `/api/seo/keyword-score` and `/api/seo/keyword-coverage`.

4. **Dangling refs in NON-src locations — clean.** Repo-wide sweep
   (excluding node_modules/.git/.planning/graphify-out) found zero references to
   `plugins/seo`, `domains/`, `domain/author`, or `domain/caseStudy` as
   filesystem paths. Verified specifically: `tsconfig.json` (`@/*` -> `./src/*`
   alias intact, resolves `@/utilities/seo/*`), `vitest.config.mts` (glob
   `src/**/*.test.{ts,tsx}` auto-collects the relocated tests; exclude list has
   no stale moved-path entries), `package.json` (`sync:gsc` points at
   `src/scripts/seo/sync-gsc.ts`, which exists — a different `seo` directory, not
   the deleted plugin; `@payloadcms/plugin-seo` is the official npm dependency,
   unrelated to the homemade plugin), and the generated
   `src/app/(payload)/admin/importMap.js` (all entries resolve to live
   `@/components/admin/*` or official `@payloadcms/*` packages — no homemade SEO
   plugin or domain references).

5. **String/by-path runtime refs to deleted dirs — clean.** The only matches
   for `ad-banners` outside the collection itself are Payload `relationTo:
   'ad-banners'` slug references (PostSidebar, SidebarBanners, Posts) — these
   bind to the collection **slug**, which was preserved verbatim, not to any
   deleted filesystem path. No dynamic `import()` strings, no Payload
   config-by-path lookups, and no other string references pointed into the
   removed `domains/**`, `domain/**`, or `plugins/seo/**` trees. Directories
   confirmed gone; `Users/index.ts.backup` confirmed deleted.

## Info

### IN-01: AdBanners/index.ts missing trailing newline

**File:** `src/collections/AdBanners/index.ts:53`
**Issue:** The relocated file ends with `export type AdBanner = AdBannerType`
and no trailing newline (`\ No newline at end of file` in the diff). Cosmetic;
some lint/format configs flag this.
**Fix:** Add a single trailing newline at EOF.

### IN-02: Orphan re-export name `AdBanners` dropped (intentional, verified safe)

**File:** `src/collections/AdBanners/index.ts`
**Issue:** The pre-move stub exported `export const AdBanners =
AdBannersCollection`; the new file exports `AdBannersCollection` (plus the
`AdBanner` type) and no longer exports `AdBanners`. This is the intended cleanup
of the orphan re-export. Confirmed no remaining importer references the old
`AdBanners` name (only `payload.config.ts` consumes the collection, and it
imports `AdBannersCollection`). Recorded for traceability, not a defect.
**Fix:** None needed.

---

_Reviewed: 2026-06-26T14:14:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
