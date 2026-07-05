# Phase 56: Colección Authors - Research

**Researched:** 2026-07-05
**Domain:** Payload 3.61.1 collection design + relationship re-pointing + one-off data migration on production content (MongoDB)
**Confidence:** HIGH (all claims verified against the codebase; Payload/Mongo behavior CITED to official docs)

## Summary

Hoy "los autores" NO son una colección: son la colección de auth `users` (`src/collections/Users/index.ts`), que ya tiene `slug`, `bio`, `avatar`, `jobTitle`, `role`, `socialMedia`, `expertise`, `education`, `experience` y un tab SEO (`seoFields()` → `meta`, `og`, etc.). La relación vive en `Posts.authors` (`relationTo: 'users'`, `hasMany: true`, sidebar) más un espejo `populatedAuthors` (array readonly de `{id, name}`) que rellena el hook `populateAuthors.ts` porque `users` tiene el `read` bloqueado y GraphQL no puede exponerlo públicamente. [VERIFIED: codebase]

Hay **11 superficies** que leen autores hoy, y dos de ellas leen el objeto de relación COMPLETO (no solo `populatedAuthors`): `AuthorCard` en la página del post (`post.authors[0]` con avatar/slug/socialMedia) y ambas author pages. El adaptador es **`mongooseAdapter` (MongoDB)**, así que una relación `hasMany` se guarda como array de `ObjectId`s crudos; re-apuntar `relationTo` NO reescribe esos IDs, quedarían apuntando a documentos de la colección equivocada. [VERIFIED: codebase; CITED: payloadcms.com/docs/fields/relationship] Ese es exactamente el origen del hazard de ordenamiento.

**Primary recommendation:** Opción (ii) — campo aditivo. Crear la colección `Authors`, agregar un campo NUEVO `postAuthors` (`relationTo: 'authors'`, `hasMany`) en `Posts` JUNTO al `authors→users` existente, backfillear con un script idempotente (Local API, patrón `migrate-blog-listing-to-page.ts`), verificar paridad, y SOLO ENTONCES cambiar las lecturas y el hook. El campo viejo `authors→users` se deja intacto como rollback (se elimina en una fase posterior). Esto elimina por completo la ventana en la que un post podría quedarse sin autor.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTHORS-01 | `Authors` en admin bajo "Contenido", editable, con campos para reconstruir la author page | Ver "Campos de paridad" — replicar los campos de `Users` menos los de auth. Usar `ADMIN_GROUP.CONTENIDO`. |
| AUTHORS-02 | Un Post se relaciona con ≥1 Author vía campo relación, persiste al guardar | Campo `postAuthors` (`relationTo: 'authors'`, `hasMany`) — estrategia (ii) |
| AUTHORS-03 | Author page pública + `authors-sitemap` leen desde `Authors` con paridad de URLs | Slug carry-over verbatim; re-point de las 11 superficies de lectura tras backfill verificado |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Definición colección Authors | API / Backend (Payload config) | — | Es schema de Payload |
| Relación Post→Author | API / Backend | Database (Mongo) | Campo de relación + storage de ObjectIds |
| Migración de datos | Database (Local API script) | — | Reescribe docs de producción; corre con `getPayload` |
| Author page render | Frontend Server (RSC/ISR) | — | `payload.find` server-side, `revalidate = 3600` |
| authors-sitemap | Frontend Server (route handler) | — | `unstable_cache` + `getServerSideSitemap` |
| Slug/URL parity | API + Frontend | — | Slug lo define el doc, la ruta lo consume |

## Current State (verified)

