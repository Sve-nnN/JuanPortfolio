# Phase 41: Recorte de preloads de fuentes — Summary

**Completed (code):** 2026-07-05
**Commit:** `c63b29d`
**Requirements:** PERF-08
**Status:** Código hecho · gate de QA visual (FOUT) pendiente (Juan)

## Qué se hizo (`src/app/(frontend)/layout.tsx`, `globals.css`, `HeroHome/Component.tsx`)

Objetivo: que above-the-fold se preloadee **solo la fuente del H1 (Array Bold)**, sin faux-weights ni FOUT.

1. **Array Bold como instancia aparte, preloadeada.** Nueva `ArrayBold` (`next/font/local`, solo `Array-Bold.woff2`, `preload: true`, variable `--font-array-bold`). El H1 de la home (elemento LCP) la usa vía la utilidad CSS `.font-display-lcp` (`var(--font-array-bold), var(--font-array), serif`).
2. **Familia Array completa, sin preload.** `ArrayFont` (Regular/Semibold/Bold, `--font-array`) pasa a `preload: false`. Sigue disponible para el resto (footer logo, prose headings, otros títulos), que cargan con `display: swap` below-the-fold. Así evitamos faux-weights: la familia completa sigue existiendo, solo cambió qué se preloadea.
3. **GeistSans eliminado.** Era dead code: `--font-geist-sans` no se usa en ningún lado (tailwind `font-sans` mapea a Khand). Se quitó el import y la variable del `<html>`.
4. **GeistMono intacto.** Solo se usa en `font-mono` (bloques de código, below-the-fold). `next/font` preloadea por uso, así que en la home no se preloadea. No requiere cambio.

Khand ya estaba en `preload: false` desde jun-2026 (#39).

## Verificación de código

- **tsc:** 112 (baseline, 0 nuevos en `src/`).
- **Dev server:** `/` y `/en` → 200, sin errores; el H1 renderiza con `font-display-lcp`.
- **Efecto de preload real:** `next/font` solo emite los `<link rel=preload>` en build de producción (no en dev). El recuento real de preloads y su impacto se confirman en la **Fase 40** (build + Unlighthouse). Esperado: la home pasa de preloadear 3 woff2 de Array (+ Geist) a preloadear **1** (Array Bold).

## Pendiente de Juan (gate)

QA visual: confirmar que las fuentes se ven idénticas (H1 home, logo del Footer, títulos/prose) — sin texto en peso equivocado ni salto (FOUT). Ver `41-VERIFICATION.md`.
