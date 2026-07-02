# Milestone Context — v1.7 Rendimiento avanzado (LCP/INP/hero)

_Sembrado por Claude tras v1.6 (auditoría & remediación). Ejecutar `/gsd:new-milestone` para formalizar requirements + roadmap; este archivo pre-carga el scope._

## Milestone propuesto: v1.7 Rendimiento avanzado (Core Web Vitals)

**Goal:** Bajar el LCP mobile de la home a < 2500ms y el INP a < 200ms reduciendo el JavaScript de arranque y refactorizando el hero, sin romper la animación/diseño (QA visual obligatorio).

## Por qué (evidencia)

Medido con Unlighthouse (Chrome real, mobile) tras aplicar los quick-wins de v1.6 (Rocket Loader OFF ya hecho):
```
Perf 0.37 · FCP 2.7s · LCP 7.4s · TBT 2180ms · TTI 10.4s · CLS 0.001
```
Quitar Rocket Loader mejoró el FCP (4.1→2.7s) pero el LCP sigue ~7.4s y el TBT subió: sin el diferido de Rocket Loader, los ~27 chunks JS ejecutan de una y saturan el main thread. Causa raíz: JS pesado + hidratación del hero (framer-motion `useScroll`/`useTransform`, todo `'use client'`).

Detalle: `.planning/research/audit-jul2026/03-performance.md` · issues #95 (LCP) y #103 (INP field data).

## Target features (candidatas)

- **Hero a server component** con wrapper cliente chico solo para la animación parallax (el H1/LCP deja de depender de la hidratación del hero). — mayor palanca, requiere QA visual.
- **Recorte de JS inicial**: auditar los ~27 chunks / ~325KB gzip de la home; `next/dynamic` más agresivo below-the-fold; reducir/aislar el footprint de framer-motion (evaluar animar el entrance con CSS puro).
- **Recorte de preloads de fuentes** al peso del H1 (Array Bold); `preload:false` en Geist Sans/Mono si no son above-the-fold. — requiere QA visual (riesgo FOUT).
- **Cachear el HTML en el edge de Cloudflare** (hoy `cf-cache-status: DYNAMIC`) respetando el ISR de Next.
- **Validación con datos de campo**: usar el INP real que ya empieza a emitir el reporter `web-vitals`→GA4 (#103) para priorizar qué interacción arreglar, y re-medir con Unlighthouse (`npx unlighthouse-ci --site https://juan-tech.com --urls /`).

## Restricciones

- **QA visual obligatorio** antes de mergear el refactor del hero: no romper la animación de entrada ni el layout (prioridad UX de Juan).
- No regresionar el LCP-visible-en-SSR ya logrado en v1.1 (el H1 pinta en el primer render).
- Mantener tsc baseline (0 nuevos en src/) y tests verdes.
- Medir siempre en mobile (Unlighthouse throttlea como campo; PSI subestima).

## Fuera de alcance

- Rediseño visual del hero (solo mover la lógica de render, no el diseño).
- Cambiar el proxy Cloudflare→Vercel más allá de reglas de cache.

## Issues asociados

- #95 (LCP, seo:high) — abierto, se resuelve aquí.
- #103 (INP, seo:info) — el reporter de medición se entrega en v1.6; el análisis/fix del INP alto vive en este milestone.
</content>
