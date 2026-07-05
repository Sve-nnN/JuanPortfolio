---
phase: 55
plan: 1
subsystem: frontend / cms
tags: [payload, pages-migration, isr, live-preview, case-studies]
requires: [Phase 54 blog-listing→Pages pattern, getCachedPageBySlug, revalidatePage pages_<slug> tag]
provides: [/case-studies reads Pages slug 'case-studies', LatestCaseStudies block in Pages layout, migrate:case-studies-listing script]
affects: [src/collections/Pages/index.ts, src/app/(frontend)/[locale]/case-studies/page.tsx, src/app/(frontend)/[locale]/[slug]/page.tsx]
key-files:
  created:
    - src/scripts/migrate-case-studies-listing-to-page.ts
  modified:
    - src/collections/Pages/index.ts
    - src/payload-types.ts
    - src/app/(frontend)/[locale]/case-studies/page.tsx
    - src/app/(frontend)/[locale]/[slug]/page.tsx
    - package.json
decisions:
  - Reuse getCachedPageBySlug (no new util); slug 'case-studies', tag pages_case-studies
  - Global case-studies-listing left intact (removal deferred to Phase 58)
metrics:
  duration: ~15m
  completed: 2026-07-05
---

# Phase 55 Plan 1: Migración del listado de case studies a Pages Summary

Réplica directa del patrón de Phase 54: `/[locale]/case-studies` deja de leer el global `case-studies-listing` y pasa a leer la entrada editable de `Pages` (slug `case-studies`) vía `getCachedPageBySlug`, preservando ISR, hreflang/canonical y live preview, con fallback null-safe que evita 500 si la entrada aún no existe.

## What Was Built

1. **LatestCaseStudies en Pages** — Import + entrada en `content.layout` de `Pages` (ListingHero y CaseStudiesGrid ya estaban). `pnpm generate:types` regeneró `payload-types.ts` con diff acotado: la definición `LatestCaseStudiesBlock`/`_select` se movió arriba y se sumó a la unión del layout de `Page` y a `PagesSelect`.
2. **Reescritura de case-studies/page.tsx** — Espeja `/blog/page.tsx`: lee `getCachedPageBySlug('case-studies', 2, locale)`, renderiza `page.content.layout`, `generateMeta` con el doc (source-agnostic), rama `draftMode()` + `queryCaseStudiesPageDraft` (react cache, draft:true, overrideAccess:true, depth:2) + `LivePreviewListener`, fallback null-safe. ISR preservado (`revalidate = 3600`, sin no-store/force-dynamic). `/case-studies/[slug]` no tocado.
3. **generateStaticParams** — `case-studies` excluido de `[slug]/generateStaticParams` (junto a `home` y `blog`) para evitar params duplicados / doble render con la ruta de carpeta dedicada.
4. **Script de migración** — `migrate-case-studies-listing-to-page.ts` idempotente (upsert por slug, es create / en update sobre el mismo doc, `context: { disableRevalidate: true }`, global intacto). npm script `migrate:case-studies-listing`. NO ejecutado (requiere DATABASE_URI vivo).

## Files Changed

| File | Change | Commit |
| ---- | ------ | ------ |
| src/collections/Pages/index.ts | Import + entry LatestCaseStudies | 163ab44 |
| src/payload-types.ts | Regenerado (diff acotado al bloque) | 163ab44 |
| src/app/(frontend)/[locale]/case-studies/page.tsx | Reescrito para leer Pages | fec9d4f |
| src/app/(frontend)/[locale]/[slug]/page.tsx | Excluir slug case-studies | fec9d4f |
| src/scripts/migrate-case-studies-listing-to-page.ts | Nuevo script de migración | 19c130a |
| package.json | npm script migrate:case-studies-listing | 19c130a |

## Verification

- `pnpm exec tsc --noEmit`: **0 errores en `src/`**. Ninguno en archivos tocados. Los 114 errores totales están todos en `tests/` (pre-existentes, fuera de alcance).
- `pnpm generate:types`: diff limitado al bloque `LatestCaseStudies` (definición reordenada + añadida a la unión de layout de `Page` y a `PagesSelect`). Types regenerados commiteados.
- `pnpm build`: no ejecutado (tsc no lo forzó). Script de migración no ejecutado.

## Deviations from Plan

None - plan executed exactly as written.

## Deferred Human Steps

1. **Ejecutar `pnpm migrate:case-studies-listing`** (requiere DATABASE_URI vivo). Copia el global a la entrada `Pages` slug `case-studies` en ambos locales. Idempotente.
2. **Smoke deploy**: `/es/case-studies` y `/en/case-studies` — paridad visual, `x-vercel-cache: HIT`, hreflang/canonical/lang correctos, live preview.
3. **Phase 58**: retiro del global `case-studies-listing` + ramas muertas en `[slug]/generateMetadata` (bloque `slug === 'case-studies-listing'`). El global sigue vivo como rollback.

## Self-Check: PASSED

- Files exist: Pages/index.ts, case-studies/page.tsx, [slug]/page.tsx, migrate-case-studies-listing-to-page.ts, package.json — all present.
- Commits exist: 163ab44, fec9d4f, 19c130a — all in git log.
