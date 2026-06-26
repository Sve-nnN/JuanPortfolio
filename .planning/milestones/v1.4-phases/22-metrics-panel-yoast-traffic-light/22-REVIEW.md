---
phase: 22-metrics-panel-yoast-traffic-light
reviewed: 2026-06-25T00:00:00Z
depth: deep
files_reviewed: 6
files_reviewed_list:
  - src/plugins/seo/utils/seoAnalyzer.ts
  - src/plugins/seo/types/keywordScore.ts
  - src/app/api/seo/keyword-score/route.ts
  - src/components/admin/KeywordScorePanel.tsx
  - src/collections/Posts/index.ts
  - src/collections/Pages/index.ts
findings:
  critical: 0
  high: 1
  medium: 4
  low: 5
  total: 10
status: clean
---

# Phase 22: Code Review Report — Keyword Scoring Engine + Endpoint + Admin Panel

**Reviewed:** 2026-06-25
**Depth:** deep (cross-file: analyzer ↔ endpoint ↔ client ↔ collections ↔ form-state)
**Files Reviewed:** 6
**Status:** findings

## Summary

The scoring engine is well structured: weights sum to 100, color thresholds are locked, `natural` is correctly isolated server-side (the client imports keywordScore.ts type-only, never seoAnalyzer.ts), the endpoint has an auth gate and a generic 500, the new keyword path uses tokenization rather than user-controlled regex (no ReDoS), and the debounce effect aborts in-flight requests on cleanup. No Critical/Critical-secret issues found.

However there is one High correctness defect: **for Pages the body extraction does not work**, because the panel feeds the `blocks` field's flattened form-state value (a row-count/metadata, not the nested node tree) into `extractText`. That silently zeroes out density / first-paragraph / subheadings / content-derived H1 for every Page. Plus several Medium issues around inconsistent matching semantics, a permanent "Calculando…" stuck state on metrics-fetch failure, and an H1 check that can show green when no H1 exists.

## High

### H1-01: Pages body extraction is broken — blocks field form value is not the node tree

**File:** `src/components/admin/KeywordScorePanel.tsx:92-94` (also `requestBody` memo `:142-152`)
**Issue:** For Pages the panel reads `fields['content.layout'].value` and passes it to the server analyzer. In Payload form state (`useAllFormFields`) an array/`blocks` field is **flattened**: the entry at `content.layout` holds row-count/rows metadata, while the actual block field data lives at separate paths (`content.layout.0.<field>`, etc.). `extractText`/`extractHeadingNodes`/`extractParagraphs` then receive a value that is not the Lexical node tree, so `typeof node !== 'object'` (or an objectless rows array) short-circuits and returns empty.

Consequences for every Page:
- density → always `red` (occurrences 0)
- firstParagraph → always `red`
- subheadings → always `red`
- H1 falls back to the doc title (see M3-03), so it can falsely pass
- `requestBody` only changes when rows are added/removed, so editing text inside a block never triggers a recompute.

Posts are unaffected (richText is a single leaf field whose value is the full editor state).

**Why it matters:** Half the score (density 15 + firstParagraph 10 + subheadings 10 = 35 pts, plus H1 masking) is wrong for the entire Pages collection — the feature reports misleading SEO scores on Pages.
**Fix:** Reconstruct the nested tree from the flattened form state before sending. Either use `reduceFieldsToValues(fields, true)` from `@payloadcms/ui` and read `data.content.layout`, or use `getDataByPath`/`useForm().getData()` to obtain the real document data:
```ts
import { reduceFieldsToValues } from '@payloadcms/ui'
// ...
const data = useMemo(() => reduceFieldsToValues(fields, true), [fields])
const contentVal = collectionSlug === 'pages' ? data?.content?.layout : data?.content?.content
```
Verify both branches against a real Page/Post in the admin before closing.

## Medium

### M1-02: Inconsistent keyword-matching semantics (set-based vs contiguous)

**File:** `src/plugins/seo/utils/seoAnalyzer.ts:587-610, 689-742`
**Issue:** Title/meta/H1/slug/first-paragraph/subheadings use `keywordTokensIn`, which returns true when **every** stemmed keyword token appears **anywhere** in the haystack (a `Set` membership test, order/adjacency ignored). Density uses `countSequence`, which requires the **contiguous** token sequence. For a multi-word keyword (e.g. "core web vitals") this yields contradictory and false-positive results: a title "Web design core principles for vitals" passes the title check though it never contains the phrase, while a body that contains the exact phrase may still differ from the loosely-matched checks.
**Why it matters:** Scores are not trustworthy for multi-word keywords (the common case), and the green/red signals can mislead editors.
**Fix:** Use one consistent matcher. Either make the presence checks phrase-aware (run `countSequence(stemTokens(tokenize(haystack)), kwTokens) > 0`) so all checks require the contiguous phrase, or document that single-token semantics are intentional. Recommend phrase-based for parity with Yoast.

