---
phase: 53-fundacion-de-la-coleccion-pages
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/collections/Pages/hooks/beforeDuplicatePage.ts
  - src/collections/Pages/index.ts
autonomous: true
requirements: [PAGES-01, PAGES-02]

must_haves:
  truths:
    - "El editor puede duplicar una Page en /admin sin error de slug único"
    - "El slug de la copia es distinto (`${slug}-copy`, luego `-copy-2`, `-copy-3`…) y no colisiona con el índice único"
    - "El título de la copia queda sufijado con ' (copy)' para distinguirlo en el listado, respetando localización"
    - "El original no se ve afectado por la duplicación"
    - "El schema de `pages` no cambia (generate:types sin diff)"
  artifacts:
    - path: "src/collections/Pages/hooks/beforeDuplicatePage.ts"
      provides: "Field hooks beforeDuplicate para slug (unicidad) y title (sufijo copy)"
      exports: ["uniqueSlugBeforeDuplicate", "suffixTitleBeforeDuplicate"]
    - path: "src/collections/Pages/index.ts"
      provides: "Wiring de los field hooks en el campo slug y el campo title"
      contains: "beforeDuplicate"
  key_links:
    - from: "src/collections/Pages/index.ts (campo slug)"
      to: "uniqueSlugBeforeDuplicate"
      via: "slugField('title', { hooks: { beforeDuplicate: [...] } })"
      pattern: "beforeDuplicate:\\s*\\[uniqueSlugBeforeDuplicate\\]"
    - from: "src/collections/Pages/index.ts (campo title)"
      to: "suffixTitleBeforeDuplicate"
      via: "title.hooks.beforeDuplicate"
      pattern: "beforeDuplicate:\\s*\\[suffixTitleBeforeDuplicate\\]"
    - from: "uniqueSlugBeforeDuplicate"
      to: "pages collection (colisión de slug)"
      via: "req.payload.find con where slug equals"
      pattern: "payload\\.find"
---

<objective>
Habilitar la duplicación de páginas en la colección `Pages` sin romper por el índice único de `slug`. Cierra PAGES-02 (el único gap real de esta fase) y deja PAGES-01 como verificación de infra ya existente.

Purpose: Validar el patrón CREATE + DUPLICATE de `Pages` antes de migrar los tres globals singleton (Phases 54/55/57). Hoy la acción "Duplicate" de Payload copia el doc tal cual y el `slug` duplicado colisiona con el índice `unique: true`, así que la duplicación falla.

Output:
- Nuevo archivo `src/collections/Pages/hooks/beforeDuplicatePage.ts` con dos field hooks `beforeDuplicate`.
- Wiring en `src/collections/Pages/index.ts` (campo `slug` vía `slugField()` overrides, campo `title` vía `hooks.beforeDuplicate`).
- Verificación de tipos limpia y schema sin diff.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/53-fundacion-de-la-coleccion-pages/53-CONTEXT.md
@.planning/ROADMAP.md
@src/collections/Pages/index.ts
@src/fields/slug.ts
@src/utilities/deepMerge.ts

<interfaces>
<!-- Contratos verificados contra node_modules/payload@3.61.1. El executor debe usar esto tal cual, sin explorar el codebase. -->

⚠ CORRECCIÓN A CONTEXT.md: en Payload 3.61.1 NO existe un hook `beforeDuplicate`
a nivel de colección. El objeto `CollectionConfig.hooks` solo admite:
afterChange, afterDelete, afterError, after*(login/logout/me/operation/read/refresh),
beforeChange, beforeDelete, beforeLogin, beforeOperation, beforeRead, beforeValidate,
me, refresh. NO hay `hooks.beforeDuplicate`.

`beforeDuplicate` es un hook A NIVEL DE CAMPO (`FieldHook[]`), bajo `field.hooks.beforeDuplicate`.
Doc del tipo: "Runs before a document is duplicated to prevent errors in unique fields
or return null to use defaultValue."

Firma (node_modules/payload/dist/fields/config/types.d.ts):
```typescript
type FieldHook<TData = any, TValue = any, TSiblingData = any> =
  (args: FieldHookArgs) => Promise<TValue> | TValue
// El hook DEVUELVE el nuevo VALOR del campo (no `data`).
// Args relevantes en beforeDuplicate: { value, data, siblingData, req, originalDoc,
//   field, siblingDocWithLocales, path, collection, req.payload, req.locale }
```

