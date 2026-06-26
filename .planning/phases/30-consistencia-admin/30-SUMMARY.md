---
phase: 30
subsystem: admin
tags: [admin-ui, i18n, consistency, payload]
status: complete
completed: 2026-06-26
---

# Phase 30: Consistencia del admin (CONSIST-01/02/03) Summary

Consistencia cosmética del admin de Payload: grupo `SEO` uniforme en las 4 colecciones de métricas, labels bilingües `{en,es}`, tab labels bilingües en Posts/Pages y nav links custom sin emoji con SVG inline consistente y GSCDashboardLink bilingüe. Cero cambios de funcionalidad.

## Changes per CONSIST item

### CONSIST-01 — group SEO
- `src/collections/KeywordMetrics.ts`: agregado `admin.group: 'SEO'`.
- `src/collections/PageMetrics.ts`: agregado `admin.group: 'SEO'`.
- GSCMetrics y BrokenLinks ya tenían `group: 'SEO'` (sin tocar).
- Resultado: las 4 colecciones de métricas comparten el grupo `SEO`.

### CONSIST-02 — labels bilingües {en,es}
- `labels: { singular, plural }` `{en,es}` agregados a:
  - KeywordMetrics: "Keyword Metric"/"Métrica de Keyword" (+plural).
  - PageMetrics: "Page Metric"/"Métrica de Página" (+plural).
  - GSCMetrics: "GSC Metric"/"Métrica GSC" (+plural).
  - BrokenLinks: "Broken Link"/"Enlace Roto" (+plural).
- Tab labels english-only convertidos a `{en,es}`:
  - `src/collections/Pages/index.ts`: tab "Search Console" → `{ en: 'Search Console', es: 'Search Console' }`.
  - `src/collections/Posts/index.ts`: tabs "Meta" → `{en:'Meta',es:'Meta'}`, "Search Console" → `{en,es}`, "Internal Links" → `{ en: 'Internal Links', es: 'Enlaces Internos' }`.
- No se reetiquetaron campos individuales (fuera de scope).

### CONSIST-03 — nav links
- `src/components/admin/GSCDashboardLink.tsx`:
  - Emoji 📈 reemplazado por SVG inline bar-chart (16x16, `currentColor`).
  - Hecho bilingüe vía `useTranslation` → `i18n.language?.startsWith('es')` ("Panel GSC"/"GSC Dashboard").
- `src/components/admin/KeywordCoverageLink.tsx`:
  - Emoji 🎯 reemplazado por SVG inline target (16x16, `currentColor`).
- Ambos componentes alineados a la misma estructura: wrapper div idéntico, mismos estilos de Link (`var(--theme-text)`, gap 10px), SVG 16x16 con `stroke="currentColor"`.

## Commits

| Item | Type | Hash | Description |
| ---- | ---- | ---- | ----------- |
| CONSIST-01/02 (collections) | feat | 8167117 | uniform SEO group + bilingual labels on metrics collections |
| CONSIST-02 (tabs) | feat | d7b413c | bilingual tab labels in Posts and Pages |
| CONSIST-03 | style | 91f692e | consistent admin nav links without emoji |

## Verification

- `pnpm exec tsc --noEmit`: **114 errors** (unchanged baseline — all pre-existing, unrelated test-file errors). PASS.
- `pnpm exec vitest run`: **776 passed / 90 test files**, green. PASS.
- `pnpm payload generate:importmap`: "No new imports found, skipping writing import map" — importMap.js sin cambios. PASS.
- Las 4 colecciones de métricas confirmadas con `group: 'SEO'` + `labels {en,es}`.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- Commits 8167117, d7b413c, 91f692e existen en el historial.
- 8 archivos modificados confirmados (4 collections, Posts, Pages, 2 nav links).
