---
status: human_needed
phase: 4
verified: 2026-06-23
---

# Phase 4 Verification

## Success Criteria

1. ✓ Las 4 plantillas de contenido tienen `export const revalidate = 3600`.
2. ✓ `next build` muestra `●` (ISR, revalidate 1h) en home y todas las plantillas — cero `ƒ` en las rutas objetivo.
3. ⏳ (human) Producción: `/` devuelve `x-vercel-cache: HIT` tras warm-up.
4. ⏳ (human) Producción: un post devuelve `cache-control` sin `no-store` ni `private`.

## Method

Build local autoritativo (`next build`, exit 0). Tabla de rutas comparada contra baseline: todas las objetivo pasaron a `● 1h`. `tsc -p tsconfig.verify.json` exit 0.

## Human verification needed (post-deploy)

- `curl -I https://juan-tech.com/` → `x-vercel-cache: HIT`, sin `no-store`.
- `curl -I` a un post → `cache-control` sin `no-store`/`private`.
- Confirmar en Vercel que las rutas figuran como ISR.