### La relación y su espejo — `src/collections/Posts/index.ts` (~L260)
```ts
{ name: 'authors', type: 'relationship', relationTo: 'users', hasMany: true, admin: { position: 'sidebar' } },
{ name: 'populatedAuthors', type: 'array', access: { update: () => false },
  admin: { disabled: true, readOnly: true }, fields: [ {name:'id',type:'text'}, {name:'name',type:'text'} ] },
```
`populatedAuthors` lo rellena `src/collections/Posts/hooks/populateAuthors.ts` (un `afterRead` que hace `payload.findByID({ collection: 'users', depth: 0 })` por cada author y emite `{ id, name, slug }`). Existe porque `users` tiene `read: adminsAndUser` (bloqueado al público). [VERIFIED: codebase]

### Campos de `Users` hoy (tab "Perfil" + tab "SEO")
`name` (req), `role`, `jobTitle` (localized), `bio` (textarea, localized), `expertise` (array), `socialMedia` (group: linkedin/github/twitter/website), `education` (array con logo/certificate uploads), `credentials` (deprecado, oculto), `experience` (array), `avatar` (upload→media), `slug` (via `slugField()`, unique+index), `liveUrl` (ui), `primaryKeyword` (relación), **tab SEO** = `seoFields()` → `meta{title,description,keywords}`, `canonical`, `noindex`, `nofollow`, `og`, `twitter`, `seoScore`, `seoAnalysis`, `schema`. Auth-only: email/password (de `auth: true`), `ensureUniqueSlug` beforeChange. [VERIFIED: codebase]

### Los 11 consumidores de "autores" (superficie de impacto completa)

| # | Archivo | Qué lee | Rompe si… |
|---|---------|---------|-----------|
| 1 | `[locale]/authors/[slug]/page.tsx` | `find users` by slug (+ `generateStaticParams` de users); posts by `authors contains id` | ISR canónica; la que más importa |
| 2 | `[locale]/author/[slug]/page.tsx` | `find users` by slug/id; posts by `authors contains id` | Ruta legacy singular |
| 3 | `[locale]/authors/page.tsx` | `find users` (listado) | Grid de autores |
| 4 | `(sitemaps)/authors-sitemap.xml/route.ts` | `find users where slug exists` → /authors/{slug} + /en/… | Sitemap XML |
| 5 | `(frontend)/sitemap/page.tsx` (L76) | `find users` | Sitemap HTML |
| 6 | `blog/[category]/[slug]/page.tsx` (L195) → `AuthorCard` | **`post.authors[0]` resuelto COMPLETO** (avatar, slug, socialMedia) | Byline del post |
| 7 | `heros/PostHero/index.tsx` | `post.populatedAuthors` (name+slug) → `formatAuthors` | Byline del hero |
| 8 | `utilities/generateSchema.ts` (L58) | `populatedAuthors \|\| authors` (name) | JSON-LD author |
| 9 | `blocks/PostArticleHeader/config.ts` (L27) | campo propio `author` `relationTo: 'users'` | Bloque page-builder (fuera de scope directo) |
| 10 | `components/admin/LiveUrlLink.tsx` (L23) | `collection === 'users'` → `/authors/` | Link admin |
| 11 | `utilities/seo/keywordCoverageAudit.ts`, `scripts/*` | `collection: 'users'` | Herramientas internas |

**Insight crítico:** #6 (`AuthorCard`) y #1/#2 leen el objeto de relación resuelto por depth, NO `populatedAuthors`. Cualquier estrategia debe garantizar que el objeto resuelto tenga `avatar`, `slug`, `socialMedia`, `bio`, etc. — por eso la migración debe COPIAR esos campos a los Author docs, no solo re-apuntar IDs.

## User Constraints

_(No existe CONTEXT.md para esta fase todavía — este RESEARCH alimenta el discuss. El ROADMAP fija el Gate: "Confirmar cómo se resuelven hoy los autores (author page + sitemap) antes de introducir la colección" — resuelto arriba.)_

## Key Design Decisions

### A. Estrategia de relación — RECOMENDACIÓN: Opción (ii), campo aditivo

