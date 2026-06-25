---
phase: 22-metrics-panel-yoast-traffic-light
plan: 1
subsystem: seo
tags: [seo, scoring, nlp, stemming, payload-admin, api]
requires:
  - natural (already installed) PorterStemmer / PorterStemmerEs
  - existing seoAnalyzer extractText/extractHeadings traversal
provides:
  - analyzeKeywordChecks() pure server analyzer (7 checks + weighted 0-100 score + color)
  - shared dependency-light types (CheckState, KeywordCheck, KeywordScoreResult, scoreToColor)
  - exported extractText / extractHeadings / extractHeadingNodes / extractParagraphs (Pages-blocks aware)
  - authenticated POST /api/seo/keyword-score endpoint
affects:
  - plan 22-2 (client sidebar component consumes the endpoint + imports the types)
tech-stack:
  added: []
  patterns:
    - server-side NLP via natural; types kept separate so client never bundles natural
    - token-based stemmed matching (no user-controlled regex)
key-files:
  created:
    - src/plugins/seo/types/keywordScore.ts
    - src/app/api/seo/keyword-score/route.ts
    - src/plugins/seo/utils/seoAnalyzer.test.ts
  modified:
    - src/plugins/seo/utils/seoAnalyzer.ts
    - vitest.config.mts
decisions:
  - "Named imports from 'natural' ({ PorterStemmer, PorterStemmerEs }) instead of the default import the plan's facts suggested — natural's own .d.ts exposes named ESM exports with no default, so a default import would not typecheck under strict mode."
  - "Added src/**/*.test.{ts,tsx} to vitest include so the plan-specified colocated test path actually runs (config previously only scanned tests/)."
  - "Density target range locked at 0.5%-2.5%; color thresholds locked at green>=80 / amber 50-79 / red<50 per UI-SPEC."
metrics:
  duration: ~20m
  completed: 2026-06-25
  tasks: 2
  files: 5
---

# Phase 22 Plan 1: Keyword Scoring Engine Summary

Server-side Yoast-style keyword analyzer: `analyzeKeywordChecks` returns 7 weighted checks (title, meta description, H1, slug, density, first paragraph, subheadings) with bilingual actionable feedback, a weighted 0-100 score and a locked-threshold badge color, using real es/en stemming via `natural`. Exposed through an authenticated `POST /api/seo/keyword-score` so the NLP stemmer never reaches the admin bundle. Shared types live in a dependency-light file the client can import without pulling in `natural`.

## What was built

### Task 1 — Types + analyzer (TDD: RED 982d447, GREEN bf35c86)
- `src/plugins/seo/types/keywordScore.ts`: `CheckState`, `KeywordCheckId`, `KeywordCheck`, `KeywordScoreResult`, `Bilingual`, fixed `CHECK_ORDER`, `CHECK_LABELS`, `CHECK_WEIGHTS` (title 20 / meta 15 / H1 20 / slug 10 / density 15 / firstParagraph 10 / subheadings 10 = 100), `DENSITY_MIN/MAX`, and pure `scoreToColor()` (>=80 green, 50-79 amber, <50 red). No heavy runtime imports.
- `src/plugins/seo/utils/seoAnalyzer.ts`:
  - `extractText` / `extractHeadings` made robust (recurse into every array element + object value, cycle-safe via WeakSet) and **exported**; they now traverse Pages `layout` blocks, not just a single Posts richText. Structural strings (`blockType`/`type`/`tag`) are never collected — only `text` nodes.
  - New exported helpers `extractHeadingNodes` (level+text) and `extractParagraphs` (ordered paragraph strings).
  - `analyzeKeywordChecks()` implementing the 7 checks per the behavior spec, weighted score, color, and `passCount`. Matching uses `tokenize` + `PorterStemmer`/`PorterStemmerEs`; density via contiguous-sequence counting; amber = 50% of the check weight.
  - `analyzeSEO` and `escapeRegex` left intact.

### Task 2 — Endpoint (dc63853)
- `src/app/api/seo/keyword-score/route.ts`: mirrors the `/api/seo/indexing` auth pattern — `getPayload({config})`, `payload.auth({headers})`, 401 if no user, 400 if keyword missing/empty, 200 with the analysis JSON, generic 500 on failure (no internal leak). Handler stays thin; all logic in `seoAnalyzer.ts`.

## Verification

- `pnpm exec vitest run src/plugins/seo/utils/seoAnalyzer.test.ts`: **23 passed** (7 checks green-on-all, per-check red/amber, es + en stemming, Pages blocks extraction, scoreToColor boundaries 49->red / 50->amber / 79->amber / 80->green, weighted score all-red=0 and amber-half-weight, analyzeSEO extractor regression).
- Full suite `pnpm exec vitest run`: **764 passed / 89 files** — adding `src/**` to the include broke nothing.
- `pnpm exec tsc --noEmit`: **114 errors = baseline, 0 new**. Zero errors in any touched file (`seoAnalyzer.ts`, `keywordScore.ts`, `keyword-score/route.ts`, `seoAnalyzer.test.ts`). `payload-types.ts` unchanged.
- Endpoint contract: 401 without auth, 400 without keyword, 200 with valid payload (verified by code path + tsc; runtime auth requires a live admin session).

## Deviations from Plan

**1. [Rule 3 - Blocking] `natural` imported via named exports, not default**
- **Found during:** Task 1 (tsc design check).
- **Issue:** The plan's `<facts>` suggested `import natural from 'natural'` then `natural.PorterStemmer`. `natural`'s bundled `.d.ts` declares named ESM exports (`export let PorterStemmer: Stemmer`) with **no default export**, so a default import fails to typecheck under `strict`.
- **Fix:** `import { PorterStemmer, PorterStemmerEs, type Stemmer } from 'natural'`. Same runtime stemmers, fully typed.
- **Files modified:** src/plugins/seo/utils/seoAnalyzer.ts
- **Commit:** bf35c86

**2. [Rule 3 - Blocking] vitest include extended to `src/**`**
- **Found during:** Task 1 RED run.
- **Issue:** The plan mandates the test at `src/plugins/seo/utils/seoAnalyzer.test.ts` and a verify command targeting that path, but `vitest.config.mts` only scanned `tests/unit/**` and `tests/int/**`, so the colocated test silently "found no test files".
- **Fix:** Added `'src/**/*.test.{ts,tsx}'` to the include array. Only this one src test exists; full suite still 764 green.
- **Files modified:** vitest.config.mts
- **Commit:** 982d447

## Known Stubs

None. All exported functions are fully implemented and exercised by tests.

## Threat Flags

None. The endpoint applies the planned `payload.auth` gate (T-22-01), uses token-based stemmed matching with no user-controlled regex (T-22-02), returns a generic 500 (T-22-03), and adds no package (T-22-04). No new trust-boundary surface beyond the one declared in the plan's threat model.

## TDD Gate Compliance

Task 1 followed RED -> GREEN. Git log shows `test(22): ... 982d447` (failing) followed by `feat(22): ... bf35c86` (passing). No refactor commit needed.

## Commits

- 982d447 `test(22): add failing keyword-scoring analyzer tests`
- bf35c86 `feat(22): keyword scoring engine with es/en stemming`
- dc63853 `feat(22): authenticated POST /api/seo/keyword-score endpoint`

## Self-Check: PASSED
