---
phase: 23-coverage-audit
plan: 01
subsystem: seo
tags: [seo, keyword-coverage, audit, tsx-script]
requires: [analyzeKeywordChecks, keywordScore types]
provides: [runKeywordCoverageAudit, auditDoc, audit:keywords]
affects: [src/plugins/seo, src/scripts, package.json]
tech-stack:
  added: []
  patterns: [pure-core + thin-runner, tsx -r dotenv/config script, versionable markdown report]
key-files:
  created:
    - src/plugins/seo/utils/keywordCoverageAudit.ts
    - src/plugins/seo/utils/keywordCoverageAudit.test.ts
    - src/scripts/audit-keywords.ts
    - content/keyword-coverage-audit.md
  modified:
    - package.json
    - src/plugins/seo/utils/seoAnalyzer.ts
decisions:
  - "List 2 (failing) = >=1 applicable RED check; amber is reported as a warning, not a failure"
  - "N/A checks decided purely from isListing + undefined title/slug/meta source; N/A never flips the bucket"
  - "Edit link (/admin/collections/<col>/<id>) used as the row URL — always correct vs public routing"
metrics:
  duration: ~25m
  completed: 2026-06-26
---

# Phase 23 Plan 01: Shared keyword-coverage audit core + tsx script + unit test Summary

One pure server-side core (`runKeywordCoverageAudit` + `auditDoc`) that buckets every Post/Page/Category/User into no-keyword / failing / passing, consumed by a `pnpm audit:keywords` tsx runner that prints both lists and writes a versionable markdown report.

## What was built

- **`keywordCoverageAudit.ts`** — shared, server-only core:
  - `auditDoc()` pure bucketing unit: noKeyword (AUDIT-01), failing (>=1 applicable RED, AUDIT-02), or passing. Reuses `analyzeKeywordChecks` (no duplicated check logic). Listings get content checks (h1/density/firstParagraph/subheadings) plus undefined-source checks (slug/meta) reported as N/A — never failing.
  - `runKeywordCoverageAudit(payload)` orchestrator: live `payload.find` per collection (depth 1, limit 1000, AUDIT-03), extracts per-collection content (Posts `content.content`, Pages `content.layout`, listings none), splits into the three buckets, timestamped `generatedAt`.
- **`keywordCoverageAudit.test.ts`** — 6 vitest cases locking bucketing + N/A logic.
- **`audit-keywords.ts`** — tsx runner mirroring `audit-urls.ts` (getPayload + `@payload-config`, ANSI colors, `--locale` arg). Console summary + 2 lists; writes `content/keyword-coverage-audit.md` (counts table + both lists as markdown tables); non-zero exit on coverage gaps.
- **`package.json`** — `audit:keywords` alias.

## Verification results

- **Unit test (new):** `pnpm exec vitest run src/plugins/seo/utils/keywordCoverageAudit.test.ts` → 6/6 passed.
- **Full suite:** `pnpm exec vitest run` → 90 files, 774 tests passed (above the 768+ baseline; includes the 6 new tests). Green.
- **tsc:** `pnpm exec tsc --noEmit` → 114 errors, identical to the pre-existing baseline. Zero new errors attributable to `keywordCoverageAudit.ts`, `keywordCoverageAudit.test.ts`, `audit-keywords.ts`, or `seoAnalyzer.ts` (verified by grepping each filename out of the tsc output).
- **Script ran live:** `pnpm audit:keywords` connected to the DB and produced a real report — Total 79 / No keyword 53 / Failing 26 / Passing 0. Console printed both colored lists; `content/keyword-coverage-audit.md` written (12,283 bytes, fresh timestamp). Exit code 1 (coverage gaps exist), as designed. NOT blocked by DB env.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `natural` failed to load under the tsx ESM runner**
- **Found during:** Task 3 (first `pnpm audit:keywords` run).
- **Issue:** `seoAnalyzer.ts` used `import { PorterStemmer, PorterStemmerEs } from 'natural'`. `natural` is a CommonJS package with no ESM named-export interop, so tsx threw `SyntaxError: The requested module 'natural' does not provide an export named 'PorterStemmer'`. This would break the script in any environment, not just headless — a hard blocker for the deliverable, independent of DB connectivity.
- **Fix:** Switched to a default (CJS namespace) import + destructure: `import natural, { type Stemmer } from 'natural'; const { PorterStemmer, PorterStemmerEs } = natural`. No logic change. Works across Next/webpack, Vitest/Vite, and tsx (esModuleInterop is on).
- **Files modified:** `src/plugins/seo/utils/seoAnalyzer.ts`
- **Commit:** 30bc0ac
- **Confirmed safe:** full vitest suite (774) and tsc baseline (114) both unchanged after the edit.

## Commits

- `be7e9bc` feat(23): add shared keyword coverage audit core
- `2517760` test(23): cover auditDoc bucketing and N/A listing handling
- `30bc0ac` fix(23): default-import natural so it loads under the tsx ESM runner
- `06392de` feat(23): add audit:keywords tsx script + markdown report

## Notes for plan 23-02 (admin view)

- The admin coverage view must call `runKeywordCoverageAudit` through a **server endpoint** (like `/api/seo/keyword-score`), never import this module client-side — it pulls in `natural`.
- Real-world data confirms the audit surfaces meaningful gaps: 53 pages have no `primaryKeyword` yet (population is Phase 24), and many DB post ids/titles are unpopulated relationships — `extractKeyword` correctly treats unpopulated string ids as no-keyword.

## Self-Check: PASSED
- FOUND: src/plugins/seo/utils/keywordCoverageAudit.ts
- FOUND: src/plugins/seo/utils/keywordCoverageAudit.test.ts
- FOUND: src/scripts/audit-keywords.ts
- FOUND: content/keyword-coverage-audit.md
- FOUND commit: be7e9bc, 2517760, 30bc0ac, 06392de