| | (i) Re-apuntar `authors` a `'authors'` | (ii) NUEVO campo `postAuthors→'authors'` (RECOMENDADA) |
|---|---|---|
| End state | Más limpio (un solo campo) | Requiere limpieza posterior (drop del viejo) |
| Riesgo en Mongo | ALTO: los ObjectIds guardados siguen apuntando a `users`; al cambiar `relationTo` Payload los resuelve contra `authors` y devuelve `null` → autores desaparecen hasta que la migración re-apunte | BAJO: `authors→users` sigue vivo y poblado todo el tiempo |
| Ventana de rotura | Existe entre deploy-schema y fin-de-migración | **Cero** |
| Cutover | Atómico y frágil | Gradual y reversible (feature-flag por lectura) |
| Rollback | Difícil (IDs ya reescritos) | Trivial (revertir lecturas; campo viejo intacto) |

**Justificación:** El adaptador es MongoDB; una relación `hasMany` a una sola colección se guarda como array de `ObjectId`s sin discriminador de colección. [CITED: payloadcms.com/docs/fields/relationship — "with a single relationTo, the value is stored as the related document ID"]. Cambiar `relationTo` NO migra esos IDs. Con la opción (i), en el instante en que el schema entra a producción antes de que la migración cree los Author docs y re-apunte, los 11 consumidores ven autores `null`. La opción (ii) mantiene `authors→users` como fuente viva hasta que `postAuthors` esté backfilleado y verificado; las lecturas solo cambian después. Es la única que preserva paridad con ordenamiento seguro.

**Cómo leen exactamente tras el cutover:**
- Author page + sitemap: `payload.find({ collection: 'authors', where: { slug: { equals } } })` y posts por `where: { postAuthors: { contains: authorId } }`. (Nota: `authorId` es el nuevo Author doc id, no el user id.)
- `AuthorCard` / PostHero / generateSchema: leen desde `postAuthors` resuelto y desde `populatedAuthors` (hook actualizado, ver D).

### B. Paridad de slug
Copiar `user.slug` **verbatim** al `author.slug` en la migración. La colección `Authors` usa `slugField()` (`unique`, `index`) igual que hoy; en la migración se setea `slug` explícito (el `beforeValidate` de `slugField` respeta un `value` string). Resultado: `/authors/{slug}`, `/en/authors/{slug}` y el sitemap NO cambian. [VERIFIED: `src/fields/slug.ts` respeta value explícito]

### C. Migración de datos (script one-off, Local API)
Patrón: clonar `src/scripts/migrate-blog-listing-to-page.ts` (dotenv → `getPayload({config})` → upsert idempotente por slug → `context: { disableRevalidate: true }` → deja la fuente INTACTA). Añadir npm script `"migrate:authors"` en `package.json` (junto a `migrate:blog-listing`). Pasos del script:
1. `find users` (los que califican, ver E), `depth: 0`.
2. Por cada user: `upsert` en `authors` por `slug` (idempotente) copiando name/slug/bio(es+en)/jobTitle/role/avatar/socialMedia/expertise/education/experience/meta. **Escribir ambos locales** (crear `es`, luego `update` `en` sobre el mismo doc — Payload escribe un locale por llamada). [CITED: payloadcms.com/docs/local-api/overview]
3. Construir mapa `userId → authorId`.
4. Paginar posts (batches de 50) y para cada uno setear `postAuthors = post.authors.map(id → map[id])` vía `payload.update`, con `disableRevalidate`.
5. Verificar: 0 posts con `authors.length > 0` pero `postAuthors` vacío; loguear RESULT JSON (como `update-author-profile.ts` / `verify-authors.ts`).
- **Idempotente**: re-correrlo no duplica (upsert por slug) ni pierde asociaciones.
- **NO** toca ni borra `users`. **RUN diferido a Juan** (necesita `DATABASE_URI` viva; `.env` existe localmente). Añadir un `verify-authors-collection.ts` espejo del `verify-authors.ts` actual.

