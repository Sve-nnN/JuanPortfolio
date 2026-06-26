---
phase: 24-keyword-research-population
plan: 02
subsystem: seo-keywords
tags: [payload, localization, i18n, seo, keyword-coverage, scripts, mongodb]
requires:
  - "Plan 24-01: primaryKeyword localized (es/en) in Posts/Pages/Categories/Users"
  - "content/keywords_map.json (136 entries, slug(.locale)? -> keyword string)"
  - "Operator prerequisite: pnpm sync:keywords upserts keyword-metrics from content/keywords.md"
provides:
  - "pnpm populate:keywords script — assigns primaryKeyword per locale from keywords_map.json"
  - "needs-research keyword-metrics stubs (RESEARCH-02) for mapped keywords without a doc"
  - "missing-metrics marking: keyword-metrics lacking volume/difficulty/intent flagged needs-research"
affects:
  - "Phase 23 keyword coverage audit now reports near-zero no-keyword pages (79 -> 9 es / 8 en)"
tech-stack:
  added: []
  patterns:
    - "tsx -r dotenv/config script mirroring audit-keywords.ts (getPayload + @payload-config, ANSI, process.argv)"
    - "NFD-normalized accent/case-insensitive keyword match"
    - "context: { disableRevalidate: true } on writes from scripts (revalidatePath unavailable outside Next)"
    - "withRetry wrapper for transient MongoDB transaction errors"
key-files:
  created:
    - src/scripts/populate-keywords.ts
  modified:
    - package.json
decisions:
  - "Ran the population LIVE (DB reachable). Idempotent across 3 partial runs; final dry-run shows 136/136 already populated."
  - "Stubs seed required volume/difficulty/source (0/0/'keywords_map (needs-research stub)') and reuse the existing status field — no new fields added"
  - "No-clobber check moved BEFORE stub creation so a skipped page never leaves an orphan keyword-metrics doc"
  - "Did NOT run pnpm sync:keywords (operator-only, interactive + external DinoRank/SerpAPI). Stubs use verbatim map strings so a later sync:keywords enriches them by exact-string upsert without duplicating"
metrics:
  duration: ~50m
  completed: 2026-06-26
---

# Phase 24 Plan 02: Populate primaryKeyword + needs-research stubs Summary

`pnpm populate:keywords` reads `content/keywords_map.json` (136 entries), resolves each slug to its Post/Page, matches the `keyword-metrics` doc by accent/case-insensitive keyword, and sets `primaryKeyword` in the correct locale (es/en). Missing metrics docs become `needs-research` stubs that get linked; existing docs lacking volume/difficulty/intent are flagged `needs-research`. The script ran live against the DB: keyword-coverage "No keyword" pages dropped from 79 to 9 (es) and 8 (en). tsc baseline intact (114, 0 errors in the new file); vitest green (776).

## What Was Built

### Task 1 — populate-keywords.ts core: resolve, match, set per locale (commit 28a39ff)
- New `src/scripts/populate-keywords.ts` mirroring `audit-keywords.ts` (getPayload + `@payload-config`, ANSI helpers, `process.argv`).
- Reads `content/keywords_map.json`. Key parsing: `.en` -> en, `.es` -> es, no suffix -> es (default); slug is the remainder.
- Resolves slug -> doc: `posts` then `pages`, with locale fallback (tries the entry locale first, then the other). Reports unresolved slugs without aborting.
- Matches `keyword-metrics` by `norm()` = NFD + strip diacritics + lowercase + trim (e.g. "Hidratacion Web" <-> "hidratacion web"). All metrics preloaded into a Map for in-memory matching.
- No-clobber: reads current `primaryKeyword` in that locale via `findByID({locale, depth:0})`; skips if set unless `--force`.
- Sets via `payload.update({ collection, id, data:{ primaryKeyword }, locale })`; collection union narrowed to a literal so Payload's per-collection overload resolves.
- Flags `--dry-run` (no writes), `--force` (overwrite), `--report` (markdown to `content/keyword-population-report.md`). Console summary grouped by locale.
- `package.json`: `"populate:keywords": "tsx -r dotenv/config src/scripts/populate-keywords.ts"`.

