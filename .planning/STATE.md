# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-23)

**Core value:** Páginas públicas rápidas y cacheables desde el edge.
**Current focus:** Milestone v1.1 (CWV) code-complete — pendiente Lighthouse post-deploy

## Current Position

Phase: 10 of 10 — todas completas (fases 6-10)
Status: v1.1 code-complete, verificado estructuralmente
Last activity: 2026-06-23 — Fases 6-10 ejecutadas (CWV/perf)

Progress: [██████████] 100% (código); Lighthouse real pendiente post-deploy

## Accumulated Context

### Decisions

- **Calendly era el 80% del problema de perf** (2.6MB + Stripe). Se difiere con IntersectionObserver → fuera del load inicial.
- browserslist ya moderno; polyfills residuales son de dependencia (no se toca).
- llms.txt OK; el fallo agéntico es Cloudflare challenge, no código.

### Blockers/Concerns

- **Post-deploy (humano):** Lighthouse mobile real (LCP/TBT vs baseline 8.6s/1740ms); DevTools Network (Calendly carga al scrollear).

## Session Continuity

Last session: 2026-06-23
Stopped at: v1.1 ejecutado (fases 6-10). Rama perf/cwv-optimization. Listo para PR develop→main.
Resume file: None