### D. Hook `populatedAuthors`
Debe pasar a poblar desde `postAuthors → collection 'authors'` **en lockstep con el cutover de lecturas**. Si se deja como está (`findByID collection:'users'`) mientras las lecturas migran: no rompe de inmediato (los users siguen existiendo), pero si algún post solo tiene `postAuthors` y el campo viejo se vacía, `populatedAuthors` queda vacío → el byline de PostHero desaparece y `generateSchema` cae al fallback hardcodeado `'Juan Carlos Angulo'`. Regla: actualizar el hook y las lecturas en el mismo commit del cutover. La colección `authors` puede tener `read: () => true` (público, sin datos sensibles de auth), lo que además permitiría simplificar/retirar el espejo `populatedAuthors` a futuro — pero eso es limpieza posterior, no scope de esta fase.

### E. Qué Users se vuelven Authors
Superficie actual: el sitemap filtra `slug exists` y la author page requiere slug. Para paridad + cero pérdida de asociaciones, migrar la **unión** de: (a) users con `slug`, y (b) users referenciados por cualquier post (`authors`). En la práctica hoy es esencialmente 1 (Juan Carlos Angulo). Admins puros sin slug ni posts NO se migran. [VERIFIED: sitemap `where slug exists`; `update-author-profile.ts` confirma el user canónico `juan-carlos-angulo`]

### F. HAZARD DE ORDENAMIENTO (el riesgo #1)
**Qué sale mal:** Si el deploy del schema (campo re-apuntado, opción i) llega a producción ANTES de que la migración cree los Author docs y re-apunte los refs, TODOS los posts pierden su autor: bylines vacíos, JSON-LD author roto, `/authors/{slug}` en 404, `authors-sitemap` vacío, y Google podría re-crawlear en ese estado degradado.

**Cómo evitarlo (con la opción ii recomendada, el orden seguro es):**
1. Deploy: colección `Authors` + campo NUEVO `postAuthors` (aún sin usar). El viejo `authors→users` sigue siendo la fuente de verdad. **Nada cambia en el front.**
2. Juan corre `migrate:authors` contra prod → crea Authors + backfillea `postAuthors`.
3. Correr `verify-authors-collection` → confirmar 0 posts sin `postAuthors`, slugs y URLs idénticos.
4. Deploy del cutover: lecturas (11 superficies) + hook `populatedAuthors` pasan a `authors`/`postAuthors`, en un solo commit.
5. Fase posterior (no esta): eliminar campo `authors→users` y, si se decide, el espejo `populatedAuthors`.
- **Nunca** re-apuntar y desplegar el schema destructivo antes de que la data exista. **Nunca** vaciar el campo viejo en el mismo deploy que introduce el nuevo. Con la opción (ii) los pasos 1–3 son inocuos y reversibles; solo el paso 4 cambia comportamiento y ya opera sobre data verificada.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | MongoDB: `posts.authors` = array de ObjectIds → docs de `users`. Un doc por author-user (hoy ~1: `juan-carlos-angulo`) con name/slug/bio(es,en)/avatar/socialMedia/expertise/education/experience/meta | Data migration: crear Authors + backfill `postAuthors` (script diferido a Juan) |
| Live service config | Ninguno — no hay servicios externos que referencien el ID/slug del autor fuera del repo. Slugs de URL se preservan verbatim, así que GSC/sitemaps externos no cambian | None (verificado: solo Payload/Mongo) |
| OS-registered state | Ninguno — sin Task Scheduler/cron que referencie autores | None |
| Secrets/env vars | `DATABASE_URI` en `.env` (existe local) — requerido para correr la migración; no cambia | None (solo lectura para el run) |
| Build artifacts | `src/payload-types.ts` se regenera al añadir la colección/campo (`payload generate:types`). Refs a `populatedAuthors`/`relationTo:'users'` ahí son generadas | Regenerar types tras el cambio de schema |

## Standard Stack

