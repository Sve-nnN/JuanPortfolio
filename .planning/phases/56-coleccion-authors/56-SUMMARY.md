---
phase: 56-coleccion-authors
plan: 01
subsystem: content-authoring
tags: [payload, collections, migration, seo, e-e-a-t]
requires: [Posts.authors→users, populatedAuthors hook, slugField, seoFields, ADMIN_GROUP]
provides: [Authors collection, Posts.postAuthors, resolvePostAuthors helper, migrate:authors, verify:authors]
affects: [author pages, authors-sitemap, sitemap HTML, blog post byline, JSON-LD author, admin LiveUrlLink]
tech-stack:
  added: []
  patterns: [additive-relationship, read-cutover-with-fallback, idempotent-local-api-migration]
key-files:
  created:
    - src/collections/Authors/index.ts
    - src/utilities/resolvePostAuthors.ts
    - src/scripts/migrate-authors.ts
    - src/scripts/verify-authors-collection.ts
  modified:
    - src/payload.config.ts
    - src/collections/Posts/index.ts
    - src/collections/Posts/hooks/populateAuthors.ts
    - src/payload-types.ts
    - src/app/(frontend)/[locale]/authors/[slug]/page.tsx
    - src/app/(frontend)/[locale]/author/[slug]/page.tsx
    - src/app/(frontend)/[locale]/authors/page.tsx
    - src/app/(frontend)/(sitemaps)/authors-sitemap.xml/route.ts
    - src/app/(frontend)/sitemap/page.tsx
    - src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx
    - src/components/AuthorCard/index.tsx
    - src/components/admin/LiveUrlLink.tsx
    - package.json
decisions:
  - "Additive postAuthors field (relationTo authors) alongside untouched authors→users — zero breakage window in MongoDB"
  - "Every read prefers Authors, falls back to users — single deploy safe whether or not the migration has run"
  - "Authors.read: () => true (public, no auth data) — removes the privacy reason for populatedAuthors"
  - "Migration + verify RUN deferred to Juan (needs live DATABASE_URI)"
metrics:
  duration: ~15m
  completed: 2026-07-05
  tasks: 5
  files: 18
---

# Phase 56 Plan 01: Colección Authors Summary

Colección `Authors` pública desacoplada de `users`, relacionada con Posts vía el campo aditivo `postAuthors`, con las 9 superficies de lectura en scope cutoverizadas para preferir Authors y caer a users — un solo deploy es seguro corra o no la migración (diferida a Juan).

## What Was Built

**Task 1 — Authors collection + postAuthors + types** (`78663ba`)
- `src/collections/Authors/index.ts`: colección pública (`read: () => true`), grupo admin Contenido, `useAsTitle: 'name'`, tab Perfil con paridad verbatim de campos author-facing de Users (name, role como texto simple sin access, jobTitle, bio, expertise, socialMedia, education, experience, avatar, `slugField('name')`) + tab SEO (`seoFields()`). Excluye auth/credentials/liveUrl/primaryKeyword/ensureUniqueSlug.
- Registrada en `payload.config.ts` después de Users.
- Campo `postAuthors` (relationTo authors, hasMany) agregado en Posts entre `authors` y `populatedAuthors`. El campo `authors→users` NO se tocó.
- `payload-types.ts` regenerado: diff 100% aditivo (interface `Author`, `AuthorsSelect`, `postAuthors` en Post, entrada `authors` en el registro). 0 líneas removidas.

**Task 2 — resolvePostAuthors helper** (`194d1bc`)
- `src/utilities/resolvePostAuthors.ts`: helper puro que exporta `resolvePostAuthors` + `NormalizedAuthor`. Prefiere `postAuthors` resueltos como objeto, cae a `authors` (users), normaliza a una sola shape. Input laxo acepta User y Author sin fricción de tipos.

**Task 3 — cutover de 11 superficies + hook** (`f8b1d6c`)
- #1 `authors/[slug]/page.tsx`: `generateStaticParams` une slugs de authors+users (dedupe); resolver por slug prefiere authors, cae a users, devuelve `{ doc, source }`; posts por `postAuthors contains` (authors) o `authors contains` (users).
- #2 `author/[slug]/page.tsx` (legacy): mismo patrón; generateMetadata también usa el resolver.
- #3 `authors/page.tsx`: `getAuthors` prefiere authors, cae a users si vacío.
- #4 `authors-sitemap.xml/route.ts`: prefiere authors (`slug exists`), cae a users; URLs idénticas por slug verbatim; tag `authors-sitemap` intacto.
- #5 `sitemap/page.tsx`: query authors, fallback a users; render por id/slug/name sin cambio.
- #6 `blog/[category]/[slug]/page.tsx` + `AuthorCard`: byline usa `resolvePostAuthors(post)[0]`; prop type de AuthorCard → `NormalizedAuthor` (JSX intacto).
- #7 PostHero: sin cambio directo, cubierto por el hook.
- #8 `generateSchema.ts`: sin cambio (populatedAuthors lo repuebla el hook).
- #10 `LiveUrlLink.tsx`: detecta `authors` → `/authors/` (rama `users` conservada).
- Hook `populateAuthors`: prefiere `postAuthors`→collection authors, cae a `authors`→users, misma shape `{id,name,slug}`.

