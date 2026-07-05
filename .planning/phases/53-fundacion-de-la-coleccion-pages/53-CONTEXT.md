# Phase 53: Fundación de la colección Pages - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Validar que la colección `Pages` sirve como fundación para migrar los globals singleton: el editor puede (1) CREAR una página nueva con slug único y publicarla en su ruta pública, y (2) DUPLICAR una página existente como base de otra, quedando independiente (slug distinto). Cubre PAGES-01 y PAGES-02.

No incluye migrar Home/BlogListing/CaseStudiesListing (eso es Phases 54/55/57).
</domain>

<decisions>
## Implementation Decisions

### Hallazgo clave: la mayor parte de la infra YA existe
- `Pages` (`src/collections/Pages/index.ts`) está registrada, con slug (`unique: true`), bloques, `versions.drafts` + autosave, live preview, y hooks `revalidatePage` / `createRedirectOnSlugChange`.
- La ruta pública `src/app/(frontend)/[locale]/[slug]/page.tsx` renderiza Pages con **ISR** (`export const revalidate = 3600`), `generateStaticParams`, y preview gated por `draftMode()`.
- ⇒ CREATE + publicar + ISR (criterios 1 y 3) ya están cubiertos por el código existente. PAGES-01 es esencialmente verificación.

### Gap real: DUPLICAR rompe por slug único (PAGES-02)
- `slug` es `unique: true` y NO existe hook `beforeDuplicate`. La acción "Duplicate" de Payload copia el doc tal cual → el slug duplicado colisiona con el índice único → la duplicación falla.
- **Decisión:** agregar `hooks.beforeDuplicate` a `Pages` que haga el doc duplicado independiente:
  - `slug` → `${slug}-copy` (y si ya existe, `-copy-2`, `-copy-3`, … consultando `payload.find` por colisión).
  - `title` → `${title} (copy)` para distinguir en el listado (respetar localización: modificar el valor que llega en `data`; si es objeto por locale, ajustar el locale activo / cada locale disponible).
- **Duplicate queda habilitado** (no setear `disableDuplicate`). Es el mecanismo que PAGES-02 pide.

### Verificación de x-vercel-cache: HIT (criterio 3)
- Es un check de runtime en producción/preview de Vercel; no se puede confirmar 100% en local. Verificación de código: `revalidate` presente, sin `no-store`/`force-dynamic`, `draftMode` gated (ya cumplido). El HIT real se confirma post-deploy → parte del check humano/diferido, consistente con el resto del milestone.

### Sin cambios de datos/schema
- Solo se agrega un hook. No cambia el schema de `pages` (beforeDuplicate no toca tipos). `generate:types` no debería producir diff.
</decisions>

<code_context>
## Existing Code Insights

- `src/collections/Pages/index.ts` — hooks actuales: `afterChange: [revalidatePage, createRedirectOnSlugChange, syncKeywordsAfterPostSave]`, `beforeChange: [populatePublishedAt]`, `afterDelete: [revalidateDelete]`. Agregar `beforeDuplicate` a este bloque.
- `src/fields/slug.ts` — `slugField()`: `unique: true`, `index: true`, `beforeValidate` que normaliza a lowercase-guiones. Un slug ya normalizado como `foo-copy` pasa validación sin cambios.
- `src/app/(frontend)/[locale]/[slug]/page.tsx` — ISR + generateStaticParams (excluye `home` del filtro y lo re-agrega); preview gated por draftMode. Sin cambios necesarios para esta fase.
- Payload 3.61.1 — `CollectionBeforeDuplicate` hook: firma `({ data, req, collection })`; debe devolver el `data` modificado. Usar `req.payload.find` para chequear colisión de slug.
</code_context>

<specifics>
## Specific Ideas

- Nuevo hook: `src/collections/Pages/hooks/beforeDuplicatePage.ts` (o inline si es corto), exportado y agregado a `Pages.hooks.beforeDuplicate`.
- Lógica de slug único: buscar `pages` con slug candidato; si existe, incrementar sufijo hasta encontrar libre. Considerar que `slug` puede no estar localizado (es text simple) — es global, no por locale.
- Título: si `title` es localizado, sufijar el/los valores presentes en `data.title`.
- Gate: `pnpm exec tsc --noEmit` limpio en `src/`. `generate:types` sin diff.
- Smoke manual (diferido/humano): en `/admin` crear una Page, publicarla, ver la ruta; duplicar una Page y confirmar slug distinto + independencia.
</specifics>

<deferred>
## Deferred Ideas

- Confirmación de `x-vercel-cache: HIT` en la ruta pública (post-deploy).
- Smoke visual de create/duplicate en `/admin` (batch con el resto de checks del milestone).
</deferred>
