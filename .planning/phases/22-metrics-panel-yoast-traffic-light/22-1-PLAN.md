---
phase: 22-metrics-panel-yoast-traffic-light
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/plugins/seo/types/keywordScore.ts
  - src/plugins/seo/utils/seoAnalyzer.ts
  - src/plugins/seo/utils/seoAnalyzer.test.ts
  - src/app/api/seo/keyword-score/route.ts
autonomous: true
requirements: [SCORE-01, SCORE-02, SCORE-03]
must_haves:
  truths:
    - "A pure function analyzeKeywordChecks(input) returns 7 structured checks (green/amber/red + actionable feedback) plus a weighted 0-100 score and a color"
    - "Keyword matching uses real es/en stemming (natural PorterStemmer / PorterStemmerEs), so 'optimización' matches 'optimizar' and 'running' matches 'run'"
    - "The text/heading extractor handles BOTH Posts single richText (lexical) AND Pages blocks array (layout) shapes"
    - "A server endpoint POST /api/seo/keyword-score authenticates the admin user and returns the analysis JSON for {keyword, title, meta, slug, content, locale}"
  artifacts:
    - path: "src/plugins/seo/types/keywordScore.ts"
      provides: "Shared, dependency-light types (CheckState, KeywordCheck, KeywordScoreResult) + scoreToColor() — importable by both server analyzer and client component without bundling 'natural'"
      contains: "export type KeywordScoreResult"
    - path: "src/plugins/seo/utils/seoAnalyzer.ts"
      provides: "analyzeKeywordChecks() + exported extractText/extractHeadings extended for blocks"
      contains: "export function analyzeKeywordChecks"
    - path: "src/app/api/seo/keyword-score/route.ts"
      provides: "Authenticated POST endpoint that runs analyzeKeywordChecks server-side"
      exports: ["POST"]
    - path: "src/plugins/seo/utils/seoAnalyzer.test.ts"
      provides: "Unit tests for the 7 checks, weighted score, color thresholds, es/en stemming, and Pages blocks extraction"
  key_links:
    - from: "src/app/api/seo/keyword-score/route.ts"
      to: "analyzeKeywordChecks in src/plugins/seo/utils/seoAnalyzer.ts"
      via: "direct import + call inside POST"
      pattern: "analyzeKeywordChecks"
    - from: "src/plugins/seo/utils/seoAnalyzer.ts"
      to: "KeywordScoreResult in src/plugins/seo/types/keywordScore.ts"
      via: "type import"
      pattern: "keywordScore"
---

<objective>
Build the scoring engine for the Yoast-style traffic light: a pure analyzer function that takes the live editor fields + the target keyword and returns 7 structured checks (state + actionable feedback), a weighted 0-100 score, and a badge color. Expose it through an authenticated server endpoint so the heavy NLP stemmer (`natural`) never ships in the admin bundle.

Purpose: SCORE-01/02/03 logic must live in `seoAnalyzer.ts` (extend, do not fork) and run server-side, debounce-called by the client component built in plan 22-2.
Output: shared types file, extended `seoAnalyzer.ts`, the `/api/seo/keyword-score` endpoint, and a unit test suite.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/22-metrics-panel-yoast-traffic-light/22-CONTEXT.md
@.planning/phases/22-metrics-panel-yoast-traffic-light/22-UI-SPEC.md
@src/plugins/seo/utils/seoAnalyzer.ts
@src/app/api/seo/indexing/route.ts

