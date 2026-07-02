# Phase 24: Keyword research population - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Poblar `primaryKeyword` en cada Post y Page mapeado en `content/keywords_map.json`, leyendo el research de DinoRank, y garantizar que cada keyword asignada tenga su doc de `keyword-metrics` con volume/difficulty/intent; las que no tienen datos quedan marcadas (`status: needs-research`) para que la auditoría de Fase 23 las liste. Incluye un cambio de modelo: `primaryKeyword` pasa a ser **localizado** (keyword es/en distinta por doc), con el ripple correspondiente en el semáforo (Fase 22) y la auditoría (Fase 23) para hacerlos locale-aware.

</domain>

<decisions>
## Implementation Decisions

### Cambio de modelo: primaryKeyword localizado (DECISIÓN DE JUAN — afecta fases 21/22/23)
- `primaryKeyword` pasa a `localized: true` en **Posts y Pages** (y por consistencia en Categories/Users). Esto permite keyword es y en distintas por documento, fiel al research bilingüe.
- Regenerar `payload-types.ts`.
- **RIPPLE a manejar en este plan (no romper lo ya shipped):**
  - **Fase 22 (semáforo/endpoint):** `KeywordScorePanel` lee `primaryKeyword` del form state del locale activo — verificar que sigue funcionando con campo localizado. El endpoint `/api/seo/keyword-score` y el fetch de keyword-metrics deben respetar el locale activo.
  - **Fase 23 (auditoría):** `keywordCoverageAudit` debe volverse **locale-aware**: evaluar cobertura por locale (un doc puede tener keyword en es pero no en en). Reportar por locale o marcar el locale faltante. El endpoint `/api/seo/keyword-coverage` y la vista deben reflejarlo.
  - Actualizar tests afectados (seoAnalyzer/coverage) para el campo localizado.

### Pipeline
- **Prerequisito:** `pnpm sync:keywords` ya puebla/upserta `keyword-metrics` desde `content/keywords.md` (líneas 520-523 de syncKeywords.ts). Documentarlo / invocarlo como paso previo.
- **Script nuevo** (ej. `pnpm populate:keywords` / `link:keywords`): lee `content/keywords_map.json` (136 entradas slug→keyword), matchea el doc de `keyword-metrics` por **string de keyword exacto (insensible a may/acentos)**, y setea `primaryKeyword` en el post/page correspondiente **por locale**.

### Matching
- keyword-metrics: por string de keyword (insensible may/acentos).
- slug→doc: resolver el sufijo de locale de las claves del map: `slug` (locale por defecto es) / `slug.es` / `slug.en` → buscar el post/page por slug y setear `primaryKeyword` en el locale correspondiente.

### Overwrite + faltantes
- **No pisar** docs que ya tienen `primaryKeyword` (en ese locale); setear solo donde falta. Flag `--force` para sobreescribir.
- **Keyword del map sin doc en keyword-metrics:** crear un **stub** `keyword-metrics` con `status: 'needs-research'` y linkearlo (RESEARCH-02), para que la auditoría de Fase 23 lo liste.
- Keywords con doc pero sin volume/difficulty/intent → marcar `status: 'needs-research'`.

### Seguridad / repetibilidad
- Script idempotente con **--dry-run** y reporte (consola + opcional markdown), espejando el patrón de `audit-keywords.ts` / `audit-urls.ts`.
- Working tree sucio: el script solo escribe en DB (Payload), no toca archivos de Juan salvo el reporte.

### Claude's Discretion
- Nombre exacto del script/alias.
- Formato del reporte.
- Si Categories/Users también se localizan ahora o se deja solo Posts/Pages (mínimo Posts/Pages; recomendado los 4 por consistencia del panel locale-aware).
- Cómo exactamente la auditoría reporta cobertura por locale (columna locale vs dos pasadas).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/scripts/syncKeywords.ts` — ya parsea `content/keywords.md` (tabla rica: Keyword|Target URL|Language|Volume|Difficulty|Intent|Status|...) y upserta `keyword-metrics` (find/update/create por keyword, líneas 520-523). NO setea `primaryKeyword`. KeywordData interface define todos los campos.
- `content/keywords_map.json` — 136 entradas `slug(.locale)?` → keyword string.
- `content/keywords.md` — research DinoRank con métricas por keyword.
- `src/collections/KeywordMetrics.ts` — campo `status` (text) reutilizable para 'needs-research'; tiene `volume`, `difficulty`, `intent` (select), relaciones `post`/`page`. NO agregar campos nuevos (fuera de scope).
- `src/collections/Posts/index.ts` / `Pages/index.ts` — `primaryKeyword` (Fase 21), hoy NO localizado → se localiza acá.
- `src/scripts/audit-keywords.ts` + `src/plugins/seo/utils/keywordCoverageAudit.ts` (Fase 23) — a actualizar para locale-awareness.
- `src/components/admin/KeywordScorePanel.tsx` + `src/app/api/seo/keyword-score/route.ts` (Fase 22) — a verificar/actualizar para locale.

### Established Patterns
- Scripts `tsx -r dotenv/config`, getPayload + `@payload-config`, salida ANSI, args process.argv, alias en package.json.
- Payload localized fields: el valor por locale se setea con `locale` en payload.update / find.

### Integration Points
- package.json scripts (nuevo alias).
- `payload generate:types` tras localizar primaryKeyword.
- Posible `payload generate:importmap` si cambia algún componente.

</code_context>

<specifics>
## Specific Ideas

- El research ya existe (keywords.md / keywords_map.json poblado vía DinoRank); NO rehacer research (out of scope del milestone).
- Tras correr, la auditoría de Fase 23 debe mostrar mucha menos cobertura faltante (baseline actual: 53 sin keyword / 26 fallando de 79).

</specifics>

<deferred>
## Deferred Ideas

- Rehacer keyword research desde cero (out of scope).
- Sugerencias automáticas de keyword en vivo (Future).
- Tracking histórico del score (Future).
</deferred>
