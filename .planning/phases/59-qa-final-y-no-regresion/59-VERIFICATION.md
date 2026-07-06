---
phase: 59
title: QA final y no-regresión
status: human_needed
score: "1/4 gates verificables en código (QA-04); QA-01/02/03 requieren deploy+migración"
date: 2026-07-05
---

# Phase 59 — QA final y no-regresión

Verificación cruzada de las superficies migradas (`/`, blog, case studies) + calidad de código, al cierre del milestone v1.9.

## QA-04 — tsc baseline + suite de tests (VERIFICADO en código)

**tsc (`pnpm exec tsc --noEmit`):** 0 errores nuevos en `src/`. Total 112-114 errores, TODOS en `tests/` (baseline pre-existente, tipos de KeywordData/SeoAdapter/mocks — ajenos a v1.9). Ningún archivo migrado en esta milestone introduce error de tipos.

**Suite de tests (`pnpm test:int`, vitest):** **766/769 tests verdes** (87/90 archivos).
- Los 3 fallos son `spawnSync … ETIMEDOUT` en `tests/int/scripts/fixInternalLinks.int.test.ts` y `tests/int/scripts/searchKeyword.int.test.ts`.
- Naturaleza: esos tests hacen `execSync('npx tsx <script>')` en subproceso; el fallo es cold-start del subproceso excediendo el timeout del sandbox, NO una aserción rota.
- Relación con v1.9: NINGUNA — grep confirmó que no referencian `pages`/`authors`/`postAuthors`/`home`/`blog-listing`/`case-studies-listing`. No es regresión de la milestone.
- **Acción de Juan:** re-correr `pnpm test:int` en entorno local normal para confirmar que esos 3 pasan (esperado: verde, sin el timeout del sandbox). e2e (`test:e2e`, Playwright) requiere server levantado → correr local.

## QA-01 — ISR / edge-cache (DIFERIDO a deploy+migración)

`x-vercel-cache: HIT` sin `no-store` en `/`, `/blog`, `/case-studies` (es+en). Verificable solo post-deploy de `main` + migraciones corridas. Código confirmado sin `force-dynamic`/`no-store`; lecturas cacheadas por tag (`getCachedPageBySlug`, `pages_<slug>`), `revalidate=3600`. Checklist en `v1.9-JUAN-ACTIONS.md`.

## QA-02 — hreflang / canonical / `<html lang>` (DIFERIDO a deploy+migración)

Correctos por locale en las 3 rutas. `generateMeta` es independiente de la fuente (global vs page) → sin regresión esperada. Verificación real post-deploy. Checklist en JUAN-ACTIONS.

## QA-03 — Live preview (DIFERIDO a deploy+migración)

Live preview de Payload sobre las Pages `home`/`blog`/`case-studies`. Ramas `draftMode()` + `LivePreviewListener` añadidas; `generatePreviewPath` mapea home→`/`. Verificación end-to-end en el admin post-migración. Checklist en JUAN-ACTIONS.

## Veredicto

`human_needed`: el único gate 100% verificable en código (QA-04) está verde salvo 3 tests con timeout ambiental ajenos a v1.9. QA-01/02/03 son checks de runtime que dependen del deploy de `main` + las 4 migraciones + (luego) el merge del branch `chore/v1.9-retire-globals`. El milestone NO se cierra hasta que Juan corra la secuencia de `v1.9-JUAN-ACTIONS.md` y confirme los smokes.