<facts>
- `natural` ^8.1.0 is ALREADY a dependency and `@types/natural` ^6.0.1 is in devDependencies. DO NOT add any package. Use `import natural from 'natural'` then `natural.PorterStemmer` (en) and `natural.PorterStemmerEs` (es).
- Existing `extractText` / `extractHeadings` in seoAnalyzer.ts are private and only traverse `children` / `root` / `text`. They work for Posts richText but NOT for Pages `layout` blocks, where richText lives inside arbitrary block-field properties. They must be made robust (traverse all object values + array items) and EXPORTED.
- Posts: `content.content` is a single richText (lexical) object. Pages: `content.layout` is a `blocks` array; text lives inside blocks (Content/Section). The endpoint receives whichever shape the client sends as `content`; the extractor must handle both.
- Auth pattern for the endpoint: copy `src/app/api/seo/indexing/route.ts` — `getPayload({config})`, `payload.auth({headers})`, 401 if no user.
- keyword-metrics relevant fields (already exist): keyword, volume, difficulty, intent, opportunityScore. (Metrics are fetched client-side in plan 22-2; this endpoint only needs the keyword STRING.)
- Color thresholds are LOCKED by UI-SPEC: green >=80, amber 50-79, red <50. These never change regardless of weights.
- Pre-existing `pnpm exec tsc --noEmit` baseline = 114 errors (tests/scripts, out of scope). Do NOT introduce NEW errors. payload-types.ts does NOT change.
</facts>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Shared types + extend seoAnalyzer with analyzeKeywordChecks (es/en stemming, weighted score, blocks-aware extractor)</name>
  <files>src/plugins/seo/types/keywordScore.ts, src/plugins/seo/utils/seoAnalyzer.ts, src/plugins/seo/utils/seoAnalyzer.test.ts</files>
  <behavior>
    - Keyword in title: green if all stemmed keyword tokens appear in meta.title (fallback doc title); red otherwise. (pass/fail, no amber)
    - Keyword in meta description: green if present in meta.description; red otherwise.
    - Keyword in H1: green if present in first H1 of content (fallback: doc title); red otherwise.
    - Keyword in slug: green if stemmed keyword tokens appear in slug (slug hyphen-tokenized); red otherwise.
    - Density: red if keyword absent from body; amber if density >0 but outside 0.5%-2.5%; green if inside 0.5%-2.5%. Feedback names the measured % and the target range.
    - First paragraph: red if absent from first text block/paragraph; amber if present but appears in the second half of the first paragraph (late); green if present early.
    - Subheadings (h2-h4): red if absent from all subheadings; amber if present in fewer than ~half / only one when several exist; green otherwise.
    - Weighted score: title 20, meta 15, H1 20, slug 10, density 15, first paragraph 10, subheadings 10 (sum 100). amber earns 50% of the check weight, green 100%, red 0%. Round to integer.
    - scoreToColor: >=80 'green', 50-79 'amber', <50 'red'.
    - es/en stemming: with locale 'es', "optimización seo" matches body text containing "optimizar seo"; with locale 'en', "running shoes" matches "run shoe".
    - Pages blocks: extractText/extractHeadings pull text + headings out of a `layout` blocks array, not just a single richText object.
    - Each check carries bilingual {es,en} label and (on amber/red) bilingual actionable feedback per the UI-SPEC Copywriting Contract table.
  </behavior>
  <action>
Create `src/plugins/seo/types/keywordScore.ts` with NO heavy runtime imports (so the client can import it without pulling in `natural`): export `type CheckState = 'green' | 'amber' | 'red'`; `type KeywordCheckId` union of the 7 ids ('title' | 'metaDescription' | 'h1' | 'slug' | 'density' | 'firstParagraph' | 'subheadings'); `interface KeywordCheck { id, state, label: {es,en}, feedback?: {es,en} }`; `interface KeywordScoreResult { checks: KeywordCheck[], score: number, scoreColor: CheckState, passCount: number }`; and a pure `export function scoreToColor(score:number): CheckState` implementing the LOCKED thresholds (>=80 green, 50-79 amber, <50 red). Also export the fixed-order array of the 7 check ids and the bilingual labels from the UI-SPEC table so both files agree on order/labels.