Sin dependencias nuevas. Todo se hace con lo instalado: `payload@3.61.1`, `@payloadcms/db-mongodb@3.61.1`, `@payloadcms/next@3.61.1`, `next@15.2.8`, `tsx` (runner de scripts, ya usado en `package.json`). Reutilizar: `slugField()` (`@/fields/slug`), `seoFields()` (`@/utilities/seo/seoFields`), `ADMIN_GROUP.CONTENIDO` (`@/utilities/adminGroups`). [VERIFIED: package.json + codebase]

## Package Legitimacy Audit

N/A — esta fase no instala paquetes externos. Solo config de Payload + un script one-off con dependencias ya presentes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slug único/normalizado en Authors | Regex propio inline | `slugField()` + patrón `ensureUniqueSlug` de Users | Ya resuelto y usado en todo el repo |
| Campos SEO de la colección | Grupo meta manual | `seoFields()` | Paridad exacta con Users |
| Runner de migración | Script ad-hoc con conexión Mongo cruda | `getPayload({config})` Local API, patrón `migrate-blog-listing-to-page.ts` | Respeta hooks, access, locales, validación |
| Label de grupo admin | String inline `'Contenido'` | `ADMIN_GROUP.CONTENIDO` | Un typo crea un grupo fantasma sin error de compilación (ver comentario en `adminGroups.ts`) |
| Escritura bilingüe | Un solo `update` con ambos locales | Dos llamadas (es create, en update) con `disableRevalidate` | Payload escribe un locale por llamada |

## Common Pitfalls

### Pitfall 1: Re-apuntar `relationTo` esperando que Mongo migre los IDs
**Qué sale mal:** los ObjectIds guardados no se tocan; quedan apuntando a `users`. **Cómo evitar:** opción (ii) + migración explícita de refs. **Señal temprana:** author `null` en `depth>0`.

### Pitfall 2: Cutover de lecturas antes de verificar el backfill
**Qué sale mal:** posts sin `postAuthors` → bylines vacíos / 404. **Cómo evitar:** paso 3 (verify) obligatorio antes del paso 4. **Señal:** `verify` reporta >0 posts sin `postAuthors`.

### Pitfall 3: Olvidar `generateStaticParams` en `authors/[slug]/page.tsx`
Genera params desde `find users`. Si no se migra a `authors`, las páginas ISR se prerenderean desde la fuente vieja. **Evitar:** incluirla en las 11 superficies del cutover.

### Pitfall 4: `AuthorCard` y author pages leen el objeto resuelto, no `populatedAuthors`
Si los Author docs no copian `avatar`/`socialMedia`/`bio`, el byline y la página quedan incompletos aunque el nombre exista. **Evitar:** copiar TODOS los campos de paridad en la migración.

### Pitfall 5: Bloque `PostArticleHeader.author` (`relationTo:'users'`)
Es un campo independiente de page-builder, no `Posts.authors`. Cambiarlo está FUERA del scope de paridad de la author page/sitemap. **Recomendación:** dejarlo en `users` en esta fase y anotarlo como deferred; re-apuntarlo requeriría su propia migración de bloques.

## Campos de paridad para la colección `Authors`

Replicar de `Users` (tab Perfil + tab SEO), **excluyendo** todo lo de auth (`auth: true`, email/password), `role`-como-access-controlado (mantener `role` como texto simple), `liveUrl`/`primaryKeyword` (opcionales), `credentials` (deprecado). Incluir: `name` (req), `slug` (`slugField`, unique+index), `bio` (localized), `jobTitle` (localized), `role`, `avatar` (upload→media), `socialMedia` (group), `expertise` (array), `education` (array), `experience` (array), tab SEO `seoFields()`. `admin.group = ADMIN_GROUP.CONTENIDO`, `admin.useAsTitle = 'name'`, `admin.defaultColumns = ['name','slug']`. `access.read` puede ser público (`() => true`) — no hay datos sensibles — lo que evita el problema de privacidad que motivó `populatedAuthors`.

## Validation Architecture

