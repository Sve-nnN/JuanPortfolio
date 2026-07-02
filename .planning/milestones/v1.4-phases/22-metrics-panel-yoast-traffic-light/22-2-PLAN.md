---
phase: 22-metrics-panel-yoast-traffic-light
plan: 2
type: execute
wave: 2
depends_on: ["22-1"]
files_modified:
  - src/components/admin/KeywordScorePanel.tsx
  - src/collections/Posts/index.ts
  - src/collections/Pages/index.ts
contributes_to_requirements: [METRICS-01, METRICS-02, SCORE-01, SCORE-02, SCORE-03, SCORE-04]
requirements: [METRICS-01, METRICS-02, SCORE-04]
autonomous: false
must_haves:
  truths:
    - "The editor sidebar of every Post and Page shows the assigned keyword's volume, difficulty, intent and opportunityScore read from keyword-metrics (METRICS-01)"
    - "With no keyword assigned the panel shows a CTA empty state; with a keyword but no metrics it shows 'sin datos' while the 7 checks still run (METRICS-02)"
    - "The 7 traffic-light checks (green/amber/red glyph + label + actionable feedback) and a 0-100 score badge with color render per the UI-SPEC"
    - "The panel recomputes live (debounce ~300ms) from the current editor fields without publishing, calling /api/seo/keyword-score (SCORE-04)"
    - "The ui field is registered in the sidebar of BOTH Posts and Pages"
  artifacts:
    - path: "src/components/admin/KeywordScorePanel.tsx"
      provides: "Client UI field rendering metrics + 7 checks + score badge with all 4 states, debounced server analysis"
      min_lines: 120
      contains: "'use client'"
    - path: "src/collections/Posts/index.ts"
      provides: "ui field in sidebar mounting KeywordScorePanel"
      contains: "KeywordScorePanel"
    - path: "src/collections/Pages/index.ts"
      provides: "ui field in sidebar mounting KeywordScorePanel"
      contains: "KeywordScorePanel"
  key_links:
    - from: "src/components/admin/KeywordScorePanel.tsx"
      to: "/api/seo/keyword-score"
      via: "debounced fetch POST"
      pattern: "api/seo/keyword-score"
    - from: "src/components/admin/KeywordScorePanel.tsx"
      to: "/api/keyword-metrics/:id"
      via: "fetch of the assigned keyword-metrics doc"
      pattern: "api/keyword-metrics"
    - from: "src/collections/Posts/index.ts"
      to: "KeywordScorePanel"
      via: "ui field admin.components.Field"
      pattern: "KeywordScorePanel"
---

<objective>
Build the client sidebar field that consumes the plan 22-1 endpoint: it reads the live editor fields + the assigned keyword, fetches the keyword's metrics, and renders the metrics block + the 7-check Yoast traffic light + the 0-100 score badge with all four states defined in the UI-SPEC, recomputing on a ~300ms debounce. Then register it in the sidebar of Posts and Pages.

Purpose: deliver METRICS-01/02, SCORE-01/02/03 (render) and SCORE-04 (live recompute) in the admin editor.
Output: KeywordScorePanel.tsx + ui-field registration in both collections.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/22-metrics-panel-yoast-traffic-light/22-CONTEXT.md
@.planning/phases/22-metrics-panel-yoast-traffic-light/22-UI-SPEC.md
@.planning/phases/22-metrics-panel-yoast-traffic-light/22-1-SUMMARY.md
@src/components/admin/DinoRankWriteButton.tsx
@src/components/admin/IndexingControl.tsx
@src/collections/Posts/index.ts
@src/collections/Pages/index.ts

<interfaces>
From src/plugins/seo/types/keywordScore.ts (created in plan 22-1 — import TYPES from here, never from seoAnalyzer.ts, to avoid bundling `natural`):

```typescript
export type CheckState = 'green' | 'amber' | 'red'
export type KeywordCheckId =
  | 'title' | 'metaDescription' | 'h1' | 'slug' | 'density' | 'firstParagraph' | 'subheadings'
export interface KeywordCheck { id: KeywordCheckId; state: CheckState; label: { es: string; en: string }; feedback?: { es: string; en: string } }
export interface KeywordScoreResult { checks: KeywordCheck[]; score: number; scoreColor: CheckState; passCount: number }
export function scoreToColor(score: number): CheckState
```

