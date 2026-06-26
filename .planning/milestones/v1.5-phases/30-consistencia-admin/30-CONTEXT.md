# Phase 30: Consistencia del admin (CONSIST-01/02/03) - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Consistencia cosmética del admin: `group:'SEO'` uniforme en las colecciones de métricas, labels bilingües `{en,es}` en las superficies inconsistentes, y nav links custom sin emoji/estilos hardcodeados. Cambios acotados, sin tocar funcionalidad.

</domain>

<decisions>
## Implementation Decisions

### CONSIST-01 — group SEO
- Agregar `admin.group: 'SEO'` a `KeywordMetrics` y `PageMetrics` (GSCMetrics y BrokenLinks ya lo tienen).

### CONSIST-02 — labels bilingües {en,es} (acotado)
- Agregar `labels: { singular: {en,es}, plural: {en,es} }` a las 4 colecciones de métricas (keyword-metrics, page-metrics, gsc-metrics, broken-links) — hoy sin label legible.
- Corregir los tab labels english-only en Posts/Pages: "Search Console", "Internal Links", "Meta" → objeto `{ en, es }`.
- NO reetiquetar cada campo individual (fuera de scope; foco en lo visible/inconsistente).

### CONSIST-03 — nav links
- `GSCDashboardLink` y `KeywordCoverageLink`: quitar emoji inline (📈/🎯), reemplazar por un ícono SVG inline simple (o ninguno) y usar variables de tema de Payload en vez de fontSize/padding hardcodeados ad-hoc; alinear el estilo entre ambos.
- `GSCDashboardLink`: hacerlo bilingüe (hoy "GSC Dashboard" hardcoded) siguiendo el patrón i18n ya usado en `KeywordCoverageLink` (`useTranslation` → i18n.language).

### Claude's Discretion
- Texto es/en exacto de labels.
- Si usar SVG inline minimal vs solo texto en los nav links (ambos válidos; priorizar consistencia + sin emoji).

</decisions>

<code_context>
## Existing Code Insights
- `src/collections/{KeywordMetrics,PageMetrics}.ts` — sin `group`; `{GSCMetrics,BrokenLinks}.ts` ya `group:'SEO'`.
- `src/components/admin/KeywordCoverageLink.tsx` — ya bilingüe vía `useTranslation`; patrón a replicar en GSCDashboardLink.
- `src/components/admin/GSCDashboardLink.tsx` — emoji 📈 + label inglés hardcoded + estilos inline.
- Tabs english-only en `src/collections/Posts/index.ts` y `Pages/index.ts` ("Search Console", "Internal Links", "Meta").
- Verificación: tsc 114, tests verdes, `payload generate:importmap` si cambian exports.

</code_context>

<specifics>
## Specific Ideas
- Cambios solo cosméticos; no tocar rutas, funcionalidad ni componentes vivos más allá de label/group/icon.
</specifics>

<deferred>
## Deferred Ideas
- Reetiquetado exhaustivo campo-por-campo (futuro).
</deferred>
