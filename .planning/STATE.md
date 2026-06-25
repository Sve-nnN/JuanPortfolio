---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Keyword targeting & Yoast-style SEO scoring
status: "Phase 21 — plan 21-1 ejecutado (keyword data model)"
stopped_at: "Plan 21-1 completado: primaryKeyword/semanticKeywords en Pages/Categories/Users vía relación a keyword-metrics. tsc limpio (sin errores nuevos)."
last_updated: "2026-06-25T17:00:00.000Z"
last_activity: 2026-06-25 — Plan 21-1 ejecutado (keyword data model en Pages/Categories/Users)
progress:
  total_phases: 10
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 10
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-25)

**Core value:** Páginas públicas rápidas y cacheables desde el edge; el SEO técnico no emite basura que degrade indexación.
**Current focus:** Milestone v1.4 — fase 21 ✅ completa; ejecutando fase 22 (semáforo Yoast)

## Current Position

Phase: 22 (next) — fase 21 ✅ PASSED (4/4 success criteria)
Plan: —
Status: Fase 21 verificada y cerrada. Próximo: smart discuss + plan fase 22 (metrics panel + traffic light)
Last activity: 2026-06-25 — Fase 21 completa (keyword data model en Pages/Categories/Users); VERIFICATION passed

## Performance Metrics

**Velocity (v1.3 reference):**

- Total plans completed: 6 phases (v1.3, fases 15-20)
- Average duration: —
- Total execution time: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

- **Causa raíz #1 primero (v1.3):** `build-internal-links.ts` / `LinkInjector.ts` emitían `[[wikilink]]` crudo → resuelto en Phase 15.
- **`<html lang>` fijo en root + corrección cliente para `/en`:** El root layout no recibe locale por param; corrección cosmética aceptada (v1.3).
- **Traffic light en sidebar del editor (v1.4):** El semáforo Yoast vive en el sidebar del editor de Payload (no en un panel flotante ni en página separada). Confirmado con el usuario.
- **Reusa `seoAnalyzer.ts` (v1.4):** El scorer del semáforo extiende `src/plugins/seo/utils/seoAnalyzer.ts`, no crea una nueva implementación paralela.
- **Listados vía doc de categoría/autor (v1.4):** La keyword de páginas de listado (categoría, autor) se asigna en el documento de categoría/autor mismo o en un mapeo configurable; no se crea una colección nueva.
- **Phase 24 puede correr tras Phase 21:** La población de keywords desde DinoRank solo necesita que el modelo exista (KW-01..03); no necesita esperar a que el semáforo esté completo.
- **Modelo de keyword espeja Posts (21-1):** Pages usa tab Meta con `primaryKeyword` + `semanticKeywords`; Categories y Users usan `primaryKeyword` en sidebar. Todos relación a `keyword-metrics`; sin campo de texto suelto, sin relaciones reversas, sin colección nueva (KW-01..03).

### Blockers/Concerns

- **Validación pendiente (v1.3 → re-crawl Ahrefs):** El site live tiene el código de v1.3 mergeado. Validación real requiere re-crawl Ahrefs (humano, no automatizable).
- **Pages sin campo `primaryKeyword` (baseline v1.4):** Confirmado en recon: Pages collection no tiene `primaryKeyword` ni meta SEO. Phase 21 lo resuelve.
- **`keyword-metrics` ya tiene relaciones `post` y `page`:** Solo hay que agregar el campo en la colección Pages del lado Payload, no modificar keyword-metrics más allá del scope.

## Session Continuity

Last session: 2026-06-25T17:00:00.000Z
Stopped at: Plan 21-1 completado (keyword data model en Pages/Categories/Users). Próximo: siguiente plan de Fase 21.
Resume file: None
