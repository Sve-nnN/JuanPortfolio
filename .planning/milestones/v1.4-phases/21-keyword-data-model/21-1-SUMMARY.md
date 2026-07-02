---
phase: 21-keyword-data-model
plan: 1
subsystem: payload-collections
tags: [keyword, seo, data-model, payload]
requires: [keyword-metrics]
provides: [pages.primaryKeyword, pages.semanticKeywords, categories.primaryKeyword, users.primaryKeyword]
affects: [src/payload-types.ts]
tech-stack:
  added: []
  patterns: [relationship-to-keyword-metrics, sidebar-field, bilingual-label]
key-files:
  created: []
  modified:
    - src/collections/Pages/index.ts
    - src/collections/Categories.ts
    - src/collections/Users/index.ts
    - src/payload-types.ts
decisions:
  - "Espejo 1:1 del patrón Meta de Posts; solo primaryKeyword + semanticKeywords en Pages (sin relatedPosts ni otros campos)."
  - "Categories y Users reciben solo primaryKeyword (forward relationship), sin relaciones reversas ni colección nueva."
  - "Único mecanismo de keyword objetivo es la relación a keyword-metrics; no se agregó ningún campo de texto suelto."
metrics:
  duration: ~10m
  completed: 2026-06-25
requirements: [KW-01, KW-02, KW-03]
---

# Phase 21 Plan 1: Keyword Data Model Summary

Se agregó el modelo de datos de keyword objetivo a Pages (tab Meta con `primaryKeyword` + `semanticKeywords`), Categories y Users (campo `primaryKeyword` en sidebar), todos vía relación a `keyword-metrics`, espejando el patrón ya existente en Posts. Tipos regenerados; los cambios no introducen ningún error de tipo nuevo.

## What Changed

- **src/collections/Pages/index.ts** (Task 1): Nuevo tab `Meta` (label bilingüe `{ en: 'Meta', es: 'Meta' }`) al final del array `tabs`, después de `searchConsole`. Contiene únicamente `primaryKeyword` (relationship a `keyword-metrics`, sidebar) y `semanticKeywords` (relationship a `keyword-metrics`, `hasMany`, sidebar). No se incluyó `relatedPosts` ni otros campos de Posts. El hook `syncKeywordsAfterPostSave` (slug-based) quedó intacto.
- **src/collections/Categories.ts** (Task 2): Campo `primaryKeyword` (relationship a `keyword-metrics`, sidebar, label bilingüe `Target Keyword` / `Keyword Objetivo`) agregado dentro de `getCategoryFields()`, junto a los demás campos sidebar (después de `liveUrl`).
- **src/collections/Users/index.ts** (Task 2): Campo `primaryKeyword` (mismo tipo y label) agregado en el tab `Perfil`, junto al campo sidebar `liveUrl` existente. No se agregaron relaciones reversas.
- **src/payload-types.ts** (Task 3): Regenerado con `pnpm generate:types`. Diff puramente aditivo (8 líneas) con los nuevos campos tipados como relación a `KeywordMetric` en `Page`, `Category`, `User` y sus tipos `select`.

## Verification

- `pnpm generate:types`: OK, tipos escritos sin error.
- `grep "relationTo: 'keyword-metrics'"`: Pages = 2, Categories = 1, Users = 1. Correcto.
- `grep "primaryKeyword" src/payload-types.ts` = 8 (> 0). Correcto.
- KW-03: sin campos de texto suelto de keyword (`focusKeyword`/`targetKeyword`/`keywordText`) en Posts ni Pages. El patrón `primaryKeyword` de Posts permanece intacto (sin regresión).
- **`pnpm exec tsc --noEmit`**: 114 errores, TODOS preexistentes y fuera del scope de este plan (112 en `tests/`, 2 en `src/scripts/` — uno de ellos `src/scripts/scrape-dinorank.ts`, ya modificado en el working tree). Verificado contra el estado anterior a los cambios: el baseline tiene exactamente los mismos 114 errores. **Mis cambios introdujeron CERO errores de tipo nuevos.** Ninguno de los 114 errores ocurre en los 4 archivos modificados.

## Deviations from Plan

Ninguna desviación de implementación. El plan se ejecutó como fue escrito.

Nota sobre la verificación de Task 3: el comando `verify` del plan espera `pnpm exec tsc --noEmit` "verde" sin errores. El repositorio tiene 114 errores de tipo preexistentes en `tests/` y `src/scripts/` (no relacionados con este plan, working tree sucio por trabajo previo de otra rama). Se confirmó por comparación contra el estado pre-cambio que el conteo es idéntico (114 = 114), por lo que los archivos de este plan type-checkean limpio. Estos errores preexistentes quedan fuera de scope (regla scope boundary) y se documentan en `deferred-items.md`.

## Deferred Issues

Registrados en `.planning/phases/21-keyword-data-model/deferred-items.md`: 114 errores de tipo preexistentes en `tests/` y `src/scripts/` (KeywordData type mismatch, GSC adapters, sitemaps, scrape-dinorank/quick-research). No causados por este plan.

## Commits

- `d4ec5b1` feat(21): add Meta tab with primaryKeyword + semanticKeywords to Pages
- `865f9ab` feat(21): add primaryKeyword sidebar field to Categories and Users
- `17e6fd1` feat(21): regenerate payload-types with primaryKeyword fields

## Self-Check: PASSED

Todos los archivos modificados existen y los 3 commits de tarea están en el historial.
