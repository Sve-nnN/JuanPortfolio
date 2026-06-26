---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Keyword targeting & Yoast-style SEO scoring
status: "Plan 24-02 completado (población live: 136/136 keywords seteadas por locale; no-keyword 79→9 es / 8 en; 776 tests, tsc baseline 114 intacto). Fase 24 completa → milestone v1.4 completo."
stopped_at: "Plan 24-02 completado (populate-keywords.ts live + stubs needs-research). Fase 24 y milestone v1.4 completos."
last_updated: "2026-06-26T08:40:00.000Z"
last_activity: "2026-06-26 — Plan 24-02: primaryKeyword poblado por locale desde keywords_map.json (live), 776 tests verdes"
progress:
  total_phases: 10
  completed_phases: 4
  total_plans: 7
  completed_plans: 7
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-25)

**Core value:** Páginas públicas rápidas y cacheables desde el edge; el SEO técnico no emite basura que degrade indexación.
**Current focus:** Milestone v1.4 — fases 21 ✅ 22 ✅ 23 ✅ (visuales admin diferidos); ejecutando fase 24 (keyword research population)

## Current Position

Phase: 24 ✅ completa — keyword research population. Fases 21 ✅, 22 ✅, 23 ✅ (22/23 human_needed visual diferido). Milestone v1.4 completo.
Plan: 24-02 ✅ — populate-keywords.ts (live): 136/136 keywords seteadas por locale; stubs needs-research para keywords sin doc; docs sin métricas marcados. RESEARCH-01/02 cerrados.
Status: Plan 24-02 completado. Auditoría no-keyword 79→9 (es) / 8 (en). 776 tests verdes, tsc baseline 114 intacto.
Last activity: 2026-06-26 — Plan 24-02: primaryKeyword poblado por locale desde keywords_map.json (live), 776 tests verdes

## Validaciones visuales pendientes (diferidas por Juan)

- Fase 22: semáforo Yoast en sidebar (checklist en 22-VERIFICATION.md)
- Fase 23: vista admin de cobertura (checklist en 23-VERIFICATION.md)

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
- **Población de keywords idempotente + stubs needs-research (24-02):** `pnpm populate:keywords` lee keywords_map.json (136), matchea keyword-metrics por keyword normalizado (NFD, sin acentos, lowercase) y setea primaryKeyword por locale (sin clobber salvo `--force`; `--dry-run`/`--report`). Keywords sin doc → stub keyword-metrics `status:needs-research` (volume/difficulty/source seedeados, sin campos nuevos) y linkeado; docs sin volume/difficulty/intent → marcados needs-research. Corrió live: 136/136 seteadas. Caveats: usar `context:{disableRevalidate:true}` al escribir desde scripts (revalidatePath no existe fuera de Next) y `withRetry` para TransientTransactionError de Mongo Atlas. Prereq operador: `pnpm sync:keywords` antes para enriquecer stubs por upsert exacto.
- **primaryKeyword localizado en las 4 colecciones (24-01):** `localized: true` en Posts/Pages/Categories/Users (keyword es/en distinta por doc). Mongo schemaless → sin migración; valores planos previos quedan fuera del slot de locale y se re-pueblan en 24-02 desde keywords_map.json. El tipo TS de la relación no cambia. Panel (fase 22) y audit (fase 23) ya eran locale-aware: con el campo localizado, consultar por locale resuelve la keyword del locale.

### Blockers/Concerns

- **Validación pendiente (v1.3 → re-crawl Ahrefs):** El site live tiene el código de v1.3 mergeado. Validación real requiere re-crawl Ahrefs (humano, no automatizable).
- **Pages sin campo `primaryKeyword` (baseline v1.4):** Confirmado en recon: Pages collection no tiene `primaryKeyword` ni meta SEO. Phase 21 lo resuelve.
- **`keyword-metrics` ya tiene relaciones `post` y `page`:** Solo hay que agregar el campo en la colección Pages del lado Payload, no modificar keyword-metrics más allá del scope.

## Session Continuity

Last session: 2026-06-26T08:40:00.000Z
Stopped at: Plan 24-02 completado (populate-keywords.ts live + stubs needs-research). Fase 24 y milestone v1.4 completos.
Resume file: None
