---
phase: 52-nav-agrupada-del-admin
plan: 52
type: execute
wave: 1
depends_on: []
autonomous: false
requirements: [NAV-01, NAV-02, NAV-03, NAV-04, NAV-05]
files_modified:
  - src/utilities/adminGroups.ts            # NEW — shared bilingual group labels
  - src/collections/Pages/index.ts
  - src/collections/Posts/index.ts
  - src/collections/Categories.ts
  - src/collections/Media.ts
  - src/globals/Home/config.ts
  - src/globals/BlogListing/config.ts
  - src/globals/CaseStudiesListing/config.ts
  - src/globals/SiteSettings/index.ts        # NO top-level admin block — must add one
  - src/Header/config.ts
  - src/Footer/config.ts
  - src/globals/Styles/config.ts             # NO top-level admin block — must add one
  - src/globals/LLM/config.ts                # replace group: 'SEO'
  - src/globals/Robots/config.ts             # replace group: 'SEO'
  - src/collections/Users/index.ts
  - src/collections/KeywordMetrics.ts        # replace group: 'SEO'
  - src/collections/PageMetrics.ts           # replace group: 'SEO'
  - src/collections/GSCMetrics.ts            # replace group: 'SEO'
  - src/collections/BrokenLinks.ts           # replace group: 'SEO'
  - src/collections/Works/index.ts
  - src/collections/CaseStudies/index.ts
  - src/collections/Clientes/index.ts
  - src/collections/Testimonials.ts
  - src/collections/AdBanners/index.ts
  - src/plugins/index.ts                     # Redirects + Forms + FormSubmissions + Search overrides

must_haves:
  truths:
    - "Al abrir /admin, el sidebar muestra exactamente 4 grupos: Contenido, Marketing, SEO/Métricas, Sitio"
    - "Ninguna colección ni global aparece suelta fuera de un grupo"
    - "Los labels de grupo son bilingües es/en (cambian al cambiar el idioma del admin)"
    - "Redirects, Forms, FormSubmissions y Search (colecciones de plugins) aparecen dentro de su grupo"
    - "`pnpm generate:types` y typecheck pasan sin errores nuevos"
  artifacts:
    - path: "src/utilities/adminGroups.ts"
      provides: "Constantes bilingües { es, en } de los 4 grupos, única fuente de verdad"
      contains: "ADMIN_GROUP"
    - path: "src/plugins/index.ts"
      provides: "admin.group en overrides de Redirects, Forms, FormSubmissions, Search"
      contains: "formSubmissionOverrides"
  key_links:
    - from: "src/collections/*.ts + src/globals/*/config.ts"
      to: "src/utilities/adminGroups.ts"
      via: "import { ADMIN_GROUP }"
      pattern: "ADMIN_GROUP\\."
    - from: "src/plugins/index.ts"
      to: "src/utilities/adminGroups.ts"
      via: "admin.group en cada override de plugin"
      pattern: "admin:\\s*\\{\\s*group"
---

<objective>
Agrupar TODO el sidebar del admin de Payload en 4 grupos bilingües (es/en) seteando `admin.group` en cada colección y global (incluidas las colecciones de plugins vía overrides), sin secciones sueltas y sin cambios de datos, schema ni rutas.

Purpose: NAV-01..NAV-05 — reducir el ruido del admin y dar una nav coherente antes de la migración de globals→Pages (Phases 53-58).
Output: Un archivo de constantes nuevo + `admin.group` aplicado en ~24 configs y en los 4 overrides de plugin.

RIESGO: bajo, totalmente reversible. Solo se toca `admin.group`.
</objective>

<research_findings>
## Hechos confirmados (verificados contra los paquetes instalados)

**payload 3.61.1 — `admin.group` acepta objeto localizado.**
`node_modules/payload/dist/collections/config/types.d.ts:337` → `group?: false | Record<string, string> | string`. El doc-comment dice literalmente "Provide a record to define localized group names". Por lo tanto `{ es, en }` es soportado nativamente. **NO se necesita fallback a string.** (El mismo tipo aplica a globals.)

