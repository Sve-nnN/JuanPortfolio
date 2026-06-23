---
status: passed
phase: 1
verified: 2026-06-23
---

# Phase 1 Verification

## Success Criteria

1. ✓ Existe `[locale]/layout.tsx` con `params.locale`, carga siteSettings, envuelve en LocaleProvider + Header + Footer.
2. ✓ Root layout sin `headers()`/`draftMode()`; `<html lang="es">` fijo.
3. ✓ `HtmlLangSync` (cliente) corrige `<html lang>` a `en` bajo `/en` via useEffect.
4. ✓ Header/Footer toman el locale del param (no de headers).
5. ✓ `next build` no reporta dynamic API desde root ni `[locale]/layout`. `/` pasó de ƒ a ○.

## Method

- `tsc --noEmit -p tsconfig.verify.json` → exit 0.
- `next build` (con override local de type/eslint) → exit 0; tabla de rutas comparada contra baseline.

## Human verification needed

- **Live preview de Payload** y **runtime Vercel headers** (x-vercel-cache) se validan en Fase 3/5 y tras deploy. No verificable en build local.
