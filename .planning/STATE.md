# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-23)

**Core value:** Páginas públicas servidas como HTML cacheado desde el edge (rápido + cacheable).
**Current focus:** Milestone v1.0 code-complete — pendiente deploy + QA humano

## Current Position

Phase: 5 of 5 (QA & Verificación) — todas completas
Plan: —
Status: Milestone code-complete, verificado localmente
Last activity: 2026-06-23 — Fases 1-5 ejecutadas y commiteadas (issue #20)

Progress: [██████████] 100% (código); QA prod pendiente post-deploy

## Accumulated Context

### Decisions

Logged in PROJECT.md Key Decisions.

- La premisa del issue ("headers() marca TODO dinámico") era incompleta: la causa real de `ƒ` en home/listings era falta de `generateStaticParams` en el segmento `[locale]`. Fix combinado: quitar dynamic APIs del root + generateStaticParams+revalidate en índices + mover home + revalidate en templates.
- `draftMode()` es bypass-cookie-gated (Next 15) → no hubo que aislarlo en Suspense; los templates siguen `●`.

### Pending Todos

None.

### Blockers/Concerns

- **Verificación humana post-deploy:** (1) `x-vercel-cache: HIT` real en producción; (2) live preview de Payload sigue funcionando. Localmente equivalentes verificados (`x-nextjs-cache: HIT`), pero confirmar en Vercel.

## Session Continuity

Last session: 2026-06-23
Stopped at: Milestone v1.0 ejecutado (5 fases). Rama fix/seo-audit-issues. Listo para PR + deploy.
Resume file: None
