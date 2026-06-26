---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Keyword targeting & Yoast-style SEO scoring
status: executing
stopped_at: "Fase 22 completa (código + 768 tests + review clean, todos los hallazgos corregidos). Validación visual del semáforo DIFERIDA (checklist en 22-VERIFICATION.md). Ejecutando Fase 23 (coverage audit)."
last_updated: "2026-06-25T17:22:26.834Z"
last_activity: 2026-06-25 — Fase 22 plan 22-2 ejecutado (panel de métricas + semáforo Yoast en sidebar); pendiente verificación visual humana
progress:
  total_phases: 10
  completed_phases: 2
  total_plans: 3
  completed_plans: 3
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-25)

**Core value:** Páginas públicas rápidas y cacheables desde el edge; el SEO técnico no emite basura que degrade indexación.
**Current focus:** Milestone v1.4 — fases 21 ✅ y 22 ✅ (visual diferido); ejecutando fase 23 (coverage audit)

## Current Position

Phase: 23 (next) — coverage audit. Fases 21 ✅, 22 ✅ (human_needed visual diferido por decisión de Juan)
Plan: —
Status: Fase 22 cerrada a nivel código (review clean, 768 tests). Próximo: smart discuss + plan fase 23.
Last activity: 2026-06-25 — Fase 22 review findings corregidos; VERIFICATION human_needed (visual diferido)

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
- **Análisis en server, UI dependency-light (22-2):** El componente cliente importa solo tipos de `keywordScore.ts` y llama al endpoint `/api/seo/keyword-score` debounced ~300ms; `natural` nunca se bundlea en el admin. Content path se ramifica por `collectionSlug` (content.content en Posts, content.layout en Pages).

### Blockers/Concerns

- **Validación pendiente (v1.3 → re-crawl Ahrefs):** El site live tiene el código de v1.3 mergeado. Validación real requiere re-crawl Ahrefs (humano, no automatizable).
- **Pages sin campo `primaryKeyword` (baseline v1.4):** Confirmado en recon: Pages collection no tiene `primaryKeyword` ni meta SEO. Phase 21 lo resuelve.
- **`keyword-metrics` ya tiene relaciones `post` y `page`:** Solo hay que agregar el campo en la colección Pages del lado Payload, no modificar keyword-metrics más allá del scope.

## Session Continuity

Last session: 2026-06-25T17:22:26.831Z
Stopped at: Plan 21-1 completado (keyword data model en Pages/Categories/Users). Próximo: siguiente plan de Fase 21.
Resume file: None
