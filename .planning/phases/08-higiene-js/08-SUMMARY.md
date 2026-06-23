# Phase 8 Summary: Higiene de JS

**Completed:** 2026-06-23

## What changed

- `src/app/(frontend)/layout.tsx` — Ahrefs analytics pasa de `afterInteractive` a `lazyOnload` (carga en idle, después del LCP/interacción).

## Hallazgo: browserslist ya es moderno

`package.json` ya declara `browserslist: ["since 2023", "not dead"]` — moderno. Los polyfills legacy que reporta Lighthouse (Array.at, flat, flatMap, Object.fromEntries, Object.hasOwn, String.trim*) NO los genera SWC desde nuestro browserslist; vienen empaquetados por una **dependencia transpilada** (chunk `1684-...js`, ~12KB). Tightening browserslist no los quita y rompería navegadores 2023 por una ganancia marginal → se deja como está, documentado.

GTM ya carga vía `@next/third-parties` dentro de `<Suspense>` (no bloquea el render inicial); se deja.

## Requirements

- JS-01 ✓ (browserslist ya moderno; polyfills residuales son de dependencia, fuera de alcance — documentado)
- TP-03 ✓ (Ahrefs → lazyOnload; GTM ya diferido)

## Verification

- Build verde; Ahrefs ya no en el critical path de TBT.
