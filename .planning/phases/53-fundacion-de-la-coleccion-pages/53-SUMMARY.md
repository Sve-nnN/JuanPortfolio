---
phase: 53-fundacion-de-la-coleccion-pages
plan: 01
subsystem: cms-collections
tags: [payload, pages, hooks, duplicate, field-hook]
requires: []
provides:
  - "Pages duplication sin colisión de slug único (field hooks beforeDuplicate)"
affects:
  - "src/collections/Pages"
tech-stack:
  added: []
  patterns:
    - "beforeDuplicate como FieldHook (nivel campo) en Payload 3.61.1, no a nivel colección"
    - "slugField() overrides via deepMerge para agregar hooks sin perder beforeValidate"
key-files:
  created:
    - src/collections/Pages/hooks/beforeDuplicatePage.ts
  modified:
    - src/collections/Pages/index.ts
decisions:
  - "beforeDuplicate implementado a nivel campo (slug + title), no colección — CollectionConfig.hooks no soporta beforeDuplicate en 3.61.1"
  - "overrideAccess: true en payload.find para ver drafts/no publicados y no reusar slugs ocupados"
  - "Duplicate queda habilitado (sin disableDuplicate) — es el mecanismo que PAGES-02 pide"
metrics:
  duration: "~10min"
  completed: "2026-07-05"
requirements: [PAGES-01, PAGES-02]
---

# Phase 53 Plan 01: Fundación de la colección Pages Summary

Habilitada la duplicación de páginas en la colección `Pages` mediante dos field hooks `beforeDuplicate` (slug único incremental + título sufijado con " (copy)"), sin cambios de schema ni de ruta ISR.

## What Was Built

- **`src/collections/Pages/hooks/beforeDuplicatePage.ts`** (nuevo): dos `FieldHook`.
  - `uniqueSlugBeforeDuplicate`: para el campo `slug` (text global, no localizado). Construye `${value}-copy`; si colisiona en `pages` (via `req.payload.find` con `overrideAccess: true`), itera `-copy-2`, `-copy-3`… hasta 100 intentos, con fallback a `-copy-${Date.now()}`. Devuelve el slug libre. Defensivo si `value` no es string no vacío.
  - `suffixTitleBeforeDuplicate`: para el campo `title` (`localized: true`). Maneja `value` como string (`${value} (copy)`) o como objeto por-locale (sufija cada valor string, deja intactos los no-string). Null/undefined sin cambios.
- **`src/collections/Pages/index.ts`** (modificado):
  - Campo `slug`: `slugField('title', { hooks: { beforeDuplicate: [uniqueSlugBeforeDuplicate] } })` — deepMerge conserva el `beforeValidate` existente y agrega `beforeDuplicate`.
  - Campo `title`: agregado `hooks: { beforeDuplicate: [suffixTitleBeforeDuplicate] }`.
  - Bloque `hooks:` de colección intacto; sin `disableDuplicate`.

## Verification Results

- `pnpm exec tsc --noEmit`: 114 errores totales, TODOS en `tests/` (baseline pre-existente, fuera de scope). CERO errores en `src/` no-test; cero errores relacionados con `src/collections/Pages/**`. No introduje errores nuevos en src/.
- `pnpm generate:types` → `git diff src/payload-types.ts` VACÍO (NO_SCHEMA_DIFF). El field hook no altera el schema, como se esperaba.
- Task 1 grep de wiring: WIRED (ambos hooks exportados y referenciados).

## Deviations from Plan

None - plan ejecutado exactamente como está escrito. Se usó la corrección del `<interfaces>` (beforeDuplicate como FieldHook a nivel campo) tal cual.

## Deferred / Human Verification Needed

Post-deploy (batch con el resto del milestone, per CONTEXT §deferred):
1. `/admin` → Pages: crear página nueva, slug único, publicar; abrir ruta pública y confirmar render de bloques (PAGES-01).
2. `/admin` → Pages: duplicar una página; confirmar slug distinto (`-copy`), título con " (copy)", independiente del original (PAGES-02).
3. Vercel preview/prod: `curl -I` a la ruta pública → `x-vercel-cache: HIT` sin `no-store`/`force-dynamic` (criterio 3, no verificable en local).

## Commits

- `898994c`: feat(53-01): enable Page duplication via beforeDuplicate field hooks

## Self-Check: PASSED

- FOUND: src/collections/Pages/hooks/beforeDuplicatePage.ts
- FOUND: commit 898994c
