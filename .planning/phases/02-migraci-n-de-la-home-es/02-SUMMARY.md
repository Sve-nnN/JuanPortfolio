# Phase 2 Summary: Migración de la Home ES

**Completed:** 2026-06-23
**Status:** Complete

## What changed

- `src/middleware.ts` — el paso 3 ahora reescribe internamente `/` → `/es` (`NextResponse.rewrite`) en vez de dejar pasar a `(frontend)/page.tsx`. El usuario sigue viendo `/`. El redirect 301 `/es`→`/` (paso 1.5) solo aplica a requests entrantes, no al rewrite interno.
- **DELETED** `src/app/(frontend)/page.tsx` — la home ES ahora la sirve `[locale]/page.tsx` con `locale=es`, heredando el chrome de `[locale]/layout.tsx`.

## Why

Tras Fase 1, el chrome (Header/Footer) vive en `[locale]/layout.tsx`. La home ES servida por el viejo `(frontend)/page.tsx` quedaba FUERA de `[locale]` → sin chrome. Rutear `/` a `/es` la mete en `[locale]` y restaura el chrome.

## Requirements

- ROUTE-02 ✓ (home ES vía `[locale]/page.tsx`, hereda chrome)
- ROUTE-03 ✓ (middleware rewrite `/`→`/es`; `(frontend)/page.tsx` eliminado)

## Verification

Ver build autoritativo (Fase 4): `/` ya no aparece como ruta propia; `/es` lo sirve `[locale]/page.tsx` (●). El rewrite es interno (sin 301 al usuario).
