---
phase: 21-keyword-data-model
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/collections/Pages/index.ts
  - src/collections/Categories.ts
  - src/collections/Users/index.ts
  - src/payload-types.ts
autonomous: true
requirements: [KW-01, KW-02, KW-03]

must_haves:
  truths:
    - "En el admin, un doc de Pages tiene un tab Meta con primaryKeyword y semanticKeywords (relacion a keyword-metrics), idéntico a Posts."
    - "En el admin, un doc de Categories tiene un campo primaryKeyword (relacion a keyword-metrics) en el sidebar."
    - "En el admin, un doc de Users (autor) tiene un campo primaryKeyword (relacion a keyword-metrics) en el sidebar."
    - "La keyword objetivo de Posts y Pages usa el mismo mecanismo (relationship a keyword-metrics); no existe campo de texto suelto paralelo."
    - "payload-types.ts se regenera con los nuevos campos y el build/type-check pasa sin errores."
  artifacts:
    - path: "src/collections/Pages/index.ts"
      provides: "tab Meta con primaryKeyword + semanticKeywords"
      contains: "primaryKeyword"
    - path: "src/collections/Categories.ts"
      provides: "campo primaryKeyword en sidebar de Categories"
      contains: "primaryKeyword"
    - path: "src/collections/Users/index.ts"
      provides: "campo primaryKeyword en sidebar de Users"
      contains: "primaryKeyword"
    - path: "src/payload-types.ts"
      provides: "tipos regenerados con primaryKeyword en pages/categories/users"
      contains: "primaryKeyword"
  key_links:
    - from: "src/collections/Pages/index.ts"
      to: "keyword-metrics"
      via: "relationship relationTo: 'keyword-metrics'"
      pattern: "relationTo:\\s*'keyword-metrics'"
    - from: "src/collections/Categories.ts"
      to: "keyword-metrics"
      via: "relationship relationTo: 'keyword-metrics'"
      pattern: "relationTo:\\s*'keyword-metrics'"
    - from: "src/collections/Users/index.ts"
      to: "keyword-metrics"
      via: "relationship relationTo: 'keyword-metrics'"
      pattern: "relationTo:\\s*'keyword-metrics'"
---

<objective>
Agregar el modelo de datos de keyword objetivo a las superficies que aún no lo tienen: la colección Pages (tab Meta con `primaryKeyword` + `semanticKeywords`), el doc de Categories y los autores (Users), todos vía relación a `keyword-metrics`, espejando 1:1 el patrón ya existente en Posts.

Purpose: Habilitar que cada Page y cada listado (categoría/autor) tenga una keyword objetivo asignable, prerequisito para las métricas (Fase 22), la auditoría (Fase 23) y la población de datos (Fase 24).

Output: Tres colecciones con el campo de relación, `payload-types.ts` regenerado y build/type-check verde.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/21-keyword-data-model/21-CONTEXT.md

@src/collections/Posts/index.ts
@src/collections/Pages/index.ts
@src/collections/Categories.ts
@src/collections/Users/index.ts

<interfaces>
<!-- Patrón canónico a espejar. Extraído de src/collections/Posts/index.ts:148-167 -->
<!-- Dentro de un tab { label: 'Meta', fields: [...] }: -->

primaryKeyword:
  name: 'primaryKeyword'
  type: 'relationship'
  relationTo: 'keyword-metrics'
  admin: { position: 'sidebar' }

semanticKeywords:
  name: 'semanticKeywords'
  type: 'relationship'
  relationTo: 'keyword-metrics'
  hasMany: true
  admin: { position: 'sidebar' }

<!-- keyword-metrics (slug 'keyword-metrics') es la colección destino. NO se modifica en esta fase. -->
<!-- El hook syncKeywordsAfterPostSave (ya enganchado en Pages.hooks.afterChange) es slug-based: -->
<!-- enlaza keyword-metrics por coincidencia de targetURL con doc.slug; NO lee primaryKeyword. -->
<!-- Por tanto agregar primaryKeyword a Pages NO afecta ese hook. -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Agregar tab Meta con primaryKeyword + semanticKeywords a Pages (KW-01, KW-03)</name>
  <files>src/collections/Pages/index.ts</files>
  <action>
    En el array `tabs` (dentro del bloque `{ type: 'tabs', tabs: [...] }`, líneas ~89-204), agregar un nuevo tab `Meta` espejando 1:1 el tab Meta de Posts (src/collections/Posts/index.ts:148-167). El tab debe contener ÚNICAMENTE los dos campos keyword (mantener mínimo, per discreción del CONTEXT): `primaryKeyword` (type relationship, relationTo 'keyword-metrics', admin.position 'sidebar') y `semanticKeywords` (type relationship, relationTo 'keyword-metrics', hasMany true, admin.position 'sidebar'). NO incluir `relatedPosts` ni otros campos de Posts. Usar label bilingüe `{ en: 'Meta', es: 'Meta' }` siguiendo el patrón bilingüe del resto de tabs de Pages. Ubicar el tab al final del array tabs (después de 'searchConsole'). Implementa KW-01. No agregar ningún campo de texto suelto para la keyword — único mecanismo es la relación (KW-03). NO tocar el hook `syncKeywordsAfterPostSave` (es slug-based, ya tolera el nuevo campo).
  </action>
  <verify>
    <automated>grep -c "relationTo: 'keyword-metrics'" /Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/collections/Pages/index.ts</automated>
  </verify>
  <done>Pages/index.ts tiene un tab Meta con primaryKeyword y semanticKeywords apuntando a keyword-metrics; grep devuelve 2.</done>
