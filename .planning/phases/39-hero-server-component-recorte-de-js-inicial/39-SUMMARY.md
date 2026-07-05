# Phase 39: Hero server component + recorte de JS inicial — Summary

**Completed (code):** 2026-07-04
**Commit:** `41a308d`
**Requirements:** PERF-04, PERF-05, PERF-06
**Status:** Código hecho · verificación con **gate de QA visual pendiente (Juan)**

## Qué se hizo

Refactor del hero de la home (`src/blocks/HeroHome`) para sacar el LCP de la ruta de hidratación y quitar framer-motion del bundle above-the-fold.

### Cambios

1. **`HeroHome/Component.tsx` → server component.** Se quitó `'use client'` y todos los imports de `framer-motion` (`LazyMotion`, `m`, `useScroll`, `useTransform`, variants). El H1 (elemento LCP) ahora se renderiza como HTML de SSR puro, sin depender de la hidratación.

2. **`HeroHome/HeroScroll.client.tsx` (nuevo).** Único JS del hero: un wrapper cliente mínimo que escribe `window.scrollY` en la custom property `--sy` (rAF-throttled, `passive`), respeta `prefers-reduced-motion` y limpia el listener al desmontar. ~55 líneas, sin dependencias.

3. **`globals.css`.** El parallax de scroll pasó a CSS `calc()/clamp()` leyendo `--sy`, replicando exacto los mapeos lineales que hacía framer `useTransform`:
   - backdrop y: `scrollY [0,500] → [0,200]px`
   - text y: `scrollY [0,500] → [0,-150]px`
   - opacity: `scrollY [0,300] → [1,0]`
   - media scale: `scrollY [0,500] → [1,0.9]`

   El entrance (slide-up + stagger, media scale/rotate-in) pasó a keyframes CSS (`hero-rise`, `hero-media-in`) con `animation-delay` por item (0/100/200/300ms) para reproducir `staggerChildren: 0.1`. Misma curva (`cubic-bezier(.25,.1,.25,1)`) y duraciones (0.8s / 1.5s). La opacidad ya era 1 fija, así que el entrance es solo `translateY`.

### Por qué esto baja el JS de arranque

- framer-motion deja de estar en el chunk del hero (above-the-fold). Los demás bloques que aún usan framer (FeaturedWorks/FeaturedClients/AboutWithFeatures) son below-the-fold y ya cargan con `next/dynamic`, así que framer sale de la ruta crítica.
- Antes de la hidratación, `--sy` no está seteada → CSS cae a 0 → transform identidad → el primer paint coincide con el SSR y el LCP no espera JS.

## Verificación de código

- **tsc:** 112 (baseline exacto, 0 nuevos en `src/`).
- **tests:** suite verde salvo 2 int tests flaky de red/DB no relacionados (`fixInternalLinks.int`, `searchKeyword.int`); ningún test de hero/block/component falla. `HeroHome.test.tsx` está excluido de vitest (baseline preexistente).
- **Bundle real:** la re-medición de chunks/TBT queda para la Fase 40 (necesita build).

## Pendiente de Juan (gate — no mergear sin esto)

Ver `39-VERIFICATION.md`. QA visual mobile: animación de entrada, parallax de scroll y layout deben verse **idénticos** a antes.
