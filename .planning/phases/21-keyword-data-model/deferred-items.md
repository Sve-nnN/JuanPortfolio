# Deferred Items — Phase 21

## Pre-existing type errors (out of scope, not caused by plan 21-1)

`pnpm exec tsc --noEmit` reports 114 errors that exist independently of plan 21-1
(verified: identical count before and after the plan's changes). None occur in the
files modified by this plan (Pages, Categories, Users collections or payload-types.ts).

Groups:
- `tests/unit/scripts/syncKeywords*.test.ts`, `tests/unit/seo/syncKeywords.test.ts`,
  `tests/unit/syncKeywords.test.ts` — `KeywordData` type mismatches (missing `status`,
  unknown `hasAiOverview`/`paaQuestions`/`paaCount`/`aiOverviewSnippet`).
- `tests/unit/SeoContext.test.ts`, `tests/unit/utils/markdownTable.test.ts` —
  `KeywordData`/module `keyword-utils` not exported / not found.
- `tests/unit/seo/Crawler.test.ts`, `GSCAdapter.test.ts`, `SeoService.test.ts` —
  unknown/possibly-undefined types, missing `providerName`.
- `tests/unit/sitemaps.test.ts`, `tests/unit/utilities/generateSchema.test.ts` —
  implicit any / User shape mismatches.
- `src/scripts/quick-research.ts(40)` — `'e'` is of type `unknown`.
- `src/scripts/scrape-dinorank.ts(384)` — expected 0 args, got 2 (file already
  modified in dirty working tree from prior unrelated work).

Action: address in a dedicated cleanup pass; not blocking for the keyword data model.
