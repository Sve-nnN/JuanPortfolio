# Phase 54: Migración del listado de blog a Pages - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — decisiones basadas en 54-RESEARCH.md

<domain>
## Phase Boundary

La ruta pública del listado de blog (`/[locale]/blog`) deja de leer el GLOBAL `blog-listing` y pasa a leer una entrada editable de la colección `Pages` (slug `blog`), preservando paridad visual, ISR/edge-cache, hreflang/canonical/lang y live preview. Cubre PAGES-04.

El global `blog-listing` NO se elimina en esta fase (rollback instantáneo); su retiro es Phase 58. Define el patrón reusable para Phases 55 (case studies) y 57 (home).
</domain>

<decisions>
## Implementation Decisions

### 1. Mecanismo de lectura — util cacheada por tag (DECISIÓN CENTRAL)
Crear `getCachedPageBySlug(slug, depth, locale)` que refleje 1:1 a `getCachedGlobal`: `payload.find({ collection: 'pages', where: { slug }, locale })` envuelto en `unstable_cache` con tag `pages_<slug>` (p.ej. `pages_blog`). `/blog` lo consume en lugar de `getCachedGlobal('blog-listing')`, leyendo `page.layout` (o `page.content.layout`, según el campo real de Pages — el plan confirma el path exacto). **NO** usar invalidación solo por `revalidatePath`: la caché por tag es lo que conserva `x-vercel-cache: HIT`/ISR sin `no-store`, y es el patrón que heredan 55/57.

### 2. Identidad — slug fijo `blog`
La entrada de Pages del listado se identifica por slug `blog`. No colisiona: las rutas de carpeta (`/blog`, igual que `/contact`, `/privacy`, `/terms`) sombrean a `[slug]`, y `[slug]/generateStaticParams` ya filtra slugs reservados. Confirmar en el plan que `blog` quede excluido de `[slug]` (evitar doble render / params duplicados). Las ramas muertas de `blog-listing` en `[slug]/page.tsx` se pueden limpiar aquí o diferir a 58 — el plan decide (preferencia: limpiar ahora si es trivial).

### 3. Hueco de esquema — agregar `LatestBlogPosts` a Pages
`pages.layout` NO incluye el bloque `LatestBlogPosts` (el global sí lo ofrece). Agregar `LatestBlogPosts` a los `blocks` del layout de `Pages` y correr `generate:types`. (Phase 55 tendrá el hueco análogo con `LatestCaseStudies` — anotarlo.) `content.layout` es `required`: la entrada migrada debe traer layout no vacío.

### 4. Migración de datos — script one-off idempotente, ambos locales
Script con Local API (`getPayload`) que:
- Busca/crea la Page slug `blog` (idempotente por slug — si ya existe, update).
- Copia `title`, `description` y `layout` desde el global `blog-listing` para `es` (create) y `en` (update sobre el mismo doc), preservando localización.
- Usa `context: { disableRevalidate: true }` para no disparar hooks en la migración.
- Deja el global `blog-listing` intacto (retiro en Phase 58 → rollback instantáneo si algo falla).
- Ubicar en `scripts/` siguiendo la convención existente de scripts del repo. Ejecutable con el runner del proyecto (confirmar en el plan: tsx/pnpm script).

### 5. Revalidación — tag en revalidatePage
El hook `afterChange` de `Pages` (`revalidatePage`) debe hacer `revalidateTag('pages_' + doc.slug)` además de su `revalidatePath` actual, para que editar la Page `blog` invalide la util cacheada. Verificar que también cubra `/blog` (y no haga falta tocar `/blog/page/*` ni `/blog/[category]` porque esas rutas NO leen el listing header — confirmado en research: sin acoplamiento).

### 6. Live preview / draftMode
`/blog` debe renderizar contenido draft cuando hay cookie de preview (gated por `draftMode()`), igual que `[slug]/page.tsx`, para que el live preview de Payload sobre la Page `blog` funcione. Público sigue en ISR. `generatePreviewPath` de Pages ya apunta a `/blog` para esta entrada (confirmar). Resolver la pregunta abierta A3 del research: agregar rama `draftMode()` en `/blog` que use un fetch sin caché (o `getCachedPageBySlug` bypasseado) solo bajo preview.

### 7. hreflang/canonical/lang
`generateMeta` es independiente de la fuente (global vs page) → no regresa. El plan igual verifica que la metadata de `/blog` siga emitiendo hreflang/canonical/`<html lang>` correctos por locale tras el swap.
</decisions>

<code_context>
## Existing Code Insights

- `src/globals/BlogListing/config.ts` — fields: `title` (text, localized), `description` (textarea, localized), `layout` (blocks: ListingHero, PostsGrid, LatestBlogPosts, BlogArchiveHeader). Hook `revalidateBlogListing`.
- `src/app/(frontend)/[locale]/blog/page.tsx` — lee `getCachedGlobal('blog-listing', 0, locale)` (2 sitios: L39, L49) y renderiza sus bloques.
- `/blog/page/[pageNumber]` y `/blog/[category]` — NO leen el listing header (sin acoplamiento; no se tocan).
- `src/utilities/getGlobals.ts` — `getCachedGlobal` (patrón a reflejar en `getCachedPageBySlug`).
- `src/collections/Pages/index.ts` — layout blocks NO incluye `LatestBlogPosts`; `content.layout` required. livePreview vía `generatePreviewPath`. Hook `revalidatePage`.
- `src/collections/Pages/hooks/revalidatePage.ts` — extender con `revalidateTag('pages_'+slug)`.
- `[slug]/page.tsx` — tiene ramas muertas para `blog-listing` y filtra slugs en generateStaticParams.

Ver `.planning/phases/54-migracion-del-listado-de-blog-a-pages/54-RESEARCH.md` para el detalle completo.
</code_context>

<specifics>
## Specific Ideas

- Nuevo: `src/utilities/getPageBySlug.ts` (o añadir a getGlobals) con `getCachedPageBySlug` (tag `pages_<slug>`).
- Editar `Pages` layout: agregar `LatestBlogPosts`. `generate:types`.
- Editar `revalidatePage` hook: `revalidateTag`.
- Editar `/blog/page.tsx`: swap de fuente + rama draftMode.
- Nuevo script: `scripts/migrate-blog-listing-to-pages.ts` (idempotente, ambos locales, disableRevalidate).
- Gate: `pnpm exec tsc --noEmit` sin nuevos errores en `src/`; `generate:types` con el diff esperado (nuevo bloque en pages). Paridad visual + ISR + hreflang + live preview = check humano/deploy diferido.
</specifics>

<deferred>
## Deferred Ideas

- Retiro del global `blog-listing` y limpieza de ramas muertas en `[slug]` → Phase 58 (o limpieza trivial aquí si el plan lo ve seguro).
- Confirmación en deploy: `x-vercel-cache: HIT` en `/blog`, paridad visual es/en, live preview funcional. Smoke humano en batch.
- El mismo patrón (`getCachedPageBySlug` + migración + bloque Latest*) se replica en 55 (case studies) y 57 (home).
</deferred>
