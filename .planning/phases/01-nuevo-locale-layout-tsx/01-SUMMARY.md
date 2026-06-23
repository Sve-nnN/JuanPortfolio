# Phase 1 Summary: Nuevo [locale]/layout.tsx

**Completed:** 2026-06-23
**Status:** Complete

## What changed

- **NEW** `src/app/(frontend)/[locale]/layout.tsx` — layout locale-scoped: deriva locale de `params`, fetch de siteSettings, JSON-LD Organization/WebSite, LocaleProvider, Header, Footer, y `HtmlLangSync`.
- **NEW** `src/components/HtmlLangSync/index.tsx` — client component que corrige `<html lang>` a `en` bajo `/en` (useEffect).
- `src/app/(frontend)/layout.tsx` — root layout sin `draftMode()`/`headers()`. `<html lang="es">` fijo. AdminBar sin prop `preview`. Quitados imports no usados.
- `src/Header/Component.tsx` — recibe `locale` por prop (default `es`), borra `headers()`/`x-pathname`.
- `src/app/(frontend)/not-found.tsx` y `sitemap/page.tsx` — reciben `<Header/>`/`<Footer/>` (es) inline porque viven fuera de `[locale]` y ya no heredan el chrome del root.

## Verification (next build local)

| Ruta | Antes | Después |
|------|-------|---------|
| `/` (home ES) | ƒ | **○** (static) |
| `/sitemap` | (heredaba root) | **○** con chrome |
| `/[locale]/[slug]` | ● | ● (sin cambio) |
| `/[locale]` (home en) | ƒ | ƒ (pendiente Fase 4: generateStaticParams) |
| `/[locale]/blog`, `/case-studies` índices | ƒ | ƒ (pendiente Fase 4) |

- `tsc -p tsconfig.verify.json` → 0 errores en los archivos editados.
- Build completo exit 0, 186 páginas generadas, sin errores de runtime.

## Requirements

- LOCALE-01 ✓ (root sin headers, lang es fijo)
- LOCALE-02 ✓ (HtmlLangSync corrige /en en cliente)
- LOCALE-03 ✓ (Header/Footer por param locale)
- ROUTE-01 ✓ (`[locale]/layout.tsx` con chrome + schema)
- PREVIEW-01 ✓ (AdminBar sin prop preview)

## Notes

- `/` quedó sin Header/Footer en este estado intermedio (root page.tsx está fuera de `[locale]`). Lo restaura **Fase 2** (rewrite `/`→`/es` + borrar root page.tsx).
- Override temporal en `next.config.js` (ignoreBuildErrors/ESLint) y `tsconfig.verify.json` son SOLO para verificación local — no se commitean.
