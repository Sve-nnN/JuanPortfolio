# Phase 23: Coverage audit - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Una auditoría repetible de cobertura de keywords sobre Posts + Pages + listados (categorías y autores/Users). Produce dos listas: (1) páginas SIN `primaryKeyword` asignada, y (2) páginas CON keyword pero que fallan ≥1 check del semáforo, con el detalle de qué checks fallan. Entregada como script tsx (`pnpm audit:keywords`) **y** una vista en el admin de Payload, ambos compartiendo la misma función core de auditoría. Salida en consola con colores + reporte markdown versionable. No incluye población de keywords (Fase 24).

</domain>

<decisions>
## Implementation Decisions

### Entrega
- **Script tsx + vista admin**, ambos consumiendo una **función core pura/compartida** `runKeywordCoverageAudit()` (sin duplicar lógica).
- Script: espeja el patrón de `src/scripts/audit-urls.ts` (getPayload + configPromise, salida con colores ANSI). Alias en package.json `audit:keywords` → `tsx -r dotenv/config src/scripts/...`.
- Vista admin: vista custom de Payload (no un field) que corre la auditoría on-demand y muestra las 2 listas en tabla. Reutiliza el estilo admin existente (referencia: GSCDashboard / DomainRatingCard).
- Repetible sin datos stale hardcoded (AUDIT-03): cada corrida consulta el estado actual de la DB.

### Scope
- Posts + Pages + **listados** (categorías + autores/Users), todos con `primaryKeyword` desde Fase 21.

### Lógica de checks
- Reusa `analyzeKeywordChecks` (ya puro y testeado en Fase 22) con la **misma extracción de contenido** que el endpoint (`data.content.content` richText para Posts, `data.content.layout` blocks para Pages).
- **Listados sin body (categorías/autores):** correr solo los checks aplicables (keyword en title/meta/slug); marcar los checks de contenido (densidad/primer-párrafo/subtítulos/H1) como **N/A**, no como fallo.

### Salida
- Consola con colores (resumen + 2 listas).
- **Reporte markdown escrito a `content/keyword-coverage-audit.md`** (versionable, junto a `content/keywords.md`). Incluir timestamp de corrida y conteos.

### Claude's Discretion
- Estructura exacta del markdown y de la tabla en la vista admin.
- Cómo resolver el "fail" agregado (cualquier check rojo, o también ámbar) — sugerido: lista 2 = ≥1 check en rojo; ámbar se reporta como warning aparte.
- Dónde registrar la vista admin en la config de Payload.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/scripts/audit-urls.ts` — patrón canónico de script de auditoría: getPayload + `@payload-config`, helpers de color ANSI, args via process.argv, query a colecciones.
- `src/plugins/seo/utils/seoAnalyzer.ts` — `analyzeKeywordChecks` (puro, síncrono tras fix Fase 22) + extractores; base de la lista 2.
- `src/app/api/seo/keyword-score/route.ts` — referencia de cómo arma el input (keyword + title + meta + slug + content) y llama al analyzer; replicar esa extracción en el core de auditoría.
- `src/components/admin/GSCDashboard.tsx`, `DomainRatingCard.tsx` — patrón de vista/componente admin con fetch + tabla.
- `src/plugins/seo/types/keywordScore.ts` — tipos compartidos.

### Established Patterns
- Scripts via `tsx -r dotenv/config`, alias en package.json.
- `natural` server-side only — la función core corre en script/endpoint (server), nunca en el bundle del admin client. Si la vista admin necesita los datos, debe llamar a un endpoint que corra el core server-side (igual que keyword-score), no importar el analyzer en el cliente.
- Labels/UI bilingües.

### Integration Points
- package.json scripts → `audit:keywords`.
- Registrar la vista admin en la config de Payload (admin.components.views o un endpoint + componente).
- Escribir reporte a `content/keyword-coverage-audit.md`.

</code_context>

<specifics>
## Specific Ideas

- La vista admin y el script comparten core: la vista llama a un endpoint server (reusa o extiende el patrón de keyword-score) para no arrastrar `natural` al cliente.
- El reporte versionable sirve para trackear progreso de cobertura entre corridas.

</specifics>

<deferred>
## Deferred Ideas

- Población automática de keywords (Fase 24).
- Tracking histórico del score por página (Future).
- Programar la auditoría en CI (Future).

</deferred>
