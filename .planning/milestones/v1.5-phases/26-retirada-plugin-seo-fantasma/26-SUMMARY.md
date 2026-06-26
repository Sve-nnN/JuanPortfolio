# Phase 26: Retirada del plugin SEO fantasma (CLEAN-01) — Summary

**Completed:** 2026-06-26
**Status:** COMPLETE (final tsc-green gate deferred to Phase 27, as planned)

## One-liner

Removed the never-registered homemade SEO plugin `src/plugins/seo/`, relocating its 4 live modules to `src/utilities/seo/` (git history preserved) and repointing all 7 live consumers; `natural` stays server-side.

## What was done

### 1. Relocated 4 live modules (via `git mv`, history preserved)
- `src/plugins/seo/utils/seoAnalyzer.ts` (+ `.test.ts`) → `src/utilities/seo/seoAnalyzer.ts` (+ test)
- `src/plugins/seo/utils/keywordCoverageAudit.ts` (+ `.test.ts`) → `src/utilities/seo/keywordCoverageAudit.ts` (+ test)
- `src/plugins/seo/fields/seoFields.ts` → `src/utilities/seo/seoFields.ts`
- `src/plugins/seo/types/keywordScore.ts` → `src/utilities/seo/keywordScore.ts`

Fixed internal cross-imports after flattening the tree:
- `seoAnalyzer.ts`, `keywordCoverageAudit.ts`, `seoAnalyzer.test.ts`: `'../types/keywordScore'` → `'./keywordScore'`
- `seoAnalyzer` / `keywordCoverageAudit` sibling imports unchanged (`'./seoAnalyzer'`)

### 2. Updated 7 live consumers
- `src/app/api/seo/keyword-score/route.ts` → `@/utilities/seo/seoAnalyzer`
- `src/app/api/seo/keyword-coverage/route.ts` → `@/utilities/seo/keywordCoverageAudit`
- `src/components/admin/KeywordScorePanel.tsx` → `@/utilities/seo/keywordScore`
- `src/components/admin/KeywordCoverageView.tsx` → `@/utilities/seo/keywordCoverageAudit` + `@/utilities/seo/keywordScore` (types only — `natural` stays server-side)
- `src/scripts/audit-keywords.ts` → `../utilities/seo/keywordCoverageAudit`
- `src/collections/Categories.ts` → `../utilities/seo/seoFields`
- `src/collections/Users/index.ts` → `@/utilities/seo/seoFields`

### 3. Deleted dead plugin files
`index.ts`, `endpoints/*` (gsc-integration, seo-analyzer, sitemap), `components/*` (SEOHead, SEOAnalysisField, SEOScoreField, CharacterCounter), `hooks/*` (afterChange, beforeChange), `utils/schemaGenerator.ts`. `src/plugins/seo/` no longer exists.

### 4. vitest.config.mts
No change needed — existing glob `src/**/*.test.{ts,tsx}` already covers the relocated tests at `src/utilities/seo/`.

### 5. Untouched (as instructed)
`src/plugins/index.ts` and `@payloadcms/plugin-seo` registration left intact.

## Verification

- **vitest:** `pnpm exec vitest run` → 90 test files passed, **779 tests passed** (≥775 gate met). The relocated `seoAnalyzer.test.ts` and `keywordCoverageAudit.test.ts` pass at their new location, proving live wiring works.
- **tsc:** `pnpm exec tsc --noEmit` → **116 errors** (baseline 114, **+2 new**). Both new errors are in the 3 known DEAD files (Phase 27 deletes them), NOT in any live file:
  - `src/domains/content/categories/domain/Category.ts(5,27): error TS2307: Cannot find module '@/plugins/seo/fields/seoFields'`
  - `src/domains/user/domain/User.ts(5,27): error TS2307: Cannot find module '@/plugins/seo/fields/seoFields'`
  - (`src/collections/Users/index.ts.backup` is `.backup`, not type-checked, so it adds no tsc error.)
  - **Zero new errors in LIVE files.**
- **grep:** `grep -rn "plugins/seo" src/` → exactly the 3 known dead-file references:
  - `src/domains/content/categories/domain/Category.ts:5`
  - `src/domains/user/domain/User.ts:5`
  - `src/collections/Users/index.ts.backup:6`
- **natural confinement:** preserved — `keywordCoverageAudit.ts`/`seoAnalyzer.ts` (server-only, import `natural`) are reached by the admin only via API routes; client components import types only from `keywordScore`.

## Deviations from Plan

- **Commit consolidation:** The plan suggested separate `refactor(26)` + `chore(26)` commits. The dead-file deletions (`git rm`) were staged before the relocation commit and got included in the single `refactor(26)` commit. Net result is one atomic commit containing all Phase 26 changes with renames recorded as R098–R100 (history preserved). No behavior impact.

## Commits

- `46697c6` — refactor(26): relocate live SEO modules to utilities/seo (includes relocations, 7 consumer updates, and dead-file deletions)

## Self-Check: PASSED

- `src/utilities/seo/{seoAnalyzer,keywordCoverageAudit,seoFields,keywordScore}.ts` + 2 test files: FOUND
- `src/plugins/seo/`: REMOVED (confirmed absent)
- Commit `46697c6`: FOUND in git log