**Task 4 — scripts de migración/verificación** (`2cf7fd2`)
- `migrate-authors.ts`: idempotente (upsert por slug), unión users-con-slug ∪ users-referenciados-por-posts, escribe ambos locales (es create/update + en update), backfill de `postAuthors`, `disableRevalidate`, NO toca users/authors→users, loguea RESULT JSON.
- `verify-authors-collection.ts`: 0 posts publicados con autor viejo y postAuthors vacío, conteo authors==users elegibles, paridad de slugs.
- `package.json`: `migrate:authors` + `verify:authors`.

**Task 5 — gate de tipos** (`f8b1d6c`/verificado)
- `pnpm exec tsc --noEmit`: 114 errores totales, TODOS pre-existentes en `tests/`, **0 en `src/`** (baseline confirmado antes de empezar).
- `pnpm generate:types`: idempotente en la segunda corrida (sin diff), diff acotado a Author + postAuthors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cast de tipos en escrituras de la migración**
- **Found during:** Task 4
- **Issue:** `payload.create({ collection: 'authors', data })` con `data: Record<string, unknown>` no satisface el genérico `Options<'authors', AuthorsSelect>` (create exige campos requeridos como `name`).
- **Fix:** Cast `as any` en los 3 puntos de escritura (esData, en-update, posts-update) con `// eslint-disable-next-line`, replicando exactamente el patrón del script de referencia `migrate-blog-listing-to-page.ts`.
- **Files modified:** src/scripts/migrate-authors.ts
- **Commit:** 2cf7fd2

**2. [Rule 3 - Blocking] Cast en el fallback del sitemap route**
- **Found during:** Task 3
- **Issue:** `let results = find(authors)` infiere `PaginatedDocs<Author>`; reasignar con `find(users)` (`PaginatedDocs<User>`) es incompatible de tipo.
- **Fix:** `as unknown as typeof results` en el fallback — User y Author exponen `slug`+`updatedAt`, los únicos campos leídos.
- **Files modified:** src/app/(frontend)/(sitemaps)/authors-sitemap.xml/route.ts
- **Commit:** f8b1d6c

Ninguna decisión arquitectónica (Rule 4) fue necesaria. Sin instalación de paquetes.

## Deferred to Phase 58 (NOT done, by design)

- #9 `PostArticleHeader.author` (`relationTo: 'users'`) — bloque page-builder independiente; requiere su propia migración de bloques. Sigue en `users`.
- #11 herramientas internas (`keywordCoverageAudit.ts`, `scripts/*`) que consultan `users` — no afectan author page ni sitemap.
- Retiro del campo `authors→users`, del fallback a users, y limpieza de `populatedAuthors` si queda huérfano.

## Human Steps Deferred to Juan (RUN — needs live DATABASE_URI)

**Paso A — este plan (un solo deploy, ya en código):** schema Authors + postAuthors + cutover con fallback. Seguro con o sin migración: sin migrar, todo resuelve por fallback exactamente como hoy.

**Paso B — post-deploy, contra prod:**
1. `pnpm migrate:authors` — crea Authors (hoy ~1: `juan-carlos-angulo`) y backfillea `postAuthors`. Idempotente.
2. `pnpm verify:authors` — confirmar en el RESULT JSON: `postsWithOldAuthorMissingPostAuthors: 0`, `authorsCount == eligibleUsersCount`, `slugParityOk: true`.
3. Smoke manual: `/authors`, `/authors/{slug}` es+en, `authors-sitemap.xml` (mismas URLs), byline + JSON-LD de un post.
4. Verificación visual: la colección `Authors` aparece en el admin bajo "Contenido".

**Paso C — Phase 58:** retirar `authors→users`, el fallback, y limpiar `populatedAuthors`; re-apuntar `PostArticleHeader.author` y herramientas internas.

## Self-Check: PASSED

- Archivos creados: Authors/index.ts, resolvePostAuthors.ts, migrate-authors.ts, verify-authors-collection.ts — FOUND
- Commits: 78663ba, 194d1bc, f8b1d6c, 2cf7fd2 — FOUND
- tsc: 0 errores nuevos en src/ (114 baseline en tests/ fuera de scope)
- generate:types: idempotente, diff acotado a Author + postAuthors
