---
phase: 54-migracion-del-listado-de-blog-a-pages
plan: 01
subsystem: content/routing
tags: [payload, pages, migration, isr, live-preview, blog]
requires: [Pages collection, blog-listing global, getCachedGlobal pattern]
provides: [getCachedPageBySlug, LatestBlogPosts on Pages layout, migrate:blog-listing script]
affects: [/blog route, revalidatePage hook, [slug] generateStaticParams]
requirements: [PAGES-04]
key-files:
  created:
    - src/utilities/getPages.ts
    - src/scripts/migrate-blog-listing-to-page.ts
  modified:
    - src/collections/Pages/index.ts
    - src/payload-types.ts
    - src/collections/Pages/hooks/revalidatePage.ts
    - src/app/(frontend)/[locale]/blog/page.tsx
    - src/app/(frontend)/[locale]/[slug]/page.tsx
    - package.json
decisions:
  - "Live preview: added draftMode()-gated branch to /blog (resolves open question A3)"
  - "description -> meta.description mapping in migration (strict SEO improvement)"
  - "Defer dead blog-listing metadata branches in [slug] to Phase 58; only staticParams exclusion now"
  - "Global blog-listing left intact for instant rollback until Phase 58"
metrics:
  tasks: 3
  files: 8
  completed: 2026-07-05
---

# Phase 54 Plan 01: Migración del listado de blog a Pages Summary

Migré la ruta pública `/blog` para leer una entrada editable de la colección Pages (slug `blog`) vía `getCachedPageBySlug` (tag `pages_blog`, ISR preservado) en lugar del global `blog-listing`, con rama de live preview y un script de migración idempotente bi-locale. Cubre PAGES-04. Primera de tres migraciones idénticas (54 blog, 55 case studies, 57 home).

## What Was Built

**Task 1 — Fundación (commit `566e007`)**
- `LatestBlogPosts` agregado al whitelist `content.layout.blocks` de Pages (cierra el hueco de esquema; Phase 55 hará lo análogo con `LatestCaseStudies`).
- `src/utilities/getPages.ts` (NUEVO): `getCachedPageBySlug(slug, depth=2, locale?)` espeja 1:1 a `getCachedGlobal`. `unstable_cache` con tag `pages_<slug>`, `overrideAccess:false` (solo docs publicados — nunca drafts en público), depth 2 (pobla media/posts de los bloques).
- `revalidatePage` afterChange extendido con `revalidateTag('pages_' + doc.slug)` (y `previousDoc.slug` en despublicación).

**Task 2 — Reescritura de `/blog` (commit `c6c7fb0`)**
- Swap de fuente: `getCachedPageBySlug('blog', 2, locale)` reemplaza `getCachedGlobal('blog-listing', 0, locale)` en `generateMetadata` y en el componente.
- Lee `page.content.layout` (no `page.layout`).
- Rama `draftMode()` cookie-gated con fetch draft-aware sin cachear (`queryBlogPageDraft`, react `cache()`, `draft:true`, `overrideAccess:true`, depth 2) + `<LivePreviewListener />`. Público usa solo la lectura cacheada por tag.
- Fallback null-safe: si la entrada Pages `blog` aún no existe (migración diferida), degrada a UI de fallback en vez de 500.
- Renderiza SOLO `content.layout` (sin `RenderHero`).
- `[slug]/generateStaticParams` excluye `blog` (`doc.slug !== 'home' && doc.slug !== 'blog'`).

**Task 3 — Script de migración (commit `4f66978`)**
- `src/scripts/migrate-blog-listing-to-page.ts` (NUEVO): Local API, idempotente por slug `blog`, upsert. Lee el global en `es` y `en`; escribe `title`/`content.layout`/`meta.description` en ambos locales (es create/update, en update sobre el mismo doc.id). `overrideAccess:true` + `context.disableRevalidate:true`. Deja el global intacto.
- `package.json`: script `migrate:blog-listing`.

## Verification Results

**`pnpm exec tsc --noEmit`**: 114 errores totales, TODOS en `tests/` (pre-existentes, fuera de scope). CERO errores nuevos en `src/`. El script nuevo y todos los archivos modificados compilan limpio.

**`pnpm generate:types`**: diff acotado y esperado — se agregó el miembro `LatestBlogPostsBlock` a la union de `pages.content.layout` y a `PagesSelect`. Las interfaces `LatestBlogPostsBlock` / `LatestBlogPostsBlockSelect` solo se reubicaron en el archivo (ahora se referencian primero desde Pages en vez del global). Diff exacto:

```diff
 export interface Page {
       | PostsGridBlock
+      | LatestBlogPostsBlock
       | CaseStudiesGridBlock
 export interface PagesSelect {
               postsGrid?: T | PostsGridBlockSelect<T>;
+              latestBlogPosts?: T | LatestBlogPostsBlockSelect<T>;
               caseStudiesGrid?: T | CaseStudiesGridBlockSelect<T>;
```
(más el reordenamiento de las definiciones `LatestBlogPostsBlock`/`_select` hacia arriba). Ningún otro cambio de esquema.

**Greps de artefactos/key-links (los 3 tasks)**: OK. Sin `no-store`/`force-dynamic` en `/blog`. `pnpm build` NO ejecutado (tsc no lo forzó).

## Deviations from Plan

None — el plan se ejecutó exactamente como está escrito. Las decisiones abiertas del research (A3 live preview → sí agregar rama; description → meta.description; limpieza de ramas muertas → diferida a 58) ya estaban resueltas en el plan y se aplicaron tal cual.

## Deferred Human Steps (fuera de scope del executor)

1. **Ejecutar la migración de datos** (REQUIERE DB en vivo):
   ```
   pnpm migrate:blog-listing
   ```
   Requiere `DATABASE_URI` del `.env` (misma DB que la app). NO se ejecutó durante el execute (no se asume acceso del executor a la DB de producción). Idempotente: re-ejecutar hace upsert del mismo doc `slug:'blog'`. Hasta correrlo, `/blog` degrada al fallback null-safe sin 500.

2. **Orden de deploy**: mergear/deploy del código PRIMERO no es obligatorio, pero correr la migración contra la DB objetivo debe ocurrir ANTES de validar SC1–SC4 en esa URL. El global `blog-listing` queda intacto → rollback = revertir `blog/page.tsx` (o el commit `c6c7fb0`).

3. **Smoke / checks de verificación diferidos (deploy/humano)**:
   - **SC1** — Paridad visual es + en en `/blog` (bloques renderizados idénticos pre/post migración).
   - **SC2** — `x-vercel-cache: HIT` en `/blog` (ISR sin no-store) tras deploy.
   - **SC3** — `hreflang`, `canonical`, `<html lang>` correctos por locale en `/blog`.
   - **SC4** — Live preview de Payload sobre la Page `blog` (draft visible bajo cookie de preview; público permanece en ISR).

## Notes for Phases 55 / 57

El patrón es reusable tal cual: `getCachedPageBySlug` ya es genérico por slug. Phase 55 (case studies) debe agregar `LatestCaseStudies` al layout de Pages (hueco análogo), crear script `migrate-case-studies-listing-to-page.ts`, reescribir `/case-studies` y excluir `case-studies-listing`/su slug de `[slug]`. Phase 58 retira los globals y las ramas muertas de `[slug]/generateMetadata` (`blog-listing`, `case-studies-listing`).

## Self-Check: PASSED
- Archivos creados existen: `src/utilities/getPages.ts`, `src/scripts/migrate-blog-listing-to-page.ts` — FOUND.
- Commits existen: `566e007`, `c6c7fb0`, `4f66978` — FOUND.
