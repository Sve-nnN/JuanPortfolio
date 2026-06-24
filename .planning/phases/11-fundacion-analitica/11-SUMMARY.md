# Phase 11 Summary: Fundación de analítica

**Completed:** 2026-06-24

## What changed
- `src/utilities/analytics.ts` — `trackEvent` ahora pushea SOLO al dataLayer (sin gtag directo → sin doble conteo). Tipos `AnalyticsEvent`/`AnalyticsParams`, sanitización (anti-PII + truncado 100 chars), y helper `gaAttrs()` que genera `data-analytics`/`data-ga-*` para spreadear en cualquier elemento (incluso server components).
- `src/providers/Analytics/index.tsx` (NEW) — provider cliente con delegación global de clicks: captura `[data-analytics]` + `data-ga-*` y emite el evento. Sin client code por componente. (También scroll/tiempo, ver Fase 13.)
- `src/app/(frontend)/layout.tsx` — monta `<AnalyticsProvider/>` (cubre todo el sitio).
- `docs/analytics-events.md` — taxonomía completa.

## Requirements: CORE-01..04 ✓
Outbound/downloads se delegan a GA4 Enhanced Measurement (documentado, sin doble conteo).