**Override keys reales de cada plugin** (todos tipados como `& Partial<Omit<CollectionConfig, 'fields'>>`, por lo que aceptan un bloque `admin: { group }`):
- form-builder → `formOverrides` (ya en uso) y `formSubmissionOverrides` (hay que AÑADIRLO, hoy no existe en el config). Verificado en `node_modules/@payloadcms/plugin-form-builder/dist/types.d.ts:42-47`.
- search → `searchOverrides` (ya en uso). `node_modules/@payloadcms/plugin-search/dist/types.d.ts:47`.
- redirects → `overrides` (ya en uso). `node_modules/@payloadcms/plugin-redirects/dist/types.d.ts:8`.

**Paths de configs confirmados** (los de subdirectorio usan `index.ts`, no `config.ts`):
- Colecciones planas: `src/collections/{Categories,Media,Testimonials,KeywordMetrics,PageMetrics,GSCMetrics,BrokenLinks}.ts`
- Colecciones en subdir: `src/collections/{Pages,Posts,Users,Works,CaseStudies,Clientes,AdBanners}/index.ts`
- Globals en subdir: `src/globals/{Home,BlogListing,CaseStudiesListing,LLM,Robots,Styles}/config.ts` y `src/globals/SiteSettings/index.ts`
- Header/Footer: `src/Header/config.ts`, `src/Footer/config.ts`

**Dos configs SIN bloque `admin:` de nivel superior** — hay que crearlo (no solo añadir la key):
- `src/globals/Styles/config.ts` (hoy: `slug`, `label`, `fields`; sin `admin`)
- `src/globals/SiteSettings/index.ts` (hoy: `slug`, `fields`; sin `admin` de nivel top)

**Seis configs con `group: 'SEO'` (string) a reemplazar:**
- SEO/Métricas: `KeywordMetrics.ts:13`, `PageMetrics.ts:13`, `GSCMetrics.ts:13`, `BrokenLinks.ts:12`
- Sitio (¡cambian de grupo!): `src/globals/LLM/config.ts:13`, `src/globals/Robots/config.ts:39` → pasan de 'SEO' a Sitio, no a SEO/Métricas.

**BLOCKER:** ninguno. Objeto localizado soportado; los tres plugins exponen override que acepta `admin.group`.
</research_findings>

<decision_group_constants>
## Decisión: centralizar los labels en un helper (RECOMENDADO)

Crear `src/utilities/adminGroups.ts` que exporte las 4 constantes `{ es, en }` como única fuente de verdad, e importarlas en cada config y en `src/plugins/index.ts`.

Justificación (elegido sobre inline):
- ~24 configs + 4 overrides referencian los mismos 4 labels. Un typo inline (p.ej. `'Contenído'` o `'SEO / Métricas'` con espacios) crea silenciosamente un 5.º grupo fantasma → viola NAV-05 sin error de compilación.
- Con constantes, NAV-05 ("sin secciones sueltas / orden consistente") queda garantizado mecánicamente: es imposible desalinear un label.
- Coste cero de riesgo: `adminGroups.ts` es un módulo hoja (solo exporta objetos planos, sin imports) → sin ciclos de import.
- Reutilizable: Authors (Phase 56) importará `ADMIN_GROUP.CONTENIDO` sin re-tipear.

Contenido del archivo (valores exactos):
```
ADMIN_GROUP.CONTENIDO = { es: 'Contenido',    en: 'Content' }
ADMIN_GROUP.SITIO     = { es: 'Sitio',        en: 'Site' }
ADMIN_GROUP.SEO       = { es: 'SEO/Métricas', en: 'SEO & Metrics' }
ADMIN_GROUP.MARKETING = { es: 'Marketing',    en: 'Marketing' }
```
Tipar cada constante como `Record<string, string>` (o `as const satisfies Record<string,string>`) para que encaje con `CollectionAdminOptions['group']`.
</decision_group_constants>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/52-nav-agrupada-del-admin/52-CONTEXT.md
@.planning/ROADMAP.md
@src/plugins/index.ts
@src/payload.config.ts

