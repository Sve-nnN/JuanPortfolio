---
phase: 22-metrics-panel-yoast-traffic-light
plan: 2
subsystem: seo
tags: [seo, payload-admin, ui-field, traffic-light, react, client-component]
requires:
  - "22-1: POST /api/seo/keyword-score endpoint + shared types in src/plugins/seo/types/keywordScore.ts"
  - "GET /api/keyword-metrics/:id (Payload REST, keyword-metrics collection from Phase 21)"
provides:
  - "KeywordScorePanel client sidebar field (metrics + 7-check traffic light + 0-100 score badge, 4 states, ~300ms debounced live recompute)"
  - "keywordScorePanel ui field registered in Posts and Pages sidebars"
affects:
  - "Phase 23 (coverage audit) and Phase 24 (keyword population) build on this admin surface"
tech-stack:
  added: []
  patterns:
    - "type:'ui' sidebar field with admin.components.Field path"
    - "client field reads live editor state via useAllFormFields; analysis runs server-side so natural never bundles in admin"
    - "type-only import from dependency-light keywordScore types module"
key-files:
  created:
    - src/components/admin/KeywordScorePanel.tsx
  modified:
    - src/collections/Posts/index.ts
    - src/collections/Pages/index.ts
    - src/app/(payload)/admin/importMap.js
decisions:
  - "Read meta at form paths meta.title / meta.description (plugin-seo group), confirmed against seoFields.ts."
  - "Content path branches on collectionSlug: content.content (Posts richText) vs content.layout (Pages blocks); raw value sent to the server extractor which handles both shapes."
  - "primaryKeyword resolved from form value first, initialData fallback; handles string id and populated object. keyword string sourced from the fetched metrics doc or a populated relationship object."
  - "AbortController cancels stale in-flight requests so the latest keystroke wins; recomputing flag only cleared when the request was not aborted to avoid badge-opacity flicker."
  - "No-keyword CTA focuses #field-primaryKeyword if present, otherwise shows an informational toast (no broken action), mirroring DinoRankWriteButton's graceful-degradation pattern."
metrics:
  duration: ~12m
  completed: 2026-06-25
  tasks: 2
  files: 4
---

# Phase 22 Plan 2: KeywordScorePanel sidebar field Summary

Client `type:'ui'` sidebar field for Posts and Pages that renders the assigned keyword's metrics (volume/difficulty/intent/opportunity), the 7-check Yoast-style traffic light with actionable bilingual feedback, and a colored 0-100 score badge. It reads the live editor fields, fetches the keyword-metrics doc, and recomputes against the Wave 1 `/api/seo/keyword-score` endpoint on a ~300ms debounce without publishing. The NLP stemmer stays server-side; the component imports only dependency-light types.

## What was built

### Task 1 — KeywordScorePanel.tsx (commit 420c2de)
- `'use client'` component using `useDocumentInfo` (collectionSlug, initialData), `useAllFormFields` (live values) and `useLocale` (es/en copy).
- Reads `title`, `meta.title`, `meta.description`, `slug`, content (`content.content` for posts / `content.layout` for pages, branched on `collectionSlug`), and `primaryKeyword` (string id or populated object, with initialData fallback).
- Fetches `/api/keyword-metrics/:id?depth=0` on keyword-id change for `{keyword, volume, difficulty, intent, opportunityScore}`.
- Debounced (300ms) `POST /api/seo/keyword-score` with `{keyword, title, meta, slug, content, locale}`; `AbortController` cancels stale requests.
- The 4 mutually-exclusive states from the UI-SPEC:
  1. **No keyword** → CTA empty state (heading + body + secondary Button "Asignar keyword" that focuses `#field-primaryKeyword`, toast fallback).
  2. **Keyword, no metrics** → metrics card shows muted "Sin datos de métricas para esta keyword." while the 7 checks still run.
  3. **Loading/recompute** → score badge dims to opacity 0.6 + micro-text "Recalculando…"; first load shows italic "Calculando…"; never a full-panel spinner.
  4. **Scored** → score card (28px number + word badge Bueno/Mejorable/Malo colored by `scoreColor`) + metrics card + 7 check rows (glyph ●/◐/○ + label, feedback line on amber/red only) + "Checks ({pass}/7)" + "Recalculado hace {n}s".
