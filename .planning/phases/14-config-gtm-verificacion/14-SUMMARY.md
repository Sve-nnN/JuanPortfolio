# Phase 14 Summary: Config GTM/GA4 & verificación

**Completed:** 2026-06-24

## What changed
- `docs/analytics-gtm-setup.md` — setup one-time en GTM: GA4 Config tag, trigger custom-event regex `.*`, GA4-Event tag con name={{Event}} + params (dataLayer Variables), Enhanced Measurement (qué es auto vs custom), marcar `generate_lead`/`schedule_meeting` como conversiones, y cómo verificar (DebugView/GTM Preview/console).

## Verification
- `tsc --noEmit` → 0 errores en `src/` (errores en `tests/` son pre-existentes, no rompen `next build`).
- `next build` verde; `data-analytics`/`data-ga-*` renderizan en el SSR.
- Sin PII (sanitización en trackEvent). Sin doble conteo (dataLayer-only).

## Requirements: CFG-01..03 ✓ (DebugView real lo confirma Juan tras crear el tag en GTM)
