# Phase 21: Keyword data model - Context

**Gathered:** 2026-06-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Esta fase agrega el modelo de datos de keyword objetivo a las superficies que aún no lo tienen: la colección Pages, el doc de Categories y los autores (Users). El único mecanismo es la relación `primaryKeyword` → `keyword-metrics`, idéntico a como ya funciona en Posts. No incluye UI de métricas ni semáforo (Fase 22), ni auditoría (Fase 23), ni población de datos (Fase 24).

</domain>

<decisions>
## Implementation Decisions

### Campo keyword en Pages
- Espejar Posts 1:1: agregar `primaryKeyword` **y** `semanticKeywords` (relación `keyword-metrics`, `semanticKeywords` con `hasMany`).
- Ubicación: nuevo tab "Meta" en Pages con los campos en `admin.position: 'sidebar'`, igual que Posts.
- `relationTo: 'keyword-metrics'` idéntico a Posts.

### Keyword en listados (categoría/autor) — KW-02
- Categoría: campo `primaryKeyword` → `keyword-metrics` en el doc Categories, en `admin.position: 'sidebar'`.
- Autor: campo `primaryKeyword` → `keyword-metrics` en la colección Users (sidebar).
- No agregar relaciones reversas nuevas (category/user) a `keyword-metrics`: fuera de scope. Solo el forward relationship desde cada doc.

### Consistencia (KW-03)
- No existe ni se crea ningún campo de texto suelto paralelo para la keyword: el único mecanismo es la relación. Confirmar con grep que no haya texto suelto en Posts/Pages.
- Sin migración de datos en esta fase (la población es Fase 24).

### Claude's Discretion
- Detalle de labels es/en de los campos nuevos (seguir el patrón bilingüe existente).
- Si el tab "Meta" de Pages debe contener algo más allá de los dos campos keyword (mantener mínimo).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/collections/Posts/index.ts:152-167` — patrón exacto de `primaryKeyword` + `semanticKeywords` (relationship a `keyword-metrics`, `position: sidebar`, dentro del tab "Meta").
- `src/collections/KeywordMetrics.ts` (slug `keyword-metrics`) — colección destino; ya tiene relaciones `post` y `page`.
- `src/collections/Pages/index.ts` — Pages no tiene keyword ni tab Meta; usa tabs (hero/homeSections/content/searchConsole).
- `src/collections/Categories.ts` — usa tabs (Categoría/SEO); SEO vía `seoFields()`. Campos sidebar ya presentes (liveUrl, indexingControl, indexStatus).
- `src/collections/Users/index.ts` — colección de autores.

### Established Patterns
- Campos de relación a keyword-metrics con `admin.position: 'sidebar'`.
- Labels bilingües `{ en, es }`.
- `syncKeywordsAfterPostSave` ya está enganchado en `Pages.hooks.afterChange` (reutilizado de Posts) — verificar que tolere el nuevo `primaryKeyword` en Pages sin romper.

### Integration Points
- `src/payload-types.ts` se regenera tras cambiar collections (`payload generate:types`).
- CI corre type-check sobre scripts y build de Payload.

</code_context>

<specifics>
## Specific Ideas

- Mantener el campo `primaryKeyword` de Posts intacto (no regresión).
- keyword-metrics no se modifica más allá de su uso como `relationTo`.

</specifics>

<deferred>
## Deferred Ideas

- Panel de métricas de la keyword en el editor (Fase 22).
- Semáforo Yoast (Fase 22).
- Auditoría de cobertura (Fase 23).
- Población de keywords desde DinoRank (Fase 24).

</deferred>