POST /api/seo/keyword-score body: `{ keyword, title, meta:{title,description}, slug, content, locale }` → returns `KeywordScoreResult`.
GET /api/keyword-metrics/:id?depth=0 → returns the doc with `{ keyword, volume, difficulty, intent, opportunityScore, ... }`.
</interfaces>

<facts>
- Admin field hook pattern: `'use client'` + `useDocumentInfo` (id, collectionSlug, initialData) + `useAllFormFields` / `useFormFields` from `@payloadcms/ui`. See DinoRankWriteButton (reads primaryKeyword) and IndexingControl (effects, fetch, toast).
- Field path divergence: Posts content is `content.content` (richText object). Pages content is `content.layout` (blocks array). title is top-level `title`. meta is the plugin-seo `meta` group → `meta.title` / `meta.description`. slug is top-level `slug`. primaryKeyword is top-level `primaryKeyword`. CONFIRM exact keys at runtime by inspecting the flattened field state from useAllFormFields; branch on `collectionSlug` ('posts' vs 'pages') to pick the content key. Send whichever raw content value you read to the endpoint as `content` — the server extractor handles both shapes.
- primaryKeyword from form state may be an id string or a populated object ({id, keyword,...}). Resolve the id, then GET `/api/keyword-metrics/:id` for the keyword string + metrics. If only a string keyword is available, the checks can still run without metrics (METRICS-02).
- locale: derive admin locale; copy must follow it. Default to 'es' if unknown.
- Wrapper markup (LOCKED by UI-SPEC): `<div className="field-type custom-field" style={{ marginBottom:'2rem' }}>` with `<label className="field-label">`. Use Payload CSS vars (--theme-*). Status hex fallbacks: green #16a34a, amber #d97706, red #dc2626. Glyphs ● ◐ ○ at ~14px, fixed ~18px column. NO shadcn, NO Tailwind, NO public-site tokens.
- All 4 states + error state + accessibility (aria-label per glyph, word label on badge) per UI-SPEC §States and §Accessibility. Bilingual copy per the Copywriting Contract table.
- Debounce ~300ms after the user stops typing; in-flight = keep last render, badge opacity 0.6, micro-text "Recalculando…"; never blank/spinner the whole panel.
- payload-types.ts does NOT change (ui field does not persist). tsc baseline = 114 errors; no new errors.
</facts>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: KeywordScorePanel client component (4 states, metrics, 7 checks, score badge, 300ms debounce)</name>
  <files>src/components/admin/KeywordScorePanel.tsx</files>
  <action>
Create `'use client'` component `KeywordScorePanel`. Use `useDocumentInfo()` for `collectionSlug` and `initialData`, and `useAllFormFields()` (or `useFormFields` selectors) to read LIVE values for: title, content (`content.content` for posts, `content.layout` for pages — branch on collectionSlug), meta.title, meta.description, slug, primaryKeyword. Resolve the primaryKeyword id; when present, fetch `/api/keyword-metrics/:id?depth=0` once per id change to get `{ keyword, volume, difficulty, intent, opportunityScore }`.

Render exactly the four mutually-exclusive states from UI-SPEC §States, all keeping the `field-label` "SEO · Keyword objetivo" / "SEO · Target keyword" heading visible:
1. No keyword: CTA empty state (heading + body + native secondary Button "Asignar keyword"; informational if focusing the primaryKeyword field is not feasible — mirror DinoRankWriteButton helper text).
2. Keyword, no metrics: metrics card shows muted "Sin datos de métricas para esta keyword." but the 7 checks STILL run.
3. Loading/recompute micro-state: keep last render, score badge opacity 0.6, micro-text "Recalculando…"; never full-panel spinner. Initial first load may show italic "Calculando…".
4. Scored: score card (28px number + word badge "Bueno/Mejorable/Malo", colored by scoreColor) + metrics card (Volumen/Dificultad/Intent/Oportunidad rows) + 7 check rows in fixed order (glyph ●/◐/○ + label; feedback line only on amber/red) + "Checks ({pass}/7)" caption + "Recalculado hace {n}s" timestamp.

Recompute logic (SCORE-04): on any change to the watched live fields, debounce ~300ms then POST {keyword, title, meta, slug, content, locale} to `/api/seo/keyword-score`; set result into state. Cancel stale in-flight requests (AbortController or an ignore flag) so the latest keystroke wins. On request failure show muted "No se pudo recalcular. Reintentando…" (optional single toast.error on hard failure) and keep the last good render — never break the editor.

