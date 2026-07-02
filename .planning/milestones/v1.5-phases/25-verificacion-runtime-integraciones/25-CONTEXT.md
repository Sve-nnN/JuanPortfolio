# Phase 25: Verificación runtime de integraciones (gate) - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning
**Mode:** Checklist humano (gate). El deliverable es un doc reproducible; la ejecución la firma Juan con credenciales reales.

<domain>
## Phase Boundary

Producir un checklist reproducible que confirme, en `pnpm dev` con credenciales reales, el estado de las 4 integraciones del admin (Ahrefs, DinoRank, Indexing API, GSC) y mapear sus archivos/rutas dependientes, ANTES de borrar cualquier código en las fases 26-30. No incluye borrado ni refactor — solo verificación y registro del veredicto.

</domain>

<decisions>
## Implementation Decisions

- El checklist vive en el dir de fase (`25-RUNTIME-CHECKLIST.md`) y el veredicto firmado se registra en STATE.md como gate.
- Cada integración se marca **funcional / rota / a-conservar** con evidencia (status code, nota o captura).
- Se lista el código dependiente por integración para blindarlo de las fases de limpieza.
- Es un gate humano: el autónomo PAUSA aquí hasta que Juan ejecute y confirme.

### Claude's Discretion
- Formato exacto del checklist.

</decisions>

<code_context>
## Existing Code Insights

### Rutas/archivos por integración (de `.planning/admin-audit-v1.5.md`)
- **Ahrefs (Domain Rating):** `src/app/api/domain-rating/route.ts`; componente `src/components/admin/DomainRatingCard.tsx` (beforeDashboard). Necesita API key/MCP.
- **DinoRank:** `src/app/api/dinorank/redactar/route.ts`; componente `src/components/admin/DinoRankWriteButton.tsx` (sidebar Posts); soporte `src/scripts/dinorank/*`, `scrape-dinorank.ts`. Caveat login.
- **Indexing API (Google):** `src/app/api/seo/indexing/route.ts`; componente `src/components/admin/IndexingControl.tsx` (Posts/Pages/Categories). Necesita creds Indexing API.
- **GSC:** componentes `GSCSummary`/`GSCDashboard`/`GSCField`/`GSCCell`/`GSCAnalysis`; colecciones `gsc-metrics`/`page-metrics`; script `src/scripts/seo/sync-gsc.ts`. Necesita OAuth GSC.

</code_context>

<specifics>
## Specific Ideas
- Ninguna de las fases 26-30 debe tocar código de una integración marcada "viva/a-conservar".
</specifics>

<deferred>
## Deferred Ideas
- Reparar integraciones rotas (si las hay) — se decide tras el veredicto; podría abrir fase aparte.
</deferred>
