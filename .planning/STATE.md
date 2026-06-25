---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Keyword targeting & Yoast-style SEO scoring
status: planning
last_updated: "2026-06-25T16:11:03.938Z"
last_activity: 2026-06-25
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-24)

**Core value:** Páginas públicas rápidas y cacheables desde el edge; el SEO técnico no emite basura que degrade indexación.
**Current focus:** Milestone v1.3 — código completo (fases 15-20), pendiente PR develop→main + deploy + re-crawl Ahrefs

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-06-25 — Milestone v1.4 started

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (v1.3)
- Average duration: —
- Total execution time: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

- **Causa raíz #1 primero:** `build-internal-links.ts` / `LinkInjector.ts` emiten `[[wikilink]]` crudo → explica 94 broken links + 159 broken images. Fix en Phase 15 antes de todo.
- **`<html lang>` fijo en root + corrección cliente para `/en`:** El root layout no recibe locale por param; corrección cosmética aceptada.
- **Ahrefs MCP insuficiente:** URLs afectadas se derivan del snapshot de crawl + grep del repo. Validación schema.org via MCP `schema-org` de mcp-hub.

### Blockers/Concerns

- **Validación pendiente (humano):** nada está verificado en producción hasta PR develop→main + deploy Vercel + re-crawl Ahrefs. El sitio live aún muestra el comportamiento viejo.
- **Partials (necesitan lista de URLs de Ahrefs, MCP Site Audit en plan insuficiente):** META-03 (titles cortos), META-04 (los 6 OG marcados), parte de META-01 (3er H1 missing, otras meta desc cortas), PERF-02 (6 slow pages), y los 14 schema errors exactos. Todo el schema que emite el sitio valida sin errores en mcp-hub.
- **6 posts sin publicar** desenlazados (nextjs-portfolio, payloadcms-vs-strapi, payloadcms-tutorial, nextjs-server-components, payloadcms-seo, typescript-best-practices): los .md existen pero no están en Payload/sitemap. Publicarlos y re-enlazar es trabajo aparte.
- **HREF-01** es corrección cliente/JS-render (trade-off documentado); raw HTML /en sigue lang=es.

## Session Continuity

Last session: 2026-06-24
Stopped at: v1.3 code-complete (fases 15-20) en rama seo/wikilink-remediation. Siguiente: PR develop→main, deploy, re-crawl Ahrefs para validar.
Resume file: None