Import result/label TYPES from `@/plugins/seo/types/keywordScore` (type-only import). Apply colors via Payload CSS vars with the documented hex fallbacks; build status glyphs as inline spans with `aria-label` spelling the state+check in the active locale; give the score badge `aria-label="Score SEO {n} de 100, {word}"`. All copy bilingual {es,en} keyed by admin locale, neutral Spanish (no voceo). Use the spacing/typography/color tokens from the UI-SPEC tables. Do not introduce shadcn/Tailwind/public-site tokens.
  </action>
  <verify>
    <automated>pnpm exec tsc --noEmit 2>&1 | grep -c "KeywordScorePanel" | grep -qx 0 && echo "no new tsc errors in KeywordScorePanel"</automated>
  </verify>
  <done>Component compiles with no new tsc errors; renders all 4 states; debounced fetch to /api/seo/keyword-score; metrics fetched from /api/keyword-metrics/:id; type-only import from keywordScore types (no `natural` in bundle).</done>
</task>

<task type="auto">
  <name>Task 2: Register the ui field in Posts and Pages sidebars</name>
  <files>src/collections/Posts/index.ts, src/collections/Pages/index.ts</files>
  <action>
In `src/collections/Posts/index.ts` add a top-level field (alongside the other sidebar ui fields like `indexingControl`/`dinoRankAction`): `{ name: 'keywordScorePanel', type: 'ui', admin: { position: 'sidebar', components: { Field: '@/components/admin/KeywordScorePanel#KeywordScorePanel' } } }`. Place it above `dinoRankAction` so the SEO panel sits high in the sidebar. Do the same in `src/collections/Pages/index.ts` (add the identical top-level ui field; Pages currently has `indexingControl` and `indexStatus` sidebar fields — add it near them). Use the same component path in both. After editing, run `pnpm exec payload generate:importmap` so the new admin component is registered in the import map.
  </action>
  <verify>
    <automated>pnpm exec payload generate:importmap >/dev/null 2>&1; grep -rl "KeywordScorePanel" src/collections/Posts/index.ts src/collections/Pages/index.ts | wc -l | grep -qx 2 && echo "registered in both collections"</automated>
  </verify>
  <done>Both Posts and Pages have the keywordScorePanel ui field in the sidebar pointing to the component; importmap regenerated; no new tsc errors.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>The SEO keyword panel is mounted in the sidebar of Posts and Pages: keyword metrics block, 7-check traffic light with actionable feedback, and a live 0-100 score badge that recomputes ~300ms after you stop typing, without publishing.</what-built>
  <how-to-verify>
    1. Run the dev server (`pnpm dev`) and open the admin.
    2. Open a Post that has a primaryKeyword assigned with metrics → confirm Volumen/Dificultad/Intent/Oportunidad show real values, the 7 checks render with ●/◐/○ glyphs + feedback on amber/red, and a colored score badge with a word (Bueno/Mejorable/Malo) appears (METRICS-01, SCORE-01/02/03).
    3. Edit the title/content (do NOT save) → the score/checks update ~300ms after you stop typing; during recompute the badge dims and micro-text says "Recalculando…" (SCORE-04).
    4. Open a Post/Page with a keyword but no metrics → metrics card shows "Sin datos…" yet checks still run (METRICS-02). Open one with no keyword → CTA empty state.
    5. Open a Page (blocks-based content) → confirm the body checks (density/first paragraph/subheadings) reflect the block content, not empty.
    6. Switch admin locale es↔en → labels, feedback, and word badge follow the locale (neutral Spanish, no voceo).
  </how-to-verify>
  <resume-signal>Type "approved" or describe any visual/behavioral issues to fix.</resume-signal>
</task>

</tasks>

<verification>
- `pnpm exec tsc --noEmit` error count <= 114 (baseline; no new errors).
- `pnpm exec payload generate:importmap` succeeds and includes KeywordScorePanel.
- Human-verify checkpoint passes for all 4 states on both Posts and Pages.
</verification>

<success_criteria>
- METRICS-01: metrics visible in sidebar from keyword-metrics.
- METRICS-02: clear "sin datos" / no-keyword states without breaking the editor.
- SCORE-01/02/03: 7 checks + actionable feedback + colored 0-100 score badge rendered.
- SCORE-04: live recompute (debounce ~300ms) without publishing.
- ui field registered in both Posts and Pages sidebars.
</success_criteria>

<output>
Create `.planning/phases/22-metrics-panel-yoast-traffic-light/22-2-SUMMARY.md` when done.
</output>
