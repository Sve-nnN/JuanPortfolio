# Phase 1: Nuevo [locale]/layout.tsx - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning
**Mode:** Autonomous (discuss skipped)

<domain>
## Phase Boundary

Crear `src/app/(frontend)/[locale]/layout.tsx` que recibe el locale por `params` (sin `headers()`), y limpiar el root layout de todas las dynamic APIs (`draftMode()`, `headers()`). Mover al nuevo layout la lógica dependiente del locale: siteSettings, JSON-LD Organization/WebSite, LocaleProvider, Header, Footer. `<html lang>` queda fijo en `es` en el root y se corrige en cliente para `/en`.
</domain>

<decisions>
## Implementation Decisions

- **`<html lang>`**: fijo `es` en root + componente cliente `HtmlLangSync` (useEffect) que corrige a `en` bajo `/en`. Vive en `[locale]/layout.tsx` con el locale por param.
- **AdminBar**: se renderiza sin prop `preview` (autodetección por login cliente, confirmado).
- **Chrome fuera de `[locale]`**: las rutas `sitemap`, `not-found` (server) reciben `<Header/>`/`<Footer/>` con locale `es` inline para no perder el chrome. `error.tsx` es client → queda mínimo.
- **Header**: pasa a recibir `locale` por prop (default `es`), borra `headers()`.

## Hallazgo de research (relevante para fases 3-4)

El build local (`next build`) mostró que la premisa del issue ("headers() marca TODO dinámico") es incompleta: los templates de detalle (`[slug]`, `blog/[category]/[slug]`, `case-studies/[slug]`) YA son `●` (estáticos) porque tienen `generateStaticParams` que enumera locales. Las rutas `ƒ` reales son las índice del segmento `[locale]` sin `generateStaticParams`: home (`/[locale]`), `/blog`, `/case-studies`, y la home ES (`/`). Fix combinado: quitar dynamic APIs del root + añadir `generateStaticParams`(locales)+`revalidate` a las índice (Fase 4) + mover la home a `[locale]` (Fase 2).
</decisions>

<code_context>
## Existing Code Insights

- Root layout: `src/app/(frontend)/layout.tsx:84-87` (draftMode + headers + locale por x-pathname).
- Header: `src/Header/Component.tsx:9-11` (headers + locale por x-pathname).
- `[locale]/page.tsx` re-exporta PageTemplate de `[slug]/page` (sirve home con slug='home').
- `getCachedGlobal` (`src/utilities/getGlobals.ts`) usa `unstable_cache` → cacheable, no es dynamic API.
- Verificación local de build: `next.config.js` tiene un override temporal (`typescript.ignoreBuildErrors`/`eslint.ignoreDuringBuilds`) NO commiteado, para saltar errores de tipo en scripts locales rotos y poder leer la tabla de rutas. Tipos de los archivos editados se validan con `tsconfig.verify.json` (excluye `src/scripts`).
</code_context>

<specifics>
## Specific Ideas

Ver REQUIREMENTS.md: ROUTE-01, LOCALE-01, LOCALE-02, LOCALE-03, PREVIEW-01.
</specifics>

<deferred>
## Deferred Ideas

- `generateStaticParams`+`revalidate` en índice → Fase 4.
- Aislamiento de `draftMode()` en templates → Fase 3 (ya usan params.locale, sin headers).
</deferred>
