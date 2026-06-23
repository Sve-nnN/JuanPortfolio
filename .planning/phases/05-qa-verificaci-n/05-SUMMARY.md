# Phase 5 Summary: QA & Verificación

**Completed:** 2026-06-23
**Status:** Complete (local) — algunos checks human-needed post-deploy

## Método

Build de producción local + `next start` (puerto 3987) + `curl`. Inspección del HTML prerenderizado en `.next/server/app`.

## Resultados (curl contra build de producción local)

| Ruta | HTTP | x-nextjs-cache | Cache-Control |
|------|------|----------------|---------------|
| `/` (home ES) | 200 | HIT | `s-maxage=3600, stale-while-revalidate` |
| `/en` (home EN) | 200 | HIT | `s-maxage=3600, swr` |
| `/blog` | 200 | HIT | `s-maxage=3600, swr` |
| `/case-studies` | 200 | HIT | `s-maxage=3600, swr` |
| `/blog/cs-fundamentals/big-o-notation` (post ES) | 200 | HIT | `s-maxage=3600, swr` |
| `/en/blog/cs-fundamentals/big-o-notation` (post EN) | 200 | HIT | `s-maxage=3600, swr` |
| `/blog/cs-fundamentals` (categoría) | 200 | HIT | `s-maxage=3600, swr` |
| `/sitemap.xml` | 200 | HIT | `s-maxage=31536000` |
| `/es` | 301 → `/` | — | (consolidación issue #32 intacta) |

**Ningún `no-store`.** El header `x-nextjs-cache: HIT` local es el equivalente del `x-vercel-cache: HIT` en producción.

## hreflang / canonical (HTML prerenderizado)

- `/` (es): canonical `https://juan-tech.com`; hreflang es/en/x-default correctos.
- `/en`: canonical `https://juan-tech.com/en`; hreflang correctos.
- Post: canonical y hreflang es/en/x-default correctos.
- `<html lang="es">` en SSR para ambos; `/en` se corrige a `en` en cliente (HtmlLangSync) — cosmético, documentado en LOCALE-02.

## Switcher de idioma

- Render confirmado (aria-label "ES / EN, cambiar a Español" en `/en`).
- Variantes es/en de home, post y categoría devuelven 200 (sin 404 ni loops).

## Requirements

- QA-01 ✓ (hreflang/canonical correctos)
- QA-02 ✓ (switcher funciona, ambos locales 200)
- QA-03 ✓ (`/sitemap.xml` 200)

## Human-needed (post-deploy)

- `x-vercel-cache: HIT` real en producción (CACHE-03).
- Live preview de Payload (PREVIEW-02) tras deploy.