In `src/plugins/seo/utils/seoAnalyzer.ts`: (1) Make `extractText` and `extractHeadings` robust to arbitrary nesting — in addition to following `children`/`root`/`text`/`tag`, recurse into every array element and every object value so Pages `layout` blocks are traversed. Add `export` to both. Keep existing `analyzeSEO` behavior intact (it calls them internally). (2) Add `import natural from 'natural'` and a helper `stem(token, locale)` selecting `PorterStemmerEs` for 'es' else `PorterStemmer`; a tokenizer that lowercases, strips punctuation, splits on whitespace; and a matcher `keywordTokensIn(haystack, keyword, locale)` returning whether all stemmed keyword tokens are present in the stemmed haystack tokens. (3) Add `export async function analyzeKeywordChecks(input: { keyword: string; title?: string; meta?: {title?:string; description?:string}; slug?: string; content?: unknown; locale?: 'es' | 'en' }): Promise<KeywordScoreResult>` implementing the 7 checks per `<behavior>`, the weighted score, and `scoreToColor`. Reuse `extractText`/`extractHeadings`/`countWords`. Sources per CONTEXT: title = meta.title || title; metaDescription = meta.description; H1 = first h1 text from content (fallback title); slug; density + first paragraph + subheadings from extracted body. Use the existing `escapeRegex` for any literal regex. Import the result/label types from the new types file. Do NOT build a parallel analyzer and do NOT remove `analyzeSEO`.

Write `src/plugins/seo/utils/seoAnalyzer.test.ts` (vitest) covering every bullet in `<behavior>`: a green-on-all-checks fixture, per-check red and amber fixtures, es and en stemming fixtures, a Pages `layout` blocks fixture proving text/heading extraction, and score+color boundary cases (49->red, 50->amber, 79->amber, 80->green).
  </action>
  <verify>
    <automated>pnpm exec vitest run src/plugins/seo/utils/seoAnalyzer.test.ts</automated>
  </verify>
  <done>All new tests pass; analyzeKeywordChecks, scoreToColor, and exported extractText/extractHeadings exist; analyzeSEO still works; no new tsc errors introduced.</done>
</task>

<task type="auto">
  <name>Task 2: Authenticated /api/seo/keyword-score endpoint</name>
  <files>src/app/api/seo/keyword-score/route.ts</files>
  <action>
Create the route handler mirroring the auth pattern of `src/app/api/seo/indexing/route.ts`: `getPayload({ config: configPromise })`, `payload.auth({ headers: await headers() })`, return `NextResponse.json({ error:'Unauthorized' }, { status:401 })` if no `user`. Parse JSON body `{ keyword, title, meta, slug, content, locale }`. If `keyword` is missing/empty, return `{ error:'Missing keyword' }` status 400. Call `await analyzeKeywordChecks({ keyword, title, meta, slug, content, locale })` and return the result as JSON (status 200). Wrap in try/catch returning status 500 with a generic message on failure (do not leak internals). Keep the handler small — all logic stays in seoAnalyzer.ts.
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit 2>&1 | grep -c "keyword-score" | grep -qx 0 && echo "no new errors in keyword-score route"</automated>
  </verify>
  <done>POST /api/seo/keyword-score compiles, requires auth, validates keyword, and returns analyzeKeywordChecks output. No new tsc errors attributable to this file.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| admin client → /api/seo/keyword-score | Authenticated editor sends live editor content for analysis |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-22-01 | Spoofing | /api/seo/keyword-score | mitigate | Require `payload.auth` user; 401 otherwise (same as indexing route) |
| T-22-02 | Denial of Service | regex / stemming over body text | mitigate | Use existing `escapeRegex` on any literal regex; token-based matching (no user-controlled regex); content size is bounded by the editor |
| T-22-03 | Information disclosure | error responses | mitigate | catch-all returns generic 500 message; no stack/internal leak |
| T-22-04 | Tampering | npm/pip/cargo installs | mitigate | None — `natural` already installed; this plan adds NO package |
</threat_model>

<verification>
- `pnpm exec vitest run src/plugins/seo/utils/seoAnalyzer.test.ts` green.
- `pnpm exec tsc --noEmit` error count <= 114 (baseline; no new errors).
- Endpoint returns 401 without auth, 400 without keyword, 200 with valid payload.
</verification>

<success_criteria>
- analyzeKeywordChecks returns 7 ordered checks with bilingual labels/feedback, weighted 0-100 score, and color (SCORE-01/02/03).
- es/en stemming verified by tests; Pages blocks extraction verified by tests.
- Endpoint authenticated and functional; no `natural` import reaches any client file.
</success_criteria>

<output>
Create `.planning/phases/22-metrics-panel-yoast-traffic-light/22-1-SUMMARY.md` when done.
</output>