Framework: Vitest (excludes configurados; ver memoria build-deploy-caveats). Verificación de esta fase es mayormente funcional/manual + script:
- **Script de verificación** `verify-authors-collection.ts` (espejo de `verify-authors.ts`): 0 posts con autor perdido; conteo Authors == users migrados; slugs idénticos.
- **Paridad de URLs**: diff del output de `authors-sitemap.xml` antes/después (mismas locs).
- **Render**: `/authors/{slug}` y `/en/authors/{slug}` muestran name/bio/avatar/posts idénticos; byline del post intacto.
- **Types**: `payload generate:types` sin errores; build type-check verde.
No requiere framework nuevo. Wave 0: añadir `verify-authors-collection.ts` y npm script `migrate:authors`.

## Security Domain

Bajo impacto. La única categoría relevante: **V4 Access Control** — la colección `Authors` NO debe heredar el `read` bloqueado de `users` (eso es para proteger credenciales de auth); Authors es contenido público, `read: () => true` es correcto y elimina la necesidad del workaround `populatedAuthors`. No se exponen email/password (no se migran). Sin entrada de usuario nueva más allá del admin autenticado. V5/V6 no aplican (sin nuevos endpoints ni cripto).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| MongoDB (`DATABASE_URI`) | Migración | ✓ (`.env` presente) | — | Ninguno — el RUN lo hace Juan |
| tsx | Runner del script | ✓ | (en package.json) | — |
| payload CLI (`generate:types`) | Regenerar types | ✓ | 3.61.1 | — |

**Sin fallback bloqueante para el código** (la fase de código no depende de correr la migración). El RUN de la migración se difiere a Juan (necesita prod DB).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | En prod hay esencialmente 1 author-user (`juan-carlos-angulo`); la migración es de bajo volumen | E, Runtime Inventory | Bajo — el script pagina y es idempotente; escala igual |
| A2 | Ningún servicio externo referencia el user ID/slug fuera del repo | Runtime Inventory (Live service config) | Medio — si algún tag/dashboard externo usa el slug y el slug se preserva, no rompe igual |
| A3 | `PostArticleHeader.author` se deja fuera de scope | Pitfall 5 | Bajo — es un bloque opcional; si Juan lo usa con autores, discutir en discuss-phase |

## Open Questions

1. **¿Retirar `populatedAuthors` en esta fase o después?**
   - Sabemos: con `Authors.read` público ya no se necesita el workaround.
   - Incierto: PostHero/generateSchema aún lo consumen; retirarlo amplía el scope.
   - Recomendación: mantenerlo esta fase (poblado desde `authors`), retirarlo en la fase de limpieza junto al drop de `authors→users`.
2. **¿Re-apuntar el bloque `PostArticleHeader.author`?** Recomendación: deferir (ver Pitfall 5).

## Sources

### Primary (HIGH)
- Codebase (VERIFIED): `Posts/index.ts`, `Posts/hooks/populateAuthors.ts`, `Users/index.ts`, `fields/slug.ts`, `utilities/seo/seoFields.ts`, `utilities/adminGroups.ts`, ambas author pages, `authors-sitemap.xml/route.ts`, `sitemap/page.tsx`, `AuthorCard`, `PostHero`, `generateSchema.ts`, `formatAuthors.ts`, `PostArticleHeader/config.ts`, `scripts/migrate-blog-listing-to-page.ts`, `scripts/update-author-profile.ts`, `scripts/verify-authors.ts`, `payload.config.ts` (mongooseAdapter), `package.json`
- Payload docs (CITED): payloadcms.com/docs/fields/relationship; /docs/local-api/overview

### Metadata
**Confidence breakdown:** Current state HIGH (leído directo). Relationship strategy HIGH (Mongo storage semantics + 11 consumidores mapeados). Migration pattern HIGH (patrón existente en repo). Ordering hazard HIGH.
**Research date:** 2026-07-05 · **Valid until:** 2026-08-04 (estable; depende de Payload 3.61.1)
