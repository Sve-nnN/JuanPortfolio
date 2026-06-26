---
phase: 24-keyword-research-population
reviewed: 2026-06-26T00:00:00Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - src/scripts/populate-keywords.ts
  - src/collections/Posts/index.ts
  - src/collections/Pages/index.ts
  - src/collections/Categories.ts
  - src/collections/Users/index.ts
  - src/plugins/seo/utils/keywordCoverageAudit.test.ts
  - package.json
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: clean
resolved: 2026-06-26
resolution:
  critical: 1
  warning: 3
  info: 3
  commits:
    - 1db05a4  # CR-01 + WR-01/02/03 + IN-02 (populate-keywords.ts)
    - 98285d5  # CR-01 ripple (keywordCoverageAudit.ts)
    - dff0bed  # IN-03 regression test (keywordCoverageAudit.test.ts)
  verification: >-
    tsc --noEmit: 114 errors (baseline, none in touched files).
    vitest run: 779 passed / 90 files. Post-fix audit: en noKeyword 49 -> 17
    (32 genuinely-empty en locales backfilled, matching the dry-run delta of
    26 set + 6 stubs). The pre-fix audit had falsely reported en:8 missing
    because localization.fallback inflated en coverage with es values.
---

# Phase 24: Code Review Report

**Reviewed:** 2026-06-26
**Depth:** deep
**Files Reviewed:** 7
**Status:** clean (all findings resolved 2026-06-26 — commits 1db05a4, 98285d5, dff0bed)

## Summary

The population script is well structured: no-clobber is correctly ordered before stub
creation (no orphans), `disableRevalidate` is genuinely honored by both
`revalidatePost`/`revalidatePage` hooks (verified), `withRetry` only retries true
transient-tx errors and rethrows everything else, `keyword-metrics.keyword` is
`unique: true` so duplicate stubs are blocked at the DB layer, and the report path is a
fixed in-repo constant (no traversal). Stub idempotency holds (preloaded metrics +
in-run cache + unique index).

However there is one correctness defect that directly undermines the phase's stated goal
(per-locale keyword divergence) and silently under-populates the second locale. The
"ran clean + re-run = 0 changes" evidence does NOT disprove it: a run where every
second-locale entry is wrongly skipped is also idempotent and also reports success. This
is the finding to fix before relying on bilingual coverage.

## Critical Issues

### CR-01: No-clobber read inherits the default-locale value via `fallback: true`, silently skipping the second locale

**File:** `src/scripts/populate-keywords.ts:175-199` (read at 175-180; gate at 189)
**Issue:** `payload.config.ts:112` sets `localization.fallback: true` with
`defaultLocale: 'es'`. The no-clobber check reads the current value with:

```ts
const current = await payload.findByID({ collection, id, locale, depth: 0 })
const existing = (current as { primaryKeyword?: unknown }).primaryKeyword
```

When `locale === 'en'` and the document's `en` `primaryKeyword` is **empty**, Payload's
Local API does not return null — it returns the **`es` (default-locale) value as a
fallback**. So `existingId != null` becomes true and the entry is recorded as
`skipped-existing`, even though the `en` field is actually unset.

Because the map interleaves `slug` (es-default) and `slug.en` keys, whichever locale is
processed first for a given doc sets its keyword; when the *other* locale is processed,
the fallback read sees the first locale's value and skips it. Net effect: most docs end
up with a keyword in only **one** locale, while the run reports the rest as
"skipped (have)". This is the exact opposite of the bilingual per-locale design that
commit a8af4ef (`localized: true`) and test #8 exist to enable. A `--force` run masks
the bug (force ignores `existing`), so the defect is invisible unless you inspect raw
per-locale field values.

**Why it matters:** silent data-completeness gap on a production-DB write script; the
phase's coverage audit will then report `en` gaps that the operator believes were just
populated.

**Fix:** disable fallback on the no-clobber read so it reflects the true per-locale value:

```ts
const current = await payload.findByID({
  collection: doc.collection,
  id: doc.id,
  locale,
  fallbackLocale: false, // read the raw per-locale value, not the es fallback
  depth: 0,
})
```

(Equivalently, read `locale: 'all'` and index `primaryKeyword?.[locale]`.) After fixing,
re-run without `--force` to backfill the locales that were wrongly skipped, and confirm
`en` `set` counts jump.

## Warnings

### WR-01: Script always `process.exit(0)`, even when entries failed — masks partial failure in the pipeline

