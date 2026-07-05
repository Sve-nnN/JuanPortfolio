---
phase: 56-coleccion-authors
verified: 2026-07-05T00:00:00Z
status: human_needed
score: 6/6 must-haves verified (code)
re_verification:
  previous_status: none
human_verification:
  - test: "pnpm migrate:authors contra prod (DATABASE_URI viva), luego pnpm verify:authors"
    expected: "RESULT JSON: postsWithOldAuthorMissingPostAuthors: 0, authorsCount == eligibleUsersCount, slugParityOk: true"
    why_human: "Requiere DATABASE_URI de producción; el verificador no ejecuta migraciones sobre datos vivos."
  - test: "Smoke post-deploy: /authors, /authors/{slug} es+en, /en/authors/{slug}, authors-sitemap.xml (diff de URLs antes/después), byline + JSON-LD de un post"
    expected: "Paridad visual y de URLs con el estado previo; sin 500; mismas URLs /authors/{slug} y /en/authors/{slug}"
    why_human: "Verificación visual y de comportamiento en runtime; no verificable por grep."
  - test: "Admin: la colección Authors aparece bajo el grupo Contenido, editable"
    expected: "Authors visible bajo 'Contenido' con name/slug/bio/avatar/jobTitle/socialMedia/expertise/education/experience + tab SEO"
    why_human: "Render visual del admin de Payload."
---

# Phase 56: Colección Authors — Verification Report

**Phase Goal:** Existe una colección `Authors` real en el admin, relacionable con `Posts`, y la author page pública junto con el `authors-sitemap` la consumen sin romper la paridad de datos actuales.
**Verified:** 2026-07-05
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AUTHORS-01: Colección Authors bajo "Contenido", paridad de campos author-facing, sin auth | ✓ VERIFIED | `src/collections/Authors/index.ts:21-186` — `slug:'authors'`, `access.read:()=>true` (L24), `admin.group: ADMIN_GROUP.CONTENIDO` (L27), tab Perfil con name/role/jobTitle/bio/expertise/socialMedia/education/experience/avatar/`slugField('name')` (L39-174) + tab SEO `...seoFields()` (L179). NO hay `auth:true`, ni email/password/credentials/liveUrl/primaryKeyword/ensureUniqueSlug. Registrada en `src/payload.config.ts:18,129` |
| 2 | AUTHORS-02: campo NUEVO aditivo `postAuthors` (relationTo authors, hasMany); `authors→users` INTACTO | ✓ VERIFIED | `src/collections/Posts/index.ts:260-282` — `authors` sigue `relationTo:'users'` (L261-267) sin cambios; `postAuthors` nuevo `relationTo:'authors'`, `hasMany:true` (L273-276) insertado entre `authors` y `populatedAuthors` |
| 3 | AUTHORS-03/SC3: author pages leen Authors por slug con fallback a users | ✓ VERIFIED | `authors/[slug]/page.tsx:54-86` resuelve `authors` por slug/id → fallback `users`, devuelve `{doc, source}`; `queryPostsByAuthor` usa `postAuthors contains` (source authors) o `authors contains` (users) L101-106; `generateStaticParams` une slugs authors+users L27-40. `author/[slug]/page.tsx:43-85` mismo patrón. `authors/page.tsx:42-44` prefiere authors, cae a users si vacío |
| 4 | SC4: authors-sitemap genera mismas URLs desde Authors con fallback | ✓ VERIFIED | `authors-sitemap.xml/route.ts:20-56` — find `authors where slug exists` → si `docs.length===0` fallback a `users`; URLs `/authors/{slug}` + `/en/authors/{slug}` por slug verbatim L64-65; tag `authors-sitemap` intacto L81-83; try/catch envuelve todo |
| 5 | AuthorCard/byline/JSON-LD/hook renderizan idéntico vía resolvePostAuthors | ✓ VERIFIED | `resolvePostAuthors.ts:65-78` prefiere `postAuthors` resueltos, cae a `authors`; byline `blog/[category]/[slug]/page.tsx:198` usa `resolvePostAuthors(post)[0]`; `AuthorCard/index.tsx:10` prop `NormalizedAuthor`; hook `populateAuthors.ts:16-19` prefiere postAuthors→authors, cae a users, emite `{id,name,slug}`; `generateSchema.ts:58` `populatedAuthors||authors` sin cambio |
| 6 | tsc --noEmit sin nuevos errores en src/; diff de types puramente aditivo | ✓ VERIFIED | `pnpm exec tsc --noEmit`: 0 errores en `src/` (excluyendo tests); 0 en archivos tocados por la fase. `git diff` de `src/payload-types.ts`: 0 líneas removidas; `Author` interface (L779), `AuthorsSelect` (L3766), `postAuthors` en Post (L368), `authors: Author` en registro (L76) — todo aditivo |