### Task 2 — stubs, missing-metrics marking, resilience (commit d19f8f1)
- STUB (RESEARCH-02): when a mapped keyword has no metrics doc, creates `keyword-metrics` with the verbatim map string, `status:'needs-research'`, and seeds the required `volume:0`/`difficulty:0`/`source` fields, then links `primaryKeyword`. Newly created stubs are added to the in-memory map so repeated map keys reuse them (no unique-key violation, idempotent).
- MARK MISSING: a final pass over all `keyword-metrics` flags docs lacking volume OR difficulty OR intent as `status:'needs-research'` (skips docs already flagged — idempotent). 0 marked in the live run (existing real docs had metrics; fresh stubs were already flagged).
- Header documents the prerequisite/order: `sync:keywords` -> `populate:keywords --dry-run` -> `populate:keywords` -> `audit:keywords`.
- Relation to AUDIT-01/02: stubs + flagged docs surface in the Phase 23 coverage audit's "failing checks" / needs-research flow, giving the operator the research backlog.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] revalidatePath crash on Post/Page update from a script**
- **Found during:** first live run (Task 2 verification).
- **Issue:** `payload.update` on a published Post fired the `revalidatePost` afterChange hook -> `revalidatePath` -> `Error: Invariant: static generation store missing` (Next API unavailable outside a request).
- **Fix:** pass `context: { disableRevalidate: true }` on posts/pages updates (the hooks already gate on `context.disableRevalidate`; same pattern as `assign-categories.ts`, `fix-categories.ts`, `update-author-profile.ts`).
- **Files modified:** src/scripts/populate-keywords.ts
- **Commit:** d19f8f1

**2. [Rule 1 - Bug/Resilience] transient MongoDB transaction aborts killed the whole run**
- **Found during:** second live run.
- **Issue:** Atlas returned `TransientTransactionError` / `NoSuchTransaction` mid-run, aborting the process (exit 1) and leaving population partial.
- **Fix:** added a `withRetry` wrapper (up to 4 attempts, backoff) around create/update calls that retries only on transient transaction errors, plus a per-entry try/catch so a single failure records `outcome:'failed'` and the loop continues. Report adds marked/failed counts.
- **Files modified:** src/scripts/populate-keywords.ts
- **Commit:** d19f8f1

## Live Run — did it run? YES

DB reachable. Population was run live (idempotent across 3 runs due to the two transient/crash issues above; each re-run only filled remaining gaps). Final `--dry-run` confirms full coverage and idempotency:

| Locale | set | stub | skipped (already had) | no page doc | failed |
| --- | --- | --- | --- | --- | --- |
| es | 0 | 0 | 74 | 0 | 0 |
| en | 0 | 0 | 62 | 0 | 0 |

All 136 map entries (74 es + 62 en) resolve to a doc and now have `primaryKeyword` set; re-running changes nothing. `marked needs-research` = 0.

### Audit before/after (`pnpm audit:keywords`)

| Metric (of 79 total pages) | Before (post-24-01) | After — es | After — en |
| --- | --- | --- | --- |
| No keyword | 79 | 9 | 8 |
| Unresolved keyword | 0 | 0 | 0 |
| Failing checks | 0 | 68 | 70 |
| Passing | 0 | 2 | 1 |

"No keyword" collapsed from 79 to 9/8 (the remaining are pages not present in `keywords_map.json`). "Failing checks" rose because pages now have keywords to evaluate and most link to `needs-research` stubs without metrics — this is the intended research backlog surfaced for the operator to fill via `pnpm sync:keywords`.

## Verification

- `pnpm exec tsc --noEmit`: 114 total errors (baseline unchanged), **0 in src/scripts/populate-keywords.ts**. The one transient overload error introduced during development (`primaryKeyword` accepting `number`) was fixed by `String(metrics.id)`.
- `pnpm exec vitest run`: **776 passed / 90 files**, exit 0 (no regressions; no tests added — this plan is a script).
- `test -f src/scripts/populate-keywords.ts` ✔, `grep populate:keywords package.json` ✔, `--dry-run`/`--force`/`normalize('NFD')`/`needs-research`/`volume|difficulty|intent` all present ✔.

## Known Stubs

Stub `keyword-metrics` docs created with `status:'needs-research'` and placeholder `volume:0`/`difficulty:0` are intentional (RESEARCH-02): they exist so coverage links resolve and the Phase 23 audit lists them as the research backlog. They are resolved later by the operator running `pnpm sync:keywords` (enriches by exact keyword-string upsert, no duplication) and re-auditing. Not a blocking stub for this plan's goal (per-locale primaryKeyword population), which is fully achieved.

## Operator note

The generated `content/keyword-population-report.md` was left UNtracked (not committed) — it is a run artifact. The working tree was already dirty; only `src/scripts/populate-keywords.ts` and `package.json` were staged.

## Self-Check: PASSED

- src/scripts/populate-keywords.ts — FOUND
- .planning/phases/24-keyword-research-population/24-02-SUMMARY.md — FOUND
- package.json populate:keywords alias — FOUND
- commit 28a39ff (Task 1) — FOUND
- commit d19f8f1 (Task 2) — FOUND
