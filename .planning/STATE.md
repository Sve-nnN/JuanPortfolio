# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-23)

**Core value:** Páginas públicas servidas como HTML cacheado desde el edge (rápido + cacheable).
**Current focus:** Phase 1 — Nuevo [locale]/layout.tsx

## Current Position

Phase: 1 of 5 (Nuevo [locale]/layout.tsx)
Plan: — (pendiente plan-phase)
Status: Ready to plan
Last activity: 2026-06-23 — Roadmap v1.0 creado (5 fases, 15 reqs, cobertura 100%)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Bootstrap: `<html lang>` fijo + corrección cliente para `/en`; chrome y locale a `[locale]/layout.tsx`; `/` reescrito a `/es` en middleware; AdminBar sin prop `preview` (autodetección cliente).

### Pending Todos

None yet.

### Blockers/Concerns

- Landmine de routing: el nuevo `[locale]/layout.tsx` debe existir ANTES de borrar `(frontend)/page.tsx` (Phase 2 depende de Phase 1).
- El live preview de Payload no debe romperse al aislar `draftMode()` — validar en Phase 3 antes de activar ISR.

## Session Continuity

Last session: 2026-06-23
Stopped at: Roadmap v1.0 creado — listo para `/gsd:plan-phase 1`
Resume file: None
