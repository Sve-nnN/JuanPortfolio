# Phase 56: Colección Authors - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) + decisiones de Juan (estrategia de relación y cutover)

<domain>
## Phase Boundary

Introducir una colección `Authors` dedicada (separada de `users` auth), relacionable con `Posts`, y hacer que la author page pública y el `authors-sitemap` la consuman preservando la paridad de datos e URLs actuales. Cubre AUTHORS-01/02/03.

Enfoque NO destructivo: se ADICIONA infraestructura; el campo viejo `authors→users` y el fallback temporal se retiran recién en Phase 58.
</domain>

<decisions>
## Implementation Decisions (confirmadas por Juan)

### 1. Estrategia de relación — ADITIVA (Juan)
Agregar a `Posts` un campo NUEVO `postAuthors` (`relationTo: 'authors'`, `hasMany: true`) JUNTO al `authors` (`relationTo: 'users'`) existente. NO cambiar `relationTo` del campo viejo (en MongoDB los ObjectIds guardados no se re-mapean → romperían los consumidores). El campo `authors→users` queda como fuente viva / rollback hasta Phase 58.

### 2. Cutover de lecturas — CON FALLBACK a users (Juan)
Las superficies que muestran autores leen primero desde `Authors` (vía `postAuthors`), y si no hay match (migración no corrida aún, o post sin postAuthors) caen a la relación vieja `authors→users`. Así UN SOLO deploy es seguro sin importar cuándo Juan corra la migración. El fallback se elimina en Phase 58.
- Author page (`/authors/[slug]` y `/author/[slug]`): resolver por slug contra `collection: 'authors'`; si no existe, fallback a `users` by slug (comportamiento actual).
- Sitemap: derivar URLs de `authors` (by slug); si `authors` está vacío, fallback a `users` — garantiza paridad aunque la migración no haya corrido.
- Consumidores de objeto de relación completo (AuthorCard en post, JSON-LD, PostArticleHeader donde aplique): resolver el/los autores de un post preferentemente desde `postAuthors`; si vacío, desde `authors` (users). Encapsular en un helper reusable `resolvePostAuthors(post)` para no duplicar la lógica de fallback en 11 sitios.

### 3. Colección Authors — campos (paridad con Users author-facing)
Replicar de `Users` los campos NO-auth necesarios para reconstruir la author page: `name`, `slug` (verbatim, para preservar `/authors/{slug}`), `bio`, `avatar`, `jobTitle`, `socialMedia`, `expertise`, `education`, `experience`, y el tab/grupo SEO (`meta`). `access.read: () => true` (público — elimina la razón del workaround `populatedAuthors`). `admin.group: ADMIN_GROUP.CONTENIDO`. `useAsTitle: 'name'`. Sin campos de auth. Confirmar la lista EXACTA de campos leyendo `src/collections/Users/*` en el plan.

### 4. Slug parity
El slug de cada Author se copia VERBATIM del User correspondiente → `/authors/{slug}` y el `authors-sitemap` no cambian de URLs. AUTHORS-03 (paridad) depende de esto.

### 5. Migración de datos — script idempotente (RUN diferido a Juan)
`src/scripts/migrate-authors.ts` (Local API, patrón de `migrate-blog-listing-to-page.ts`):
- Seleccionar Users a migrar = UNIÓN de (Users con `slug`) ∪ (Users referenciados por algún Post en `authors`). (Hoy ~1: `juan-carlos-angulo`.)
- Crear un Author por cada uno copiando todos los campos (ambos locales para los localizados), slug verbatim. Idempotente por slug (si existe, update).
- Construir el mapa `oldUserId → newAuthorId` y backfillear `Posts.postAuthors` con los authors correspondientes (idempotente).
- `context: { disableRevalidate: true }`. NO tocar `users`. npm script `migrate:authors`.
- RUN diferido a Juan (necesita `DATABASE_URI` prod).

### 6. Verificación de datos — script
`src/scripts/verify-authors-collection.ts` (npm `verify:authors`): confirma 0 posts (con autor viejo) sin `postAuthors`, y que cada Author tiene una URL `/authors/{slug}` equivalente a la que ya existía. RUN diferido a Juan, post-migración.

### 7. populatedAuthors + hook
`populatedAuthors` (array espejo readonly) y su hook `populateAuthors` se actualizan en lockstep con el cutover para preferir `postAuthors` y caer a `authors`. Mantener el campo (no romper nada que lo lea). Confirmar el hook exacto en el plan.

### 8. Fuera de scope / diferido a Phase 58
- Retiro del campo `authors→users`, del fallback a users, y de `populatedAuthors` si queda huérfano.
- El `PostArticleHeader.author` (`relationTo: 'users'`) — evaluar en el plan si entra en el cutover con fallback o se difiere a 58; preferencia: incluirlo en el helper con fallback si es de bajo costo.
</decisions>

<code_context>
## Existing Code Insights

- `src/collections/Posts/index.ts:~261` — `authors` (relationship → users, hasMany) + `populatedAuthors` (array id/name, readonly) poblado por hook.
- Hook de populate: `src/collections/Posts/hooks/populateAuthors.ts` (confirmar nombre exacto).
- `src/app/(frontend)/[locale]/author/[slug]/page.tsx` — `queryUserBySlug` (collection users) + `queryPostsByAuthor` (`authors contains id`).
- `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` y `/authors/page.tsx` — confirmar queries.
- `src/app/(frontend)/(sitemaps)/authors-sitemap.xml/route.ts` — query `users` by slug → `/authors/{slug}` + `/en/authors/{slug}`; cacheado con tag `authors-sitemap`.
- `src/collections/Users/*` — campos author-facing a replicar (name, slug, bio, avatar, jobTitle, socialMedia, expertise, education, experience, meta/SEO).
- `AuthorCard` (en el post) y JSON-LD — leen el objeto de relación completo (avatar/slug/socialMedia).
- `ADMIN_GROUP.CONTENIDO` en `src/utilities/adminGroups.ts`.

Detalle completo de las 11 superficies + adaptador MongoDB en `.planning/phases/56-coleccion-authors/56-RESEARCH.md`.
</code_context>

<specifics>
## Specific Ideas

- Nueva colección `src/collections/Authors/index.ts` + registrar en `src/payload.config.ts` (collections array).
- Posts: agregar `postAuthors`. `generate:types` (diff esperado: nueva colección + campo).
- Helper `resolvePostAuthors(post)` con fallback authors→users.
- Cutover de las 11 lecturas (author page x2, authors listing, sitemap, AuthorCard, JSON-LD, PostArticleHeader si aplica) usando el helper / query a `authors` con fallback.
- Scripts `migrate:authors` + `verify:authors` (RUN diferido).
- Gate: `pnpm exec tsc --noEmit` sin nuevos errores en `src/`; `generate:types` diff acotado. Paridad visual/SEO + correr migración = diferido a Juan.
</specifics>

<deferred>
## Deferred Ideas

- Correr `pnpm migrate:authors` y luego `pnpm verify:authors` (DB viva).
- Smoke: `/authors`, `/authors/{slug}` es+en, JSON-LD del post, AuthorCard, `authors-sitemap.xml` — paridad con lo actual.
- Phase 58: retirar campo `authors→users`, fallback a users, y limpiar populatedAuthors.
</deferred>
