# Phase 29: Accesos endurecidos y assets (SEC-01, ASSET-01) - Context

**Gathered:** 2026-06-26
**Status:** Done (SEC-01) / ASSET-01 deferred

<decisions>
- SEC-01: create/update/delete de keyword-metrics/page-metrics/gsc-metrics → `authenticated`; read abierto. Scripts usan Local API (overrideAccess) → no afectados.
- ASSET-01: DIFERIDO a milestone propio. Hallazgo: Blob=backend de upload, Cloudinary=CDN (frontend ya sirve cloudinaryUrl). Quitar Blob = migración de storage con riesgo en prod, no cleanup. Decidido con Juan diferir.
</decisions>