**File:** `src/scripts/populate-keywords.ts:328` (and per-entry catch at 274-278)
**Issue:** Per-entry errors are caught, logged, pushed as `outcome: 'failed'`, and the run
continues — good for resilience — but `main()` ends with an unconditional
`process.exit(0)`. A run where some documents failed to receive their `primaryKeyword`
still returns success. The sibling script sets the precedent the other way:
`audit-keywords.ts:195` uses `process.exit(contentGaps > 0 ? 1 : 0)`. In the documented
operator sequence (sync → populate → audit) a non-zero exit is the only programmatic
signal that population was incomplete.
**Fix:**
```ts
const failed = results.filter((r) => r.outcome === 'failed').length
process.exit(failed > 0 ? 1 : 0)
```
(Keep `process.exit(0)` for `--dry-run`.)

### WR-02: `slug → doc` resolution always prefers `posts` over `pages`, with no collision detection

**File:** `src/scripts/populate-keywords.ts:108-127`
**Issue:** `slug` is **not** a localized field (confirmed in `src/fields/slug.ts`), so the
es/en fallback loop does not change which document matches — it only changes which
collection is tried in what order: `posts` is always tried before `pages`. If a slug
exists in both collections, the keyword is written to the **post**, never the page, with
no warning. The map is silent about which collection a key targets, so a page that shares
a slug with a post is unreachable/mis-targeted.
**Fix:** detect ambiguity instead of silently picking posts — e.g. query both collections
and, if both match, record a distinct outcome (`ambiguous`) and skip, or namespace map
keys by collection. At minimum log a warning when a slug resolves in more than one
collection.

### WR-03: Normalized matching is many-to-one; duplicate `keyword-metrics` docs link non-deterministically

**File:** `src/scripts/populate-keywords.ts:144-159, 203`
**Issue:** `metricsByNorm` keys on `norm(keyword)` and is a plain `Map`, so if two
`keyword-metrics` docs normalize to the same string (e.g. `"hidratación web"` vs the map's
`"Hidratacion Web"`, or any accent/case variant), only the **last one paginated** wins,
and which doc a post links to depends on DB page order. The map itself contains 40+
keyword values that normalize to duplicates across locales, so this path is exercised.
Stub creation is safe (preload + in-run cache + `unique: true` on `keyword` prevents
duplicate stubs), but linking to an arbitrary one of several real duplicates is a latent
correctness/consistency issue.
**Fix:** when `metricsByNorm.has(norm)` already, prefer the non-stub / higher-quality doc
(e.g. one whose `status !== 'needs-research'` or with non-zero volume) rather than
last-write-wins, and log a warning on normalized collisions so duplicates can be merged.

## Info

### IN-01: No-suffix keys default to `es`, which can set an `es` keyword on en-only content

**File:** `src/scripts/populate-keywords.ts:90` (55 of 136 keys have no suffix)
**Issue:** `parseKey` maps any suffix-less key to `locale: 'es'`. For a document that only
has English content, this writes the `primaryKeyword` into the `es` localized slot. Given
the es-default content model this is usually correct, but it is an assumption worth
asserting rather than defaulting silently.
**Fix:** optionally cross-check that the resolved doc actually has content in the target
locale before writing, or document the es-default contract in the report output.

### IN-02: Marking pass swallows per-doc errors and under-counts

**File:** `src/scripts/populate-keywords.ts:299-311`
**Issue:** When marking existing metrics as `needs-research` fails, the error is logged but
`marked` is not incremented and the run proceeds with no aggregate failure signal (ties
into WR-01). A doc that should have been flagged for the audit can be silently missed.
**Fix:** track a `markFailed` counter and include it in the summary/exit-code logic.

### IN-03: Test #8 is tautological — it does not exercise the `localized: true` change

**File:** `src/plugins/seo/utils/keywordCoverageAudit.test.ts:132-180`
**Issue:** The "locale divergence" test feeds `auditDoc` two hand-built inputs (`keyword:
null` for en, a full keyword object for es) and asserts the buckets differ. That assertion
is true by construction of the inputs; it does not touch `payload.find({ locale })`,
localized field resolution, or the fallback behavior that CR-01 depends on. It documents
intent but provides no regression protection for the actual localized-resolution path
(and would not have caught CR-01).
**Fix:** add an integration-level test that reads `primaryKeyword` per locale through the
Local API with `fallbackLocale: false` to prove en/es truly diverge at the data layer.

---

_Reviewed: 2026-06-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