Import correcto: `import type { FieldHook } from 'payload'`.

slugField() (src/fields/slug.ts) ya define `hooks.beforeValidate` que normaliza a
lowercase-guiones. Acepta `overrides?: Partial<Field>` fusionados con `deepMerge`.
deepMerge (src/utilities/deepMerge.ts) trata los arrays como valores no-objeto:
pasar `{ hooks: { beforeDuplicate: [...] } }` como override RECURSA sobre `hooks`,
conserva `beforeValidate` y agrega `beforeDuplicate`. Verificado.

Campo `title` de Pages: `type: 'text'`, `required: true`, `localized: true`.
⇒ el sufijo debe manejar `value` como string O como objeto por-locale.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Crear field hooks beforeDuplicate (slug único + título sufijado) y cablearlos en Pages</name>
  <files>src/collections/Pages/hooks/beforeDuplicatePage.ts, src/collections/Pages/index.ts</files>
  <action>
Crear `src/collections/Pages/hooks/beforeDuplicatePage.ts` exportando dos `FieldHook` (import `import type { FieldHook } from 'payload'`). PAGES-02.

1) `uniqueSlugBeforeDuplicate: FieldHook` — recibe `{ value, req }`. El campo `slug` NO es localizado (es text global), así que `value` es string.
   - Si `value` no es string no vacío, devolver `value` sin cambios (defensivo).
   - Construir candidato base `${value}-copy`. Consultar colisión con `req.payload.find({ collection: 'pages', where: { slug: { equals: candidate } }, limit: 1, depth: 0, pagination: false, overrideAccess: true })`. Usar `overrideAccess: true` porque el hook corre en contexto admin de duplicación y debe ver drafts/no publicados para no reusar un slug ocupado.
   - Si hay colisión, iterar `${value}-copy-2`, `${value}-copy-3`, … incrementando hasta que `find` no devuelva docs. Poner un límite de guarda (p. ej. 100 intentos) para no bucle infinito; si se agota, hacer fallback a `${value}-copy-${Date.now()}`.
   - Devolver el slug libre. El `beforeValidate` existente del slugField lo re-normaliza (los candidatos ya vienen normalizados, así que no hay cambio).

2) `suffixTitleBeforeDuplicate: FieldHook` — recibe `{ value }`. El campo `title` ES `localized: true`, así que `value` puede ser string (un locale) o un objeto `{ en, es }` (todos los locales). Manejar ambos:
   - Si `typeof value === 'string'` → devolver `${value} (copy)`.
   - Si `value` es un objeto no nulo → devolver un nuevo objeto con cada valor string sufijado `${v} (copy)`, dejando intactos los valores no-string.
   - Si `value` es null/undefined → devolverlo sin cambios.

Wiring en `src/collections/Pages/index.ts`:
   - Importar `{ uniqueSlugBeforeDuplicate, suffixTitleBeforeDuplicate }` desde `./hooks/beforeDuplicatePage`.
   - Campo `slug`: cambiar la línea `slugField()` (última entrada de `fields`) por `slugField('title', { hooks: { beforeDuplicate: [uniqueSlugBeforeDuplicate] } })`. deepMerge conserva el `beforeValidate` existente.
   - Campo `title` (el `{ name: 'title', type: 'text', required: true, localized: true, ... }`): agregar `hooks: { beforeDuplicate: [suffixTitleBeforeDuplicate] }` al objeto del campo.
   - NO tocar el bloque `hooks:` de la colección (no existe `beforeDuplicate` a nivel colección). NO setear `disableDuplicate` (Duplicate debe quedar habilitado — es lo que PAGES-02 pide).

Nota (no implementar guard salvo que tsc lo exija): `syncKeywordsAfterPostSave` (afterChange) es seguro sobre un doc duplicado — guarda con `if (!doc.slug) return doc`, envuelve todo en try/catch y solo busca keyword-metrics cuyo targetURL contenga el slug nuevo (improbable para `-copy`). No requiere guard adicional.
  </action>
  <verify>
    <automated>cd /Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio && grep -q "beforeDuplicate: \[uniqueSlugBeforeDuplicate\]" src/collections/Pages/index.ts && grep -q "beforeDuplicate: \[suffixTitleBeforeDuplicate\]" src/collections/Pages/index.ts && grep -q "export const uniqueSlugBeforeDuplicate" src/collections/Pages/hooks/beforeDuplicatePage.ts && grep -q "export const suffixTitleBeforeDuplicate" src/collections/Pages/hooks/beforeDuplicatePage.ts && echo WIRED</automated>
  </verify>
  <done>Existe `beforeDuplicatePage.ts` con ambos hooks exportados; `slug` y `title` en Pages referencian sus respectivos hooks `beforeDuplicate`; no se agregó ningún hook `beforeDuplicate` a nivel colección ni `disableDuplicate`.</done>