- Accessibility: glyph shape + text label + color (3 redundant channels); each glyph has `aria-label`/`title` spelling state+check; badge has `aria-label="Score SEO {n} de 100, {word}"`.
- Payload `--theme-*` CSS vars with documented hex fallbacks (green #16a34a, amber #d97706, red #dc2626); `field-type custom-field` wrapper + `field-label`; no shadcn/Tailwind/public-site tokens.
- Error state keeps last good render and shows muted "No se pudo recalcular. Reintentando…".

### Task 2 — Sidebar registration (commit 617ff5b)
- Added `keywordScorePanel` (`type:'ui'`, `position:'sidebar'`, Field `@/components/admin/KeywordScorePanel#KeywordScorePanel`) to `src/collections/Posts/index.ts` (above `dinoRankAction`) and `src/collections/Pages/index.ts` (above `indexingControl`).
- Ran `pnpm exec payload generate:importmap`; the admin `importMap.js` now references KeywordScorePanel (2 occurrences).

## Verification

- `pnpm exec tsc --noEmit`: **114 errors = baseline, 0 new**. No errors in `KeywordScorePanel.tsx`, `Posts/index.ts`, or `Pages/index.ts`. `payload-types.ts` unchanged (ui field does not persist).
- `pnpm exec vitest run`: **764 passed / 89 files** — no regressions.
- `pnpm exec payload generate:importmap`: succeeds, KeywordScorePanel registered.
- Full `pnpm build` was NOT run: per project memory the Vercel/Next build is ~14 min and flaky in a headless session. tsc + a successful importmap generation (which imports and resolves the admin component path) cover admin import correctness; flagged here so Juan can confirm in a real build/deploy.

## Deviations from Plan

None affecting structure. Minor implementation choices documented under `decisions` (meta paths confirmed via seoFields.ts, abort-flicker guard, CTA toast fallback) — all within the plan's stated discretion. No Rule 1-4 deviations triggered.

## Known Stubs

None. All four states and the live recompute are fully wired to real endpoints. Metrics that come back null/empty render as "—" (intentional, not a stub) and trigger the "sin datos" state per METRICS-02.

## Threat Flags

None. The component adds no new trust-boundary surface: it consumes the already-authenticated Wave 1 endpoint and the standard Payload REST `keyword-metrics` route, sends no user-controlled regex, and ships no NLP dependency to the client.

## Human visual-verification checklist (CHECKPOINT — pending Juan)

This checkpoint is `human-verify` and cannot be validated headlessly. Run `pnpm dev`, open the admin, and confirm:

1. **Scored state (Post with keyword + metrics):** Volumen/Dificultad/Intent/Oportunidad show real values; 7 checks render with ●/◐/○; amber/red rows show a feedback line; colored score badge shows number + Bueno/Mejorable/Malo (METRICS-01, SCORE-01/02/03).
2. **Live recompute:** edit title/content WITHOUT saving → score/checks update ~300ms after you stop typing; during recompute the badge dims and micro-text reads "Recalculando…" (SCORE-04).
3. **Keyword, no metrics:** metrics card shows "Sin datos…" yet checks still run (METRICS-02).
4. **No keyword:** CTA empty state with "Asignar keyword" button.
5. **Pages (blocks content):** body checks (density / first paragraph / subheadings) reflect block content, not empty.
6. **Locale es↔en:** labels, feedback and word badge follow the admin locale; Spanish is neutral (no voceo).
7. **Narrow sidebar layout:** single vertical stack, no horizontal scroll, long keywords wrap.
8. **Accessibility:** glyph shapes distinguishable in grayscale; badge readable without color.

Reply "approved" or list any visual/behavioral fixes.

## Commits

- 420c2de `feat(22-2): KeywordScorePanel sidebar field (4 states, metrics, 7 checks, score badge, 300ms debounce)`
- 617ff5b `feat(22-2): register KeywordScorePanel ui field in Posts and Pages sidebars`

## Self-Check: PASSED
