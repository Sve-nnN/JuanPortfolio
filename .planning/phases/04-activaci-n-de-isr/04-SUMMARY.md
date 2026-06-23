# Phase 4 Summary: Activación de ISR

**Completed:** 2026-06-23
**Status:** Complete

## What changed

Rutas índice del segmento `[locale]` que eran `ƒ` por falta de `generateStaticParams`:
- `[locale]/page.tsx` (home) — `+ generateStaticParams` (es, en) `+ revalidate=3600` `+ dynamicParams`
- `[locale]/blog/page.tsx` — `+ generateStaticParams` (ya tenía `revalidate=3600`)
- `[locale]/case-studies/page.tsx` — `+ generateStaticParams` `+ revalidate=3600`

Templates de detalle (ISR explícito, CACHE-01):
- `[locale]/[slug]/page.tsx` — `+ revalidate=3600`
- `[locale]/blog/[category]/page.tsx` — `+ revalidate=3600`
- `[locale]/blog/[category]/[slug]/page.tsx` — `+ revalidate=3600`
- `[locale]/case-studies/[slug]/page.tsx` — `+ revalidate=3600`

## Requirements

- CACHE-01 ✓ (4 templates con `revalidate=3600`)
- CACHE-02 ✓ (build muestra `●`/`○` en home y plantillas — ver tabla)
- CACHE-03 — **human-needed**: `x-vercel-cache: HIT` y `cache-control` sin `no-store` se verifican en producción tras deploy.

## Verification (next build local)

| Ruta | Antes | Después |
|------|-------|---------|
| `/[locale]` (home es/en) | ƒ | **● 1h** |
| `/[locale]/[slug]` | ● (sin revalidate) | **● 1h** |
| `/[locale]/blog` | ƒ | **● 1h** |
| `/[locale]/blog/[category]` | ● | **● 1h** |
| `/[locale]/blog/[category]/[slug]` | ● | **● 1h** |
| `/[locale]/case-studies` | ƒ | **● 1h** |
| `/[locale]/case-studies/[slug]` | ● | **● 1h** |
| `/` | ƒ | rewrite→`/es` (●) |

Cero `ƒ` en las rutas objetivo. Restan `ƒ`: `author`, `authors`, `search` — fuera del alcance de #20 (search es inherentemente dinámico). `tsc -p tsconfig.verify.json` exit 0. Build exit 0.