### M2-03: Panel stuck on "Calculando…" forever when metrics fetch fails or keyword is empty

**File:** `src/components/admin/KeywordScorePanel.tsx:107-134, 154-159`
**Issue:** `hasKeyword = Boolean(keywordId || keywordString)` is true as soon as a relationship id exists. But `keywordString` is derived almost entirely from the fetched metrics doc (`metrics?.keyword`); `keywordFromObject` is only populated when the relationship is a populated object, which it is not in normal form state. If `/api/keyword-metrics/:id` 404s/errors or the doc has an empty `keyword`, `keywordString` stays `''`. The score effect then early-returns (`if (!keywordString)`), `result` stays `null`, and the UI renders the "Calculando…" branch indefinitely with no error or recovery.
**Why it matters:** A transient fetch failure or a misconfigured keyword doc permanently bricks the panel into a fake "loading" state.
**Fix:** Track a metrics-loading/errored flag and render an explicit error/empty state when `keywordId` exists but no usable `keywordString` resolves; do not show "Calculando…" when nothing is in flight.

### M3-04: "Keyword in H1" can show green when the document has no H1

**File:** `src/plugins/seo/utils/seoAnalyzer.ts:680-701`
**Issue:** `h1Source = firstH1 || input.title || titleSource`. When the content has no H1 node, the check silently evaluates against the document title. So a doc with the keyword in its title but **no H1 at all** reports the H1 check as green.
**Why it matters:** It masks a genuine SEO defect (missing H1) and inflates the score by up to 20 points. Combined with H1-01, every Page can show H1 green regardless of content.
**Fix:** Decide explicitly: either (a) drop the fallback and report `red` when no H1 node exists, with feedback "No H1 found"; or (b) keep the fallback but add a distinct check/feedback for "missing H1". Per the amber=partial/red=absent contract, absent H1 should not read as green.

### M4-05: "Retrying…" micro-copy implies auto-retry that does not exist

**File:** `src/components/admin/KeywordScorePanel.tsx:212-216, 175-180`
**Issue:** On error the panel shows "No se pudo recalcular. Reintentando… / Couldn't recalculate. Retrying…", but there is no retry: a recompute only fires when `requestBody`/`keywordString` change. The user can sit on "Retrying…" forever while nothing retries.
**Why it matters:** Misleading state copy; user waits for a retry that never happens.
**Fix:** Either implement an actual retry (e.g. a backoff `setTimeout` that re-triggers the fetch), or change the copy to a static error with a manual "Reintentar/Retry" button.

## Low

### L1-06: `analyzeKeywordChecks` is `async` but never awaits

**File:** `src/plugins/seo/utils/seoAnalyzer.ts:664-666`
**Issue:** The function is declared `async` and returns `Promise<KeywordScoreResult>` but contains no `await`. Unnecessary Promise wrapping; callers must `await` for no reason.
**Fix:** Make it synchronous (return `KeywordScoreResult`) unless async stemming is planned. The endpoint already `await`s, so either form works; prefer sync for clarity.

### L2-07: No size/length bounds on endpoint input

**File:** `src/app/api/seo/keyword-score/route.ts:19-32`
**Issue:** `content` and `keyword` are accepted unbounded. A very large `content` payload is fully traversed (recursive extractors) and a huge `keyword` is tokenized/stemmed. Admin-auth limits exposure, but a compromised/over-eager client could be expensive.
**Fix:** Cap `keyword` length (e.g. ≤200 chars) and reject oversized JSON bodies; return 400 on violation.

### L3-08: Body word denominator includes heading text

**File:** `src/plugins/seo/utils/seoAnalyzer.ts:406-419, 675-710`
**Issue:** `extractText` collects every `text` node, including heading nodes, so `bodyTokens` (the density denominator) and `occurrences` include heading words. Density is slightly skewed and a keyword that appears only in headings can register as a body occurrence.
**Fix:** For density, build the body token stream from `extractParagraphs` (paragraph text only) rather than the full `extractText`.

### L4-09: Possible setState after unmount on the success path

**File:** `src/components/admin/KeywordScorePanel.tsx:171-174`
**Issue:** `setResult`/`setErrored`/`setUpdatedAt` run after `await` without an aborted/mounted guard. If the response resolves immediately around unmount, these can fire post-unmount. Benign in React 18 (no warning), but inconsistent with the abort-guarded `finally`.
**Fix:** Guard the success writes with `if (controller.signal.aborted) return` before `setResult`.

### L5-10: `errored` not cleared when keyword becomes empty

**File:** `src/components/admin/KeywordScorePanel.tsx:154-159`
**Issue:** The early-return branch (`!keywordString`) resets `result`/`recomputing` but leaves `errored` true, so a prior error can bleed into the next empty/loading state.
**Fix:** Add `setErrored(false)` to the early-return branch.

---

_Reviewed: 2026-06-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