</task>

<task type="auto">
  <name>Task 2: Verificar tipos limpios y schema sin diff</name>
  <files>src/collections/Pages/hooks/beforeDuplicatePage.ts, src/collections/Pages/index.ts</files>
  <action>
Gate de calidad. PAGES-01 (infra intacta) + PAGES-02 (schema no cambia):
  - Ejecutar `pnpm exec tsc --noEmit` y confirmar 0 errores relacionados con `src/collections/Pages/**`. Si hay errores de tipos en los hooks (p. ej. el objeto por-locale del title), ajustar el tipado (`FieldHook` es genérico; usar tipos amplios y estrechar con guards en runtime, sin usar `any` innecesario).
  - Ejecutar `pnpm generate:types` y confirmar que `git diff --stat src/payload-types.ts` está vacío (un field hook no altera el schema).
  - Si `generate:types` produce diff, es señal de que se tocó la forma del campo por error → revisar el wiring del title/slug.
  </action>
  <verify>
    <automated>cd /Users/juan/Documents/Codigo/Personal/juantech/JuanPortfolio && pnpm exec tsc --noEmit && pnpm generate:types && git diff --quiet -- src/payload-types.ts && echo "TYPES_CLEAN_NO_SCHEMA_DIFF"</automated>
  </verify>
  <done>`tsc --noEmit` pasa sin errores; `git diff` de `src/payload-types.ts` vacío tras `generate:types`.</done>
</task>

<task type="checkpoint:human-verify" gate="deferred">
  <what-built>Field hooks beforeDuplicate en Pages (slug único + título sufijado). CREATE + ISR ya existían en el código.</what-built>
  <how-to-verify>
DIFERIDO (post-deploy / batch con el resto del milestone, per CONTEXT §deferred):
  1. En `/admin` → Pages: crear una página nueva, asignar slug único, publicar; abrir su ruta pública y confirmar que renderiza los bloques elegidos (criterio 1 / PAGES-01).
  2. En `/admin` → Pages: duplicar una página existente; confirmar que la copia tiene slug distinto (`-copy`), título con " (copy)", es editable de forma independiente y no altera el original (criterio 2 / PAGES-02).
  3. En preview/producción Vercel, `curl -I` la ruta pública y confirmar `x-vercel-cache: HIT` sin `no-store`/`force-dynamic` (criterio 3). No verificable 100% en local.
  </how-to-verify>
  <resume-signal>Diferido: no bloquea el cierre de código de la fase.</resume-signal>
</task>

</tasks>

<verification>
- Task 1 verify (grep de wiring) pasa.
- Task 2 verify (`tsc --noEmit` limpio + `payload-types.ts` sin diff) pasa.
- Criterio 3 (`x-vercel-cache: HIT`) y smoke visual create/duplicate en `/admin` → diferidos a check humano post-deploy (CONTEXT §deferred). El código ISR ya cumple: `revalidate = 3600`, sin `no-store`/`force-dynamic`, `draftMode()` gated.
</verification>

<success_criteria>
- [ ] PAGES-02: duplicar una Page ya no rompe por slug único; la copia obtiene `${slug}-copy` (o `-copy-N`) libre y título ` (copy)`.
- [ ] PAGES-01: infra CREATE + publicar + ISR intacta (sin cambios de ruta ni schema); verificada por `tsc` limpio.
- [ ] `beforeDuplicate` implementado a NIVEL DE CAMPO (slug + title), no a nivel colección.
- [ ] `Duplicate` sigue habilitado (sin `disableDuplicate`).
- [ ] `generate:types` sin diff.
- [ ] Criterio 3 (x-vercel-cache: HIT) documentado como check humano diferido.
</success_criteria>

<output>
Create `.planning/phases/53-fundacion-de-la-coleccion-pages/53-01-SUMMARY.md` when done
</output>
