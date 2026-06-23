# Phase 3 Summary: Aislamiento de draftMode

**Completed:** 2026-06-23
**Status:** Complete (sin cambio de código en templates — confirmado por build)

## Hallazgo

El research contra docs de Next 15 + el build local confirmaron que `await draftMode()` NO es un bailout duro a dinámico: es **bypass-cookie-gated**. La página se prerenderiza con `isEnabled=false`; solo cae a dinámico en request-time cuando la cookie `__prerender_bypass` (preview de Payload) está presente. Por eso los 4 templates de detalle ya eran `●` (estáticos) incluso llamando `draftMode()`.

## Estado de las 4 plantillas

Todas ya obtienen el locale de `params` (no `headers()`) y llaman `draftMode()` solo para alternar el flag `draft` del fetch de Payload:
- `[locale]/[slug]/page.tsx`
- `[locale]/blog/[category]/page.tsx`
- `[locale]/blog/[category]/[slug]/page.tsx`
- `[locale]/case-studies/[slug]/page.tsx`

No fue necesario mover `draftMode()` a un subárbol Suspense (eso requeriría `cacheComponents`/PPR, no activado). El patrón canónico (route handler `/next/preview` + `LivePreviewListener`) ya estaba bien y se mantiene intacto.

## Requirements

- PREVIEW-02 ✓ (render publicado no llama `headers()`; `draftMode()` no fuerza dinámico — bypass-gated; build muestra `●`)
- PREVIEW-03 ✓ (`draftMode()` solo activa render dinámico con la cookie de preview)

## Verification

- Build: las 4 plantillas siguen `●` tras quitar el taint del root (Fase 1) → confirma que `draftMode()` queda gated.
- **Human-needed:** probar live preview real en Payload admin tras deploy (no verificable en build local).
