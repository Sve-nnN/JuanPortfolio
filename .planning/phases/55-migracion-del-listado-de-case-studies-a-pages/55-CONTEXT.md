# Phase 55: Migración del listado de case studies a Pages - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — réplica directa del patrón validado en Phase 54

<domain>
## Phase Boundary

La ruta `/[locale]/case-studies` deja de leer el GLOBAL `case-studies-listing` y pasa a leer una entrada editable de `Pages` (slug `case-studies`), preservando paridad visual, ISR/edge-cache, hreflang/canonical/lang y live preview. Cubre PAGES-05. Réplica exacta del patrón de Phase 54 (blog). El global NO se elimina aquí (Phase 58).
</domain>

<decisions>
## Implementation Decisions

Reusar TODO el patrón de Phase 54 (ver 54-CONTEXT.md / 54-RESEARCH.md). Diferencias específicas:

1. **Mecanismo:** reusar `getCachedPageBySlug` (ya creado en 54) con slug `case-studies` (tag `pages_case-studies`). NO crear util nueva.
2. **Bloque faltante:** agregar `LatestCaseStudies` al `content.layout` de `Pages` (ListingHero/CaseStudiesGrid ya están; falta solo LatestCaseStudies). `generate:types` → diff acotado a ese bloque.
3. **Revalidación:** `revalidatePage` ya hace `revalidateTag('pages_'+slug)` genérico (agregado en 54) → cubre `case-studies` sin cambios.
4. **Ruta:** reescribir `src/app/(frontend)/[locale]/case-studies/page.tsx` — swap `getCachedGlobal('case-studies-listing')` → `getCachedPageBySlug('case-studies', 2, locale)`, render `page.content.layout`, `generateMeta` con el doc, rama `draftMode()` + `LivePreviewListener`, fallback null-safe (no 500 si falta la entrada). `/case-studies/[slug]` NO lee el listing → no se toca.
5. **generateStaticParams:** excluir slug `case-studies` de `[slug]/generateStaticParams` (igual que `blog`).
6. **Migración de datos:** script `src/scripts/migrate-case-studies-listing-to-page.ts` idempotente, ambos locales (es create / en update), `disableRevalidate`, global intacto. npm script `migrate:case-studies-listing`. NO ejecutar (necesita DB viva → diferido a Juan).
7. **Ramas muertas** de `case-studies-listing` en `[slug]/generateMetadata`: diferir a Phase 58 (global sigue vivo).
</decisions>

<code_context>
## Existing Code Insights

- `src/globals/CaseStudiesListing/config.ts` — slug `case-studies-listing`; fields title (required, localized), description (localized), layout (blocks: ListingHero, CaseStudiesGrid, LatestCaseStudies).
- `src/app/(frontend)/[locale]/case-studies/page.tsx:59` — lee `getCachedGlobal('case-studies-listing', 0, locale)`.
- `src/collections/Pages/index.ts:153-175` — layout blocks: ya incluye ListingHero, CaseStudiesGrid; NO incluye LatestCaseStudies. Agregar import + entry.
- `src/utilities/getPages.ts` — `getCachedPageBySlug` (reusar).
- `src/collections/Pages/hooks/revalidatePage.ts` — ya con `revalidateTag('pages_'+slug)`.
- Bloque `LatestCaseStudies` existe en `src/blocks/LatestCaseStudies/config.ts`.
</code_context>

<specifics>
## Specific Ideas

- Editar Pages layout: import + agregar `LatestCaseStudies`. `generate:types`.
- Reescribir `case-studies/page.tsx` espejando el `/blog/page.tsx` ya migrado en 54.
- Excluir `case-studies` de `[slug]/generateStaticParams`.
- Nuevo script + npm script `migrate:case-studies-listing`.
- Gate: `pnpm exec tsc --noEmit` sin nuevos errores en `src/`; `generate:types` diff acotado. Paridad/ISR/hreflang/live-preview + correr migración = diferido.
</specifics>

<deferred>
## Deferred Ideas

- Correr `pnpm migrate:case-studies-listing` (DB viva).
- Smoke deploy: `/es/case-studies` y `/en/case-studies` — paridad, x-vercel-cache HIT, hreflang/canonical/lang, live preview.
- Retiro del global + ramas muertas → Phase 58.
</deferred>
