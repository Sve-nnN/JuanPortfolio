# Roadmap: JuanPortfolio — Milestone v1.2 (GA4 Analytics Tracking)

## Overview

Cobertura GA4 completa en 4 fases. Primero la fundación escalable (helper dataLayer-only + delegación global por `data-analytics` → instrumenta sitewide sin tocar cada componente), luego las conversiones de alto valor, el engagement de contenido, y el doc de GTM/GA4 + verificación.

## Phases

- [ ] **Phase 11: Fundación de analítica** - helper dataLayer-only + delegación global de clicks (data-attributes) + taxonomía
- [ ] **Phase 12: Eventos de conversión** - contacto (generate_lead), Calendly, CTAs, switcher de idioma
- [ ] **Phase 13: Eventos de engagement** - scroll depth, tiempo/lectura, blog, navegación, búsqueda
- [ ] **Phase 14: Config GTM/GA4 & verificación** - doc del tag forward + Enhanced Measurement + verificar dataLayer/DebugView

## Phase Details

### Phase 11: Fundación de analítica
**Goal**: Base escalable para trackear cualquier interacción sin cablear componente por componente
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04
**Success Criteria**:
  1. `trackEvent` pushea solo al dataLayer (sin gtag directo); tipos/nombres consistentes
  2. Un provider cliente con delegación global captura clicks en `[data-analytics]` con sus `data-*` params
  3. Outbound links/descargas se trackean sin duplicar lo ya instrumentado
  4. `docs/analytics-events.md` lista la taxonomía (nombre, params, mapeo GA4)

### Phase 12: Eventos de conversión
**Goal**: Las acciones que importan (lead, reunión, CTA, idioma) emiten eventos GA4
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04
**Success Criteria**:
  1. Submit del form de contacto emite `generate_lead` (éxito y error) sin PII
  2. Reserva en Calendly (postMessage `event_scheduled`) emite `schedule_meeting`
  3. CTAs primario/secundario (incluidos botones nativos) emiten `cta_click` con label+ubicación
  4. El switcher de idioma emite `language_switch` con from/to

### Phase 13: Eventos de engagement
**Goal**: Medir consumo de contenido y navegación
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05
**Success Criteria**:
  1. Scroll depth 25/50/75/100% emite `scroll_depth` una vez por hito por página
  2. Páginas de contenido emiten `content_engagement` por hitos de tiempo/lectura
  3. Posts relacionados emiten `select_content`; TOC/code-copy siguen funcionando
  4. Nav de header/footer emite `navigation_click`; la búsqueda emite `search`

### Phase 14: Config GTM/GA4 & verificación
**Goal**: Que los eventos lleguen a GA4 y quede documentado el setup
**Requirements**: CFG-01, CFG-02, CFG-03
**Success Criteria**:
  1. `docs/analytics-gtm-setup.md` explica el tag GA4-Event forward + trigger custom-event y el Enhanced Measurement
  2. Verificación: los eventos aparecen en el dataLayer (y en GA4 DebugView cuando Juan cree el tag); sin doble conteo
  3. Sin PII en params; build/CI verdes

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| 11. Fundación de analítica | ✅ Complete | 2026-06-24 |
| 12. Eventos de conversión | ✅ Complete | 2026-06-24 |
| 13. Eventos de engagement | ✅ Complete | 2026-06-24 |
| 14. Config GTM/GA4 & verificación | ✅ Complete | 2026-06-24 |
