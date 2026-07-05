# Phase 57: Migración de Home a Pages - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — superficie de MAYOR riesgo del milestone

<domain>
## Phase Boundary

La Home (`/` es, `/en` en) deja de leer el GLOBAL `home` (vía `payload.findGlobal({slug:'home'})`) y pasa a leer una entrada editable de `Pages` (slug `home`, campo `content.layout`), preservando paridad visual, ISR/edge-cache, hreflang/canonical/lang y live preview. Cubre PAGES-03. El global `home` NO se elimina aquí (Phase 58). Reusa el patrón de 54/55 con fallback (deploy único seguro).
</domain>

<decisions>
## Implementation Decisions

### 1. Entry point único: la rama `slug === 'home'` en `[slug]/page.tsx`
`[locale]/page.tsx` (root) solo re-exporta `PageTemplate` + `generateMetadata` de `[slug]/page.tsx` (con su propio `generateStaticParams` es/en + `revalidate=3600`). Por lo tanto el cambio se concentra en las DOS ramas `if (slug === 'home')` de `[slug]/page.tsx`: el componente `Page` (L89) y `generateMetadata` (L169). No se toca `[locale]/page.tsx`.

### 2. Lectura desde Pages con FALLBACK al global `home`
Reemplazar `payload.findGlobal({slug:'home'})` por `getCachedPageBySlug('home', 2, locale)` (reusar util de 54). Si la Page `home` no existe (migración no corrida) → **fallback al global `home`** (comportamiento actual). Así `/` sigue funcionando idéntico pre-migración y un solo deploy es seguro. El fallback se retira en Phase 58.
- El render debe seguir siendo el mismo path visual: `<JsonLd isHome blocks={layout}>` + `<HomePage>` + hero. Extraer `layout` de `page.content.layout` (Page) o `homeGlobal.layout` (fallback) hacia una variable común.
- `HomePage` hoy recibe `{ homeGlobal: Home, locale }` y usa `homeGlobal.layout`. Adaptar mínimamente: pasar un shim `{ layout }` o refactor liviano para aceptar `layout` directo, sin cambiar el render (RenderBlocks). El plan elige la forma de menor riesgo.
- `generateMetadata` (L169): leer meta desde la Page `home` con fallback al global.

### 3. Bloques faltantes en Pages layout
El `home.layout` usa bloques que Pages `content.layout` puede NO permitir → Payload rechazaría el doc migrado. Gaps detectados: **FAQ, TestimonialsCarousel** (Pages no los importa). Confirmar en el plan si **CalendlyEmbed** ya está en el array de Pages (está importado). Agregar a `Pages.content.layout` los bloques de Home que falten (FAQ, TestimonialsCarousel, y CalendlyEmbed si falta). `generate:types` → diff acotado a esos bloques.

### 4. Live preview de la Home
La Page `home` debe previsualizarse en `/` (no `/home`). `generatePreviewPath` hoy arma `path = prefix + collectionPrefixMap['pages'] + '/' + slug`. Agregar un caso especial: si `collection==='pages'` y `slug==='home'` → `path = localePrefix || '/'`. Así el live preview de la entrada `home` apunta a la home real. `draftMode()` ya está en la rama.

### 5. generateStaticParams
`[slug]/generateStaticParams` ya excluye `home`/`blog`/`case-studies` del loop de pages y re-agrega `home` para ambos locales manualmente. Tras la migración, `home` existe como Page: MANTENER la exclusión + el push manual (evita doble param). Confirmar que no se duplique. `[locale]/page.tsx` mantiene su `generateStaticParams` es/en.

### 6. Migración de datos — script idempotente (RUN diferido a Juan)
`src/scripts/migrate-home-to-page.ts` (patrón de `migrate-blog-listing-to-page.ts`): crear/actualizar Page slug `home`, copiar `home.layout` → `page.content.layout` para ambos locales (es create / en update), title/description si aplica, `disableRevalidate`, global intacto. npm `migrate:home`. RUN diferido (DB viva).

### 7. Revalidación
`revalidatePage` ya hace `revalidateTag('pages_home')`. Confirmar que editar la Page `home` invalide `/` (paths `/` y `/en`). Si `revalidatePage` revalida por `/${slug}`, agregar el caso home→`/`.
</decisions>

<code_context>
## Existing Code Insights

- `src/app/(frontend)/[locale]/page.tsx` — re-exporta `PageTemplate` + `generateMetadata` de `./[slug]/page`; `generateStaticParams` es/en; `revalidate=3600`.
- `src/app/(frontend)/[locale]/[slug]/page.tsx` — ramas `slug==='home'` en `Page` (L89-113, `payload.findGlobal`) y `generateMetadata` (L169-175). Render: `JsonLd isHome`, `HomePage homeGlobal`, hero. Importa `HomePage from '../home/HomePage'`.
- `src/app/(frontend)/[locale]/home/HomePage.tsx` — `({ homeGlobal: Home, locale })`, usa `homeGlobal.layout`, maneja legacy localized layout, render `RenderBlocks`.
- `src/globals/Home/config.ts` — field `layout` (required); bloques: HeroHome, AboutSection, AboutWithFeatures, FeaturedWorks, FeaturedClients, FeaturedBlog, FAQ, FeaturedBlogPosts, FeaturedCaseStudies, ContactFormBlock, TestimonialSection, ResultsSection, LatestBlogPosts, LatestCaseStudies, TestimonialsCarousel, CalendlyEmbed, CallToAction, Content.
- `src/collections/Pages/index.ts:153+` — `content.layout` blocks (incluye HeroHome, AboutSection, ..., Section, CallToAction, Content, MediaBlock, Archive, y CalendlyEmbed importado). NO incluye FAQ ni TestimonialsCarousel.
- `src/utilities/getPages.ts` — `getCachedPageBySlug` (reusar).
- `src/utilities/generatePreviewPath.ts` — necesita caso home→`/`.
- `src/collections/Pages/hooks/revalidatePage.ts` — revalidateTag + revalidatePath (confirmar cobertura de `/`).
</code_context>

<specifics>
## Specific Ideas

- Agregar FAQ + TestimonialsCarousel (y CalendlyEmbed si falta) a Pages `content.layout`. `generate:types`.
- Swap de las 2 ramas home en `[slug]/page.tsx` a `getCachedPageBySlug('home')` con fallback al global.
- Ajustar `HomePage` para recibir `layout` (shim o prop), sin cambiar render.
- `generatePreviewPath`: caso `pages` + `home` → `/`.
- `revalidatePage`: asegurar que `home` invalide `/` y `/en`.
- Script `migrate:home` (RUN diferido).
- Gate: `pnpm exec tsc --noEmit` sin nuevos errores en `src/`; `generate:types` diff acotado. Paridad/ISR/hreflang/live-preview + correr migración = diferido.
</specifics>

<deferred>
## Deferred Ideas

- Correr `pnpm migrate:home` (DB viva).
- Smoke deploy: `/` (es) y `/en` — paridad visual pixel, `x-vercel-cache: HIT`, hreflang/canonical/lang, live preview sobre la Page `home`.
- Phase 58: retirar el global `home`, el fallback, y limpiar la rama especial si se simplifica (home podría pasar a leer como page normal).
</deferred>
