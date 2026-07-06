# Phase 58: Retiro de globals y limpieza - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — Juan ausente al decidir; se toma la opción más segura (branch aparte para lo destructivo)

<domain>
## Phase Boundary

Retirar los globals `home`/`blog-listing`/`case-studies-listing` del config y del render sin rutas rotas ni datos huérfanos (PAGES-06), consolidar/documentar los globals restantes Styles/LLM/Robots (CLEAN-01), y dejar una guía corta de uso (CLEAN-02).
</domain>

<decisions>
## Implementation Decisions

### SPLIT por seguridad de deploy (decisión clave, Juan ausente → opción recomendada)
El retiro de globals + limpieza de fallbacks es DESTRUCTIVO y solo es seguro DESPUÉS de que Juan corra las 4 migraciones (blog/case-studies/authors/home) y las verifique en producción. Si se deploya antes, las rutas rompen (ya no hay fallback ni global).

- **CLEAN-01 + CLEAN-02 → en `main` ahora** (no destructivo): revisión + documentación. No dependen de migraciones.
- **PAGES-06 (retiro destructivo) → en branch `chore/v1.9-retire-globals`** partiendo de `main`. Se mergea/deploya SOLO tras migraciones corridas + verificadas. Así 52-57 se deployan desde main, se corren migraciones, se verifica, y recién ahí entra el retiro. Imposible romper prod por orden de deploy.

### CLEAN-01 — Styles / LLM / Robots
Revisión: los tres son globals distintos y NO redundantes (Styles = estilos globales; LLM = contenido de llms.txt; Robots = contenido de robots.txt). Ya quedaron agrupados bajo "Sitio" en Phase 52, coherente con la nav. **Decisión: mantener los tres como globals separados bajo "Sitio"; no se consolidan** (consolidar mezclaría responsabilidades distintas). Documentar esta decisión (CLEAN-01 exige documentar, no necesariamente mover).

### CLEAN-02 — Guía del editor
Doc corto en el repo (p.ej. `docs/PAGES-Y-GLOBALS.md` o `.planning/`): cómo crear una página nueva en `Pages` (crear/duplicar/publicar), qué superficies viven ahora en `Pages` (home, blog, case-studies) y qué globals quedaron y para qué (Header, Footer, Styles, SiteSettings, LLM, Robots). Humanizado, en español neutral.

### PAGES-06 (branch destructivo) — alcance
En `chore/v1.9-retire-globals`:
1. Quitar `Home`, `BlogListing`, `CaseStudiesListing` del array `globals` de `src/payload.config.ts` + sus imports. (Opcional: borrar `src/globals/Home|BlogListing|CaseStudiesListing/` y sus hooks `revalidate*`.)
2. Quitar los FALLBACKS a global en las rutas migradas: `/blog` (fallback a `blog-listing`), `/case-studies` (fallback a `case-studies-listing`), `[slug]/page.tsx` ramas home (fallback a `findGlobal('home')`). Tras el retiro leen SOLO desde `Pages`.
3. Limpiar ramas muertas de `blog-listing`/`case-studies-listing` en `[slug]/generateMetadata` (documentadas en 54/55).
4. `generate:types` (se van los tipos `Home`/`BlogListing`/`CaseStudiesListing` global → confirmar que nada los importe salvo lo que se elimina).
5. Datos huérfanos: los globals migrados quedan en la DB pero sin uso; decisión documentada = se dejan (no se borran datos de DB desde código; Juan puede limpiarlos manualmente si quiere). Sin huérfanos en el render.

### Diferido de fases previas que cae acá
- Retiro del campo `authors→users` de Posts + fallback a users + `populatedAuthors` huérfano (de Phase 56) → evaluar en el plan si entra en este branch destructivo (depende de `migrate:authors` corrida). Preferencia: incluirlo en el branch destructivo, misma condición de deploy post-migración.
- `PostArticleHeader.author` (relationTo users) — re-apuntar a authors si aplica.
</decisions>

<code_context>
## Existing Code Insights

- `src/payload.config.ts:139` — `globals: [Header, Footer, Home, BlogListing, CaseStudiesListing, Styles, SiteSettings, LLM, Robots]`.
- Fallbacks a retirar: `/blog/page.tsx`, `/case-studies/page.tsx`, `[slug]/page.tsx` (2 ramas home + ramas muertas metadata).
- Globals a conservar bajo "Sitio": Header, Footer, Styles, SiteSettings, LLM, Robots (+ Users bajo Sitio, Pages/Posts/etc bajo Contenido).
- Campo viejo `authors→users` + `populatedAuthors` en `src/collections/Posts/index.ts` (retiro condicionado a migrate:authors).
</code_context>

<specifics>
## Specific Ideas

- main: doc CLEAN-02 + nota CLEAN-01 (decisión Styles/LLM/Robots).
- branch `chore/v1.9-retire-globals`: retiro de globals + fallbacks + ramas muertas + limpieza Authors legacy. `generate:types`. Gate tsc.
- JUAN-ACTIONS: gate duro "no deployar el branch de retiro hasta migraciones corridas + verificadas en prod".
</specifics>

<deferred>
## Deferred Ideas

- Merge/deploy de `chore/v1.9-retire-globals` (post-migración + verificación en prod) — acción de Juan.
- Borrado manual de los datos de los globals migrados en la DB (opcional, Juan).
</deferred>