**Score:** 6/6 truths verified (código)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/collections/Authors/index.ts` | Colección pública, paridad, sin auth | ✓ VERIFIED | 186 líneas, sustantiva, registrada e importada en config |
| `src/utilities/resolvePostAuthors.ts` | Helper fallback + NormalizedAuthor | ✓ VERIFIED | Exporta `resolvePostAuthors` + `NormalizedAuthor`; puro; prefiere postAuthors→authors |
| `src/scripts/migrate-authors.ts` | Migración idempotente (RUN diferido) | ✓ VERIFIED | Upsert por slug, unión users-con-slug ∪ referenciados-por-posts (L46-79), ambos locales (es L91 / en L98), backfill postAuthors (L179), `disableRevalidate`, NO deletes |
| `src/scripts/verify-authors-collection.ts` | Verificación de paridad (RUN diferido) | ✓ VERIFIED | `postsWithOldAuthorMissingPostAuthors`, `authorsCount`, `eligibleUsersCount`, `slugParityOk`, `process.exit(0)` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| Posts/index.ts | collection 'authors' | postAuthors relationTo authors hasMany | ✓ WIRED | L273-276 |
| authors/[slug]/page.tsx | authors + fallback users | find authors by slug \|\| users | ✓ WIRED | L60-79 |
| authors-sitemap route | authors + fallback users | find authors slug exists \|\| users | ✓ WIRED | L20-56 |
| package.json | scripts | migrate:authors / verify:authors | ✓ WIRED | L19-20 |

### Anti-Patterns Found

Ninguno bloqueante. Los `as any`/`as unknown as` documentados en migrate-authors.ts (escrituras Local API) y en el fallback del sitemap route replican el patrón de referencia `migrate-blog-listing-to-page.ts` y están comentados. Sin TODO/FIXME/XXX sin referencia en los archivos de la fase.

### Deploy Safety Analysis

**Un solo deploy es SEGURO con o sin migración corrida.** Cada lectura prefiere `Authors` pero cae a `users` cuando la colección está vacía o no hay match por slug:
- author pages (`[slug]` y legacy singular): resolver authors→users, posts por source; `generateStaticParams` une ambos sets de slugs
- listado `authors/page.tsx`: authors → fallback users si `docs.length===0`
- `authors-sitemap.xml`: authors `slug exists` → fallback users; URLs idénticas por slug verbatim
- HTML `sitemap/page.tsx`: authors → fallback users
- byline/JSON-LD/PostHero: vía `resolvePostAuthors` y hook `populateAuthors`, ambos con fallback a users
- El campo `authors→users` NO se re-apuntó; permanece como fuente viva (rollback intacto)
- Ninguna superficie hard-depende de que existan Authors. Todas las queries nuevas están en try/catch (sin 500 por fallback)

Sin migración → todo resuelve por fallback exactamente como hoy. Con migración → resuelve desde Authors. El diff de types es 0-remociones.

### Human Verification Required

1. **Correr migración + verify (post-deploy, prod)** — `pnpm migrate:authors` luego `pnpm verify:authors`. Esperado: `postsWithOldAuthorMissingPostAuthors: 0`, `authorsCount == eligibleUsersCount`, `slugParityOk: true`.
2. **Smoke de deploy** — `/authors`, `/authors/{slug}` es+en, `/en/authors/{slug}`, `authors-sitemap.xml` (diff de URLs), byline + JSON-LD de un post. Esperado: paridad visual/URL, sin 500.
3. **Admin visual** — Authors bajo "Contenido", editable con todos los campos + tab SEO.

### Gaps Summary

Sin gaps de código. La implementación es una estrategia aditiva-con-fallback correcta y segura para un solo deploy: el campo viejo `authors→users` queda intacto, el diff de tipos es puramente aditivo (0 remociones), ninguna lectura hard-depende de Authors, y todas las superficies caen a users cuando la colección está vacía. Solo restan el RUN de la migración y el smoke de deploy, ambos diferidos a Juan por requerir `DATABASE_URI` viva — de ahí `status: human_needed` en lugar de `passed`.

---

_Verified: 2026-07-05_
_Verifier: Claude (gsd-verifier)_