<interfaces>
<!-- Contrato de admin.group en payload 3.61.1 (verificado, usar directamente) -->
```typescript
// payload CollectionAdminOptions / GlobalAdminOptions
group?: false | Record<string, string> | string
// Objeto localizado por clave de i18n del proyecto: 'es' (fallback) y 'en'
```
<!-- Override keys de plugins (cada uno = & Partial<Omit<CollectionConfig,'fields'>>) -->
```typescript
formBuilderPlugin({ formOverrides?: {...}, formSubmissionOverrides?: {...} })
searchPlugin({ searchOverrides?: {...} })
redirectsPlugin({ overrides?: {...} })
// En cada uno, añadir: admin: { group: ADMIN_GROUP.X }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Crear el helper de constantes de grupo (NAV-05)</name>
  <files>src/utilities/adminGroups.ts</files>
  <action>Crear el archivo exportando `ADMIN_GROUP` con las 4 constantes bilingües exactas de &lt;decision_group_constants&gt;: CONTENIDO {es:'Contenido',en:'Content'}, SITIO {es:'Sitio',en:'Site'}, SEO {es:'SEO/Métricas',en:'SEO & Metrics'}, MARKETING {es:'Marketing',en:'Marketing'}. Tipar cada valor de forma que satisfaga `Record<string,string>` (usar `satisfies` o anotación explícita) para que encaje en `admin.group`. Sin imports (módulo hoja). Es la única fuente de verdad; ningún otro archivo debe inline-ear estos strings.</action>
  <verify>
    <automated>test -f src/utilities/adminGroups.ts &amp;&amp; grep -q "SEO/Métricas" src/utilities/adminGroups.ts</automated>
  </verify>
  <done>El archivo existe y exporta las 4 constantes con los pares es/en correctos.</done>
</task>

<task type="auto">
  <name>Task 2: Grupo Contenido — 4 colecciones + 3 globals (NAV-01)</name>
  <files>src/collections/Pages/index.ts, src/collections/Posts/index.ts, src/collections/Categories.ts, src/collections/Media.ts, src/globals/Home/config.ts, src/globals/BlogListing/config.ts, src/globals/CaseStudiesListing/config.ts</files>
  <action>En cada archivo, importar `ADMIN_GROUP` desde `@/utilities/adminGroups` y setear `admin.group = ADMIN_GROUP.CONTENIDO`. Los 7 ya tienen bloque `admin:` de nivel superior → solo añadir la key `group` dentro de ese bloque (no duplicar el bloque). NO tocar `useAsTitle` ni otras keys existentes. Miembros por decisión de CONTEXT: Pages, Posts, Categories, Media + globals Home, BlogListing, CaseStudiesListing (contenido de página; migran a Pages en Phases 54/55/57).</action>
  <verify>
    <automated>grep -l "ADMIN_GROUP.CONTENIDO" src/collections/Pages/index.ts src/collections/Posts/index.ts src/collections/Categories.ts src/collections/Media.ts src/globals/Home/config.ts src/globals/BlogListing/config.ts src/globals/CaseStudiesListing/config.ts | wc -l | grep -q 7</automated>
  </verify>
  <done>Los 7 configs referencian `ADMIN_GROUP.CONTENIDO` dentro de su bloque admin.</done>
</task>

<task type="auto">
  <name>Task 3: Grupo Sitio — 7 secciones, 2 requieren crear bloque admin (NAV-02)</name>
  <files>src/globals/SiteSettings/index.ts, src/Header/config.ts, src/Footer/config.ts, src/globals/Styles/config.ts, src/globals/LLM/config.ts, src/globals/Robots/config.ts, src/collections/Users/index.ts</files>
  <action>Importar `ADMIN_GROUP` y setear `admin.group = ADMIN_GROUP.SITIO` en los 7. Casos especiales: (a) `src/globals/SiteSettings/index.ts` y `src/globals/Styles/config.ts` NO tienen bloque `admin:` de nivel top — CREAR `admin: { group: ADMIN_GROUP.SITIO }` antes de `fields:`. (b) `src/globals/LLM/config.ts:13` y `src/globals/Robots/config.ts:39` hoy tienen `group: 'SEO'` (string) — REEMPLAZAR por `ADMIN_GROUP.SITIO` (LLM y Robots pasan a Sitio, NO a SEO/Métricas, per CONTEXT). (c) Header/Footer/Users ya tienen bloque admin → solo añadir la key group. Users va en Sitio por discreción de CONTEXT (auth/acceso).</action>
  <verify>
    <automated>grep -l "ADMIN_GROUP.SITIO" src/globals/SiteSettings/index.ts src/Header/config.ts src/Footer/config.ts src/globals/Styles/config.ts src/globals/LLM/config.ts src/globals/Robots/config.ts src/collections/Users/index.ts | wc -l | grep -q 7; grep -rq "group: 'SEO'" src/globals/LLM/config.ts src/globals/Robots/config.ts && echo LEFTOVER || true</automated>
  </verify>
  <done>Los 7 referencian `ADMIN_GROUP.SITIO`; ya no queda `group: 'SEO'` en LLM ni Robots; SiteSettings y Styles tienen bloque admin nuevo.</done>
</task>

<task type="auto">
  <name>Task 4: Grupo SEO/Métricas — 4 colecciones (NAV-03)</name>
  <files>src/collections/KeywordMetrics.ts, src/collections/PageMetrics.ts, src/collections/GSCMetrics.ts, src/collections/BrokenLinks.ts</files>
  <action>En las 4, importar `ADMIN_GROUP` y REEMPLAZAR el `group: 'SEO'` (string, líneas ~12-13) por `group: ADMIN_GROUP.SEO`. No tocar el resto del bloque admin. (Redirects, el 5.º miembro de este grupo, se hace en Task 6 vía plugin override.)</action>
  <verify>
    <automated>grep -L "ADMIN_GROUP.SEO" src/collections/KeywordMetrics.ts src/collections/PageMetrics.ts src/collections/GSCMetrics.ts src/collections/BrokenLinks.ts | wc -l | grep -q 0; grep -rq "group: 'SEO'" src/collections/KeywordMetrics.ts src/collections/PageMetrics.ts src/collections/GSCMetrics.ts src/collections/BrokenLinks.ts && echo LEFTOVER || true</automated>
  </verify>
  <done>Las 4 usan `ADMIN_GROUP.SEO`; ningún `group: 'SEO'` string restante.</done>
</task>

<task type="auto">
  <name>Task 5: Grupo Marketing — 5 colecciones (NAV-04)</name>
  <files>src/collections/Works/index.ts, src/collections/CaseStudies/index.ts, src/collections/Clientes/index.ts, src/collections/Testimonials.ts, src/collections/AdBanners/index.ts</files>
  <action>En las 5, importar `ADMIN_GROUP` y añadir `group: ADMIN_GROUP.MARKETING` dentro del bloque `admin:` existente (todas ya tienen `admin.useAsTitle`). No duplicar el bloque admin. (Forms, FormSubmissions y Search, los demás miembros de Marketing, se hacen en Task 6.)</action>
  <verify>
    <automated>grep -L "ADMIN_GROUP.MARKETING" src/collections/Works/index.ts src/collections/CaseStudies/index.ts src/collections/Clientes/index.ts src/collections/Testimonials.ts src/collections/AdBanners/index.ts | wc -l | grep -q 0</automated>
  </verify>
  <done>Las 5 colecciones referencian `ADMIN_GROUP.MARKETING`.</done>
</task>

<task type="auto">
  <name>Task 6: Overrides de plugins — Redirects, Forms, FormSubmissions, Search (NAV-03, NAV-04)</name>
  <files>src/plugins/index.ts</files>
  <action>Importar `ADMIN_GROUP` desde `@/utilities/adminGroups`. Aplicar `admin: { group }` en cada override (todos son `& Partial<Omit<CollectionConfig,'fields'>>`, aceptan `admin`):
  - `redirectsPlugin`: dentro de `overrides` (ya existe), añadir `admin: { group: ADMIN_GROUP.SEO }` junto a `fields`/`hooks`.
  - `formBuilderPlugin`: dentro de `formOverrides` (ya existe), añadir `admin: { group: ADMIN_GROUP.MARKETING }`; y AÑADIR una key nueva `formSubmissionOverrides: { admin: { group: ADMIN_GROUP.MARKETING } }` (hoy no existe).
  - `searchPlugin`: dentro de `searchOverrides` (ya existe), añadir `admin: { group: ADMIN_GROUP.MARKETING }`.
  No modificar `collections`, `fields`, `hooks`, `beforeSync` ni la lógica existente de cada plugin.</action>
  <verify>
    <automated>grep -q "formSubmissionOverrides" src/plugins/index.ts &amp;&amp; grep -c "ADMIN_GROUP" src/plugins/index.ts | grep -qE "[4-9]|[0-9]{2}"</automated>
  </verify>
  <done>Los 4 overrides (redirects/form/formSubmission/search) setean `admin.group` con la constante correcta; `formSubmissionOverrides` existe.</done>
</task>

<task type="auto">
  <name>Task 7: Regenerar tipos y typecheck (NAV-05)</name>
  <files>src/payload-types.ts</files>
  <action>Correr `pnpm generate:types` (regenera `src/payload-types.ts`; no debería cambiar tipos porque `admin.group` no altera el schema — si el diff es no vacío, revisar por qué). Luego correr un typecheck rápido con `pnpm exec tsc --noEmit` para confirmar que los objetos `{es,en}` y los overrides de plugin compilan sin errores nuevos. Si `tsc --noEmit` falla por config del proyecto, usar `pnpm build` como gate completo.</action>
  <verify>
    <automated>pnpm generate:types &amp;&amp; pnpm exec tsc --noEmit</automated>
  </verify>
  <done>`generate:types` corre sin error y el typecheck pasa (0 errores nuevos en src/).</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>`admin.group` bilingüe seteado en todas las colecciones, globals y colecciones de plugins; agrupación en 4 grupos.</what-built>
  <how-to-verify>
    1. Correr `pnpm dev` y abrir http://localhost:3000/admin
    2. Confirmar que el sidebar muestra exactamente 4 grupos: Contenido, Marketing, SEO/Métricas, Sitio (orden alfabético en español es esperado, per CONTEXT).
    3. Confirmar que NINGUNA sección queda suelta fuera de un grupo (revisar especialmente Redirects, Forms, Form Submissions, Search, Users, Styles, Site Settings).
    4. Verificar miembros por grupo contra el mapa de 52-CONTEXT.md.
    5. (Opcional) Cambiar el idioma del admin a inglés y confirmar que los labels cambian a Content/Site/SEO &amp; Metrics/Marketing.
  </how-to-verify>
  <resume-signal>Escribe "approved" o describe qué sección quedó suelta o mal agrupada.</resume-signal>
</task>

</tasks>

<verification>
- `pnpm generate:types` sin cambios de schema; `pnpm exec tsc --noEmit` (o `pnpm build`) verde.
- `/admin` muestra 4 grupos, cero secciones sueltas (checkpoint humano).
- `grep -rq "group: 'SEO'" src/` no devuelve nada (todos los strings viejos reemplazados).
</verification>

<success_criteria>
## Mapa tarea → criterio de éxito / requirement

| Requirement | Criterio | Tareas |
|-------------|----------|--------|
| NAV-01 | Contenido: Pages, Posts, Categories, Media, Home, BlogListing, CaseStudiesListing | Task 2 |
| NAV-02 | Sitio: SiteSettings, Header, Footer, Styles, LLM, Robots, Users | Task 3 |
| NAV-03 | SEO/Métricas: KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks, Redirects | Task 4 + Task 6 (Redirects) |
| NAV-04 | Marketing: Works, CaseStudies, Clientes, Testimonials, AdBanners, Forms, FormSubmissions, Search | Task 5 + Task 6 (Forms/FormSubmissions/Search) |
| NAV-05 | Sin secciones sueltas, labels bilingües es/en, orden consistente | Task 1 (constantes) + Task 7 + checkpoint |

Completado cuando: los 4 grupos existen, cero secciones sueltas, typecheck verde, checkpoint humano aprobado.
</success_criteria>

<output>
Create `.planning/phases/52-nav-agrupada-del-admin/52-SUMMARY.md` when done
</output>
