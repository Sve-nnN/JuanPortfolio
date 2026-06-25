---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Keyword targeting & Yoast-style SEO scoring
status: roadmapped
last_updated: "2026-06-25T00:00:00.000Z"
last_activity: 2026-06-25
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-25)

**Core value:** Páginas públicas rápidas y cacheables desde el edge; el SEO técnico no emite basura que degrade indexación.
**Current focus:** Milestone v1.4 — roadmap definido (fases 21-24), listo para planear fase 21

## Current Position

Phase: 21 (not started)
Plan: —
Status: Roadmapped — próximo paso `/gsd:plan-phase 21`
Last activity: 2026-06-25 — Roadmap v1.4 creado (fases 21-24)

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

### Blockers/Concerns

- **Validación pendiente (v1.3 → re-crawl Ahrefs):** El site live tiene el código de v1.3 mergeado. Validación real requiere re-crawl Ahrefs (humano, no automatizable).
- **Pages sin campo `primaryKeyword` (baseline v1.4):** Confirmado en recon: Pages collection no tiene `primaryKeyword` ni meta SEO. Phase 21 lo resuelve.
- **`keyword-metrics` ya tiene relaciones `post` y `page`:** Solo hay que agregar el campo en la colección Pages del lado Payload, no modificar keyword-metrics más allá del scope.

## Session Continuity

Last session: 2026-06-25
Stopped at: Roadmap v1.4 creado. Fases 21-24 definidas. Próximo: `/gsd:plan-phase 21` (keyword data model).
Resume file: None
