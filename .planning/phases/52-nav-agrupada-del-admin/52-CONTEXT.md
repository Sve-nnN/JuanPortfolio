# Phase 52: Nav agrupada del admin - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — grey areas resueltos por Claude, bajo riesgo/reversible

<domain>
## Phase Boundary

El sidebar del admin de Payload agrupa TODAS las secciones existentes (colecciones + globals + colecciones de plugins) en 4 grupos coherentes con labels bilingües (es/en), sin secciones sueltas. Solo se toca `admin.group`; sin cambios de datos, schema, ni rutas. Bajo riesgo, totalmente reversible.

Cubre NAV-01..NAV-05.
</domain>

<decisions>
## Implementation Decisions

### Mapa de grupos (label bilingüe → miembros)

Payload acepta `admin.group` como objeto localizado por idioma de i18n. i18n del proyecto: `es` (fallback) y `en`. Formato: `group: { es: 'Contenido', en: 'Content' }`.

**Contenido / Content**
- Pages, Posts, Categories, Media
- Globals de contenido de página: Home, BlogListing, CaseStudiesListing
  *(discreción: son contenido editable de página; migrarán a Pages en Phases 54/55/57. Agruparlos en Contenido evita dejarlos sueltos ahora y es coherente con su destino.)*

**Sitio / Site**
- SiteSettings, Header, Footer, Styles, LLM, Robots
- Users *(discreción: NAV-05 exige que nada quede suelto; Users — colección de auth/acceso — no estaba enumerada en requisitos. Se ubica en "Sitio" como configuración/acceso del sitio.)*

**SEO/Métricas / SEO & Metrics**
- KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks
- Redirects *(colección del plugin `@payloadcms/plugin-redirects`; grupo vía override en la config del plugin)*

**Marketing / Marketing**
- Works, CaseStudies, Clientes, Testimonials, AdBanners
- Forms + FormSubmissions *(colecciones del form-builder plugin; grupo vía override. FormSubmissions se agrupa junto a Forms — discreción.)*
- Search *(colección del search plugin; grupo vía override)*

### Orden de grupos
Payload ordena los grupos del sidebar alfabéticamente por su label en el idioma activo. En español el orden resultante es consistente: **Contenido → Marketing → SEO/Métricas → Sitio**. Se acepta ese orden como "intencional y consistente" (NAV-05); un orden 100% arbitrario requeriría un componente Nav custom, fuera de alcance de esta fase de bajo riesgo.

### Colecciones de plugins (Forms/FormSubmissions/Search/Redirects)
No tienen archivo de colección propio en `src/collections`. Su `admin.group` se setea vía las opciones de override del plugin en `src/plugins/index.ts` (p.ej. `formOverrides`, `formSubmissionOverrides`, `searchOverrides`, `redirectOverrides` / `overrides` según la API de cada plugin). El plan debe inspeccionar `src/plugins/index.ts` y aplicar el grupo en el override correcto de cada plugin.

### Labels de grupo
Consistencia de idioma: string localizado `{ es, en }` en cada `group`. No usar strings sueltos. El valor viejo `group: 'SEO'` (string) se reemplaza por el objeto bilingüe de "SEO/Métricas".
</decisions>

<code_context>
## Existing Code Insights

- Colecciones registradas en `src/payload.config.ts` (líneas 122-137): Pages, Posts, Media, Categories, Users, Works, CaseStudies, Clientes, AdBannersCollection, Testimonials, KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks.
- Globals (línea 139): Header, Footer, Home, BlogListing, CaseStudiesListing, Styles, SiteSettings, LLM, Robots.
- Cada colección/global define `admin.group` en su propio archivo (`src/collections/*.ts`, `src/globals/*/config.ts`, `src/Header/config.ts`, `src/Footer/config.ts`).
- Estado actual de `group`: KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks, LLM, Robots tienen `group: 'SEO'` (string, a reemplazar). El resto no tiene grupo.
- Plugins en `src/plugins/index.ts` (form-builder, search, redirects) — ahí van los overrides de grupo de Forms/FormSubmissions/Search/Redirects.
- `Header` y `Footer` viven en `src/Header/config.ts` y `src/Footer/config.ts` (no en `src/globals/`).
</code_context>

<specifics>
## Specific Ideas

- Cada archivo de colección/global: agregar/actualizar `admin.group = { es, en }`.
- `src/plugins/index.ts`: aplicar `group` en los overrides de Forms, FormSubmissions, Search, Redirects.
- Verificación: `pnpm build` (o typecheck) verde; y visualmente, ninguna sección queda fuera de grupo al abrir `/admin`.
- Regenerar `payload-types.ts` si el build lo requiere (no debería cambiar tipos por solo `admin.group`).
</specifics>

<deferred>
## Deferred Ideas

- Authors se sumará al grupo "Contenido" en Phase 56, al crearse la colección.
- Orden de grupos 100% arbitrario (Nav component custom) — fuera de alcance; el orden alfabético alcanza para NAV-05.
</deferred>
