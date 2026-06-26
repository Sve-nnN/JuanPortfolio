---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Limpieza y alineación del admin de Payload
status: roadmapped
last_updated: "2026-06-26T19:10:00.000Z"
last_activity: "2026-06-26 — v1.5 fases 26-28 completas (CLEAN-01/02/03, SCRIPT-01); pausa antes de 29"
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-26)

**Core value:** Páginas públicas rápidas y cacheables desde el edge; el SEO técnico no emite basura que degrade indexación. Para v1.5: el admin de Payload solo contiene código vivo y coherente.
**Current focus:** Milestone v1.5 roadmapped (fases 25-30). Refactor brownfield del admin: verificar runtime → borrar muerto → endurecer → consistencia.

## Current Position

Phase: 25 — Verificación runtime de integraciones (gate)
Plan: —
Status: Roadmap creado, pendiente planificar Phase 25
Last activity: 2026-06-26 — Roadmap v1.5 creado (6 fases, 25-30, cobertura 10/10 reqs)

## Milestone v1.5 — Estructura de fases

| Phase | Goal | Requirements | Gate |
|-------|------|--------------|------|
| 25 | Verificación runtime de integraciones (Ahrefs/DinoRank/Indexing/GSC) | VERIFY-01 | Gate humano: Juan valida en `pnpm dev` antes de borrar nada |
| 26 | Retirar plugin SEO fantasma preservando 4 módulos vivos | CLEAN-01 | tsc/vitest/admin verdes |
| 27 | Colapsar `domains/` + borrar backups/re-exports | CLEAN-02, CLEAN-03 | tsc/vitest/admin verdes |
| 28 | Limpieza de scripts one-off | SCRIPT-01 | package.json intacto, build verde |
| 29 | Accesos endurecidos + assets unificados | SEC-01, ASSET-01 | cron sigue, imágenes 200 |
| 30 | Consistencia admin (group/labels/nav) | CONSIST-01/02/03 | cosmético, tests verdes |

**Constante brownfield (todas las fases 26-30):** no introducir errores nuevos de tsc sobre el baseline (114), tests verdes (775+), admin arranca tras regenerar el importMap.

## Validaciones visuales pendientes (diferidas por Juan)

- Fase 22: semáforo Yoast en sidebar (checklist en 22-VERIFICATION.md)
- Fase 23: vista admin de cobertura (checklist en 23-VERIFICATION.md)

## Deferred Items

Items acknowledged y diferidos al cierre del milestone v1.5 (2026-06-26):

| Category | Item | Status |
|----------|------|--------|
| verification | VERIFY-01 — gate runtime integraciones (Ahrefs/DinoRank/Indexing/GSC) | human_needed (checklist en 25-RUNTIME-CHECKLIST.md) |
| requirement | ASSET-01 — migración storage Blob→Cloudinary | deferred a milestone propio (riesgo prod) |
| verification | Fases 03/04/10 (milestones viejos) — visual | human_needed (ya shipped) |
| verification | Fases 22/23 (v1.4) — visual admin | human_needed (diferido) |


## Performance Metrics

**Velocity (v1.4 reference):**

- Total plans completed: 4 fases / 7 plans (v1.4, fases 21-24)
- Average duration: —
- Total execution time: —

*Updated after each plan completion*

## Accumulated Context

### Decisions (v1.5)

- **VERIFY-01 como gate primero (Phase 25):** Confirmar en runtime qué integraciones (Ahrefs/DinoRank/Indexing/GSC) funcionan ANTES de borrar código dependiente. Es checklist humano; Juan valida con credenciales reales en `pnpm dev` y el veredicto se registra aquí antes de tocar nada.
- **CLEAN-01 conserva 4 módulos vivos (Phase 26):** Al borrar `src/plugins/seo/` se preservan y reubican `seoAnalyzer.ts`, `keywordCoverageAudit.ts`, `fields/seoFields.ts`, `types/keywordScore.ts` (destino propuesto `src/lib/seo/`). Consumidores que deben seguir vivos: `/api/seo/keyword-score`, `/api/seo/keyword-coverage`, `KeywordScorePanel`, `KeywordCoverageView`, script `audit-keywords`, `seoFields` en Users/Categories.
- **CLEAN-02 mueve solo AdBanner (Phase 27):** El único vivo de `src/domains/**` es `ad-banners/domain/AdBanner.ts` (importado en `payload.config.ts:21`). Se mueve a `src/collections/`, se repunta la config y se borra el resto de `domains/`.
- **SEC + ASSET juntos (Phase 29):** Son los dos cambios de comportamiento (no solo borrado); se agrupan porque ambos requieren verificación funcional (cron sigue escribiendo métricas; imágenes existentes siguen sirviéndose).
- **CONSIST al final (Phase 30):** Cosmético (group/labels/nav) tras la limpieza estructural.

### Decisions (v1.4, contexto previo)

- **Reusa `seoAnalyzer.ts`:** El scorer del semáforo extiende `seoAnalyzer.ts` (módulo vivo que la Phase 26 debe preservar al reubicarlo).
- **primaryKeyword localizado es/en en las 4 colecciones (24-01):** `localized: true` en Posts/Pages/Categories/Users; Mongo schemaless → sin migración.

### Blockers/Concerns

- **Baseline tsc 114 errores + 775+ tests:** Toda fase de limpieza (26-30) se mide contra este baseline: 0 errores nuevos, tests verdes, admin arranca con importMap regenerado.
- **Gate Phase 25 pendiente:** No iniciar el borrado (fases 26+) hasta que Juan firme el checklist de integraciones con credenciales reales (caveats conocidos: login DinoRank, OAuth GSC, API key Ahrefs/Indexing).
- **Overlap Cloudinary vs Vercel Blob:** Media usa Blob como storage real pero conviven botones Cloudinary; ASSET-01 (Phase 29) debe elegir una y borrar la otra sin romper imágenes existentes.

## Session Continuity

Last session: 2026-06-26T19:10:00.000Z
Stopped at: Roadmap v1.5 creado (fases 25-30, cobertura 10/10).
Resume file: None

## Operator Next Steps

- Planificar la primera fase con `/gsd:plan-phase 25`
</content>
