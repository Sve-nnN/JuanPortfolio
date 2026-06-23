---
status: passed
phase: 5
verified: 2026-06-23
---

# Phase 5 Verification

## Success Criteria

1. ✓ `/` y `/en` con hreflang y canonical correctos en el HTML entregado.
2. ✓ Switcher de idioma funciona en home, posts y categorías sin 404 ni loops (variantes es/en → 200).
3. ✓ `/sitemap.xml` responde 200.

## Method

`next start` local + `curl` sobre el build de producción; inspección del HTML prerenderizado. Todas las rutas objetivo: 200 + `x-nextjs-cache: HIT` + `Cache-Control: s-maxage=3600` (sin `no-store`).

## Human verification needed (post-deploy)

- `x-vercel-cache: HIT` real en producción.
- Live preview de Payload.