</task>

<task type="auto">
  <name>Task 2: Agregar primaryKeyword al sidebar de Categories y Users (KW-02)</name>
  <files>src/collections/Categories.ts, src/collections/Users/index.ts</files>
  <action>
    Categories: dentro de `getCategoryFields()` (src/collections/Categories.ts:9-89), agregar un campo `primaryKeyword` (type relationship, relationTo 'keyword-metrics', admin.position 'sidebar') junto a los otros campos sidebar existentes (liveUrl, indexingControl, indexStatus). Usar label bilingüe `{ en: 'Target Keyword', es: 'Keyword Objetivo' }`.

    Users: en el tab 'Perfil' (src/collections/Users/index.ts:88-251), agregar un campo `primaryKeyword` (type relationship, relationTo 'keyword-metrics', admin.position 'sidebar') junto al campo sidebar `liveUrl` existente. Mismo label bilingüe.

    Implementa KW-02 (keyword objetivo para listados de categoría/autor vía el doc mismo). NO agregar relaciones reversas (category/user) a keyword-metrics — solo el forward relationship desde cada doc. NO crear colección nueva.
  </action>
  <verify>
    <automated>grep -l "relationTo: 'keyword-metrics'" /Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/collections/Categories.ts /Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio/src/collections/Users/index.ts</automated>
  </verify>
  <done>Categories.ts y Users/index.ts tienen cada uno un campo primaryKeyword sidebar relacionado a keyword-metrics; ambos archivos aparecen en el grep -l.</done>
</task>

<task type="auto">
  <name>Task 3: Regenerar payload-types, verificar consistencia y build/type-check (KW-03)</name>
  <files>src/payload-types.ts</files>
  <action>
    1. Ejecutar `pnpm generate:types` para regenerar src/payload-types.ts con los nuevos campos en pages/categories/users.
    2. Verificación de consistencia (KW-03): confirmar por grep que NO existe ningún campo de texto suelto paralelo para la keyword en Posts ni Pages (buscar nombres como focusKeyword/targetKeyword/keywordText de type 'text'). El único mecanismo debe ser la relación a keyword-metrics. Confirmar también que el patrón primaryKeyword de Posts permanece intacto (no regresión).
    3. Verificar que el proyecto type-checkea/compila: ejecutar `pnpm exec tsc --noEmit` (el build de Next también type-checkea, pero tsc es más rápido para la verificación). Si tsc no está disponible como script directo, usar `pnpm build`.
  </action>
  <verify>
    <automated>cd /Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio && pnpm generate:types && pnpm exec tsc --noEmit && grep -c "primaryKeyword" src/payload-types.ts</automated>
  </verify>
  <done>payload-types.ts regenerado con primaryKeyword presente (grep > 0); tsc --noEmit pasa sin errores; ningún campo de texto suelto de keyword en Posts/Pages.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| editor admin → Payload collections | Solo usuarios autenticados (authenticated/admins) editan estos campos; sin superficie pública nueva. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-21-01 | Tampering | nuevos campos relationship en pages/categories/users | accept | Campos solo editables por usuarios autenticados; el access control existente de cada colección no cambia. Sin nuevo input público. |
| T-21-02 | Information Disclosure | relationTo keyword-metrics expuesto en API admin | accept | keyword-metrics ya es relacionable desde Posts; no se amplía la superficie de lectura más allá del patrón existente. |
</threat_model>

<verification>
- `pnpm generate:types` corre sin error y actualiza src/payload-types.ts.
- `pnpm exec tsc --noEmit` (o `pnpm build`) pasa sin errores de tipo.
- grep confirma `relationTo: 'keyword-metrics'` en Pages (2), Categories (1) y Users (1).
- grep confirma que no hay campo de texto suelto de keyword en Posts/Pages (KW-03).
- El campo primaryKeyword de Posts permanece intacto (no regresión).
</verification>

<success_criteria>
- KW-01: Pages tiene primaryKeyword (+ semanticKeywords) relacionado a keyword-metrics en un tab Meta, igual que Posts.
- KW-02: Categories y Users tienen primaryKeyword en sidebar para asignar keyword a los listados de categoría/autor.
- KW-03: Único mecanismo es la relación a keyword-metrics; sin campo de texto suelto paralelo; tipos regenerados y build/type-check verde.
</success_criteria>

<output>
Create `.planning/phases/21-keyword-data-model/21-1-SUMMARY.md` when done
</output>
