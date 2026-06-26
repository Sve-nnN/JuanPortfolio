---
phase: 24-keyword-research-population
plan: 01
subsystem: seo-keywords
tags: [payload, localization, i18n, seo, keyword-coverage]
requires:
  - "Phase 21: primaryKeyword relationship field"
  - "Phase 22: KeywordScorePanel + /api/seo/keyword-score"
  - "Phase 23: keywordCoverageAudit locale-parameterized plumbing"
provides:
  - "primaryKeyword localized (es/en) in Posts, Pages, Categories, Users"
  - "Per-locale keyword coverage audit proven via unit test"
affects:
  - "Plan 24-02 (population) depends on the localized field"
tech-stack:
  added: []
  patterns:
    - "Payload localized: true on relationship field (MongoDB schemaless, no migration)"
key-files:
  created: []
  modified:
    - src/collections/Posts/index.ts
    - src/collections/Pages/index.ts
    - src/collections/Categories.ts
    - src/collections/Users/index.ts
    - src/payload-types.ts
    - src/plugins/seo/utils/keywordCoverageAudit.test.ts
decisions:
  - "Localize all 4 collections (not just Posts/Pages) for panel locale-aware consistency (CONTEXT recommendation)"
  - "No code change needed in KeywordScorePanel/endpoint or keywordCoverageAudit.ts — already locale-aware; Task 1 supplied the missing piece (localized field)"
  - "No manual migration of pre-existing flat primaryKeyword values — plan 24-02 re-populates from keywords_map.json"
metrics:
  duration: ~10m
  completed: 2026-06-26
---

# Phase 24 Plan 01: Localize primaryKeyword + locale-aware ripple Summary

`primaryKeyword` is now a localized (es/en) relationship across Posts, Pages, Categories and Users; Payload types regenerated; Phase 22 panel/endpoint verified locale-aware with no code change; Phase 23 coverage audit proven to report gaps per locale via a new divergence unit test. All tests green (776), tsc baseline intact (114, no new errors in touched files).

## What Was Built

### Task 1 — Localize primaryKeyword in 4 collections + regenerate types (commit a8af4ef)
Added `localized: true` to the `primaryKeyword` relationship (`relationTo: 'keyword-metrics'`) in:
- `src/collections/Posts/index.ts`
- `src/collections/Pages/index.ts`
- `src/collections/Categories.ts`
- `src/collections/Users/index.ts`

`semanticKeywords` was left untouched (only `primaryKeyword` per plan). Ran `pnpm generate:types` (exit 0). `src/payload-types.ts` shows no TS diff because a localized relationship keeps the same TS shape (still a relationship/id|object) — Payload stores the value as a per-locale subdocument `{ es, en }` at the DB level, which does not change the generated type. This is expected per the plan.

### Task 2 — Verify Phase 22 panel + endpoint (verification only, no commit)
No code change required. Confirmed:
- `KeywordScorePanel.tsx` already uses `useLocale()` (line 83) and reads `fields['primaryKeyword'].value` — Payload delivers the active-locale value for localized fields in form state.
- The panel sends `locale` in the POST body to `/api/seo/keyword-score`.
- The metrics fetch `/api/keyword-metrics/${keywordId}?depth=0` correctly needs no locale because `keyword-metrics` is NOT localized (out of scope per CONTEXT).
- `/api/seo/keyword-score/route.ts` respects `locale` from the body (line 51).
- `initialData?.primaryKeyword` fallback still resolves correctly — the admin loads the document for the active locale, so `initialData` carries the active-locale value.

tsc on both files: 0 errors.

### Task 3 — Locale-aware audit confirmed + divergence test (commit 4af9a2a)
The Phase 23 plumbing was already locale-aware end-to-end: `runKeywordCoverageAudit(payload, {locale})` passes `locale` to all 4 `payload.find({..., depth:1, locale})` calls and to every `auditDoc({locale})` mapping (posts/pages/categories/users). With `primaryKeyword` now localized (Task 1), querying by locale resolves the per-locale keyword (previously both locales returned the same value). No production code change was needed in `keywordCoverageAudit.ts`.

Added test 8 (`src/plugins/seo/utils/keywordCoverageAudit.test.ts`): a pure two-pass `auditDoc` divergence case for the same document id — `locale:'en', keyword:null` → bucket `noKeyword` (gap in en); `locale:'es', keyword:'núcleos vitales web'` with optimized es title/meta/slug/content → bucket `passing`. Asserts the buckets diverge, documenting that a doc with a keyword in es but not en is a gap in en.

## TDD Gate Compliance
Task 3 is `tdd="true"`. The divergence test passed on first run (no RED phase) because the feature already exists by design: the Phase 23 audit plumbing was locale-parameterized before this plan, and Task 1 supplied the only missing piece (the localized field). Per the fail-fast investigation rule, this is the expected "feature already present" case — the test documents and locks in already-supported behavior rather than driving new code. No production code change was required in the audit module, so a `feat` GREEN commit is not applicable; the change is correctly a `test(...)` commit.

## Deviations from Plan
None — plan executed as written. Task 2 produced no commit because verification confirmed no code change was needed (anticipated by the plan: "En la mayoría de los casos NO se necesita cambio de código").

## Known Stubs
None.

## Expected behavior — pre-existing flat values (not a defect)
MongoDB is schemaless (`mongooseAdapter`), so localizing an existing field needs no migration files. Pre-existing flat `primaryKeyword` values (the ~26 baseline docs) now fall outside the locale slot and will be re-populated per-locale by plan 24-02 from `content/keywords_map.json` (source of truth). This is documented, not migrated, per the plan's notes and threat T-24-02 (disposition: accept).

## Verification Results
- `pnpm generate:types`: exit 0, no error.
- `pnpm exec vitest run`: 776 tests passed across 90 files (was 775 baseline + 1 new divergence test). All green.
- `pnpm exec tsc --noEmit`: 114 total errors = baseline exactly (114 pre-existing in tests/scripts). 0 errors in any touched file (Posts/index, Pages/index, Categories.ts, Users/index, payload-types, KeywordScorePanel, keyword-score, keywordCoverageAudit).
- 4 collections confirmed with `localized: true` on primaryKeyword.
- `payload generate:importmap` not run — no component exports changed (not required).

## Phases 21/22/23 — no regression
- Phase 21 (field): primaryKeyword still a relationship to keyword-metrics, now localized — no breakage.
- Phase 22 (panel/endpoint): verified locale-aware, tsc clean, all related tests green.
- Phase 23 (audit): all 7 original audit tests (1-7) unchanged and green; plumbing untouched; new test 8 added.
- Full suite green (776) confirms no cross-phase regression.

## Commits
- a8af4ef — feat(24): localize primaryKeyword across Posts, Pages, Categories, Users
- 4af9a2a — test(24): prove per-locale keyword coverage divergence in audit

## Self-Check: PASSED
