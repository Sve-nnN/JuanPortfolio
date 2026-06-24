# Requirements: JuanPortfolio — Milestone v1.2 (GA4 Analytics Tracking)

**Defined:** 2026-06-24
**Core Value:** Medir cómo los usuarios interactúan con el sitio (conversiones + engagement) para decidir con datos.

**Entrega:** El código pushea eventos estructurados al `dataLayer`. En GTM, un único tag GA4-Event (event name = `{{Event}}`) con trigger de "custom event" reenvía TODOS los eventos a GA4. Sin doble conteo (se quita el gtag directo del helper). Sin consent gate.

**Baseline:** `src/utilities/analytics.ts` (`trackEvent`) ya existe; instrumentación parcial en CMSLink (cta_click/social/nav), CopyButton (code_copied), TableOfContents (toc_navigation). GA4 dispara vía GTM (`NEXT_PUBLIC_GTM_ID`).

## v1 Requirements

### Fundación (CORE)

- [ ] **CORE-01**: `trackEvent` pushea solo al dataLayer (sin gtag directo → sin doble conteo), con nombres de evento y params tipados/consistentes
- [ ] **CORE-02**: Delegación global de clicks: un listener captura clicks en elementos con `data-analytics` (y `data-*` de params) → instrumenta botones/links sitewide sin cablear cada componente
- [ ] **CORE-03**: Auto-tracking de clicks en links salientes (outbound) y descargas no cubiertos por Enhanced Measurement, con dedupe vs lo ya instrumentado
- [ ] **CORE-04**: Taxonomía de eventos documentada (nombres, params, mapeo a eventos recomendados GA4)

### Conversiones (CONV)

- [ ] **CONV-01**: Submit del formulario de contacto → `generate_lead` (con éxito/error y metadata no-PII)
- [ ] **CONV-02**: Reserva en Calendly → escuchar `postMessage` (`calendly.event_scheduled`) → evento de conversión `schedule_meeting`
- [ ] **CONV-03**: CTAs primario/secundario → `cta_click` con label + ubicación (extiende lo existente, cubre botones nativos)
- [ ] **CONV-04**: Switcher de idioma → `language_switch` (from/to locale)

### Engagement (ENG)

- [ ] **ENG-01**: Hitos de scroll depth (25/50/75/100%) → `scroll_depth` (Enhanced Measurement solo hace 90%)
- [ ] **ENG-02**: Tiempo/lectura en páginas de contenido (post/case-study) → `content_engagement` por hitos (ej. 30s, lectura completa)
- [ ] **ENG-03**: Interacciones de blog: TOC (existe), code copy (existe), clicks en posts relacionados → `select_content`
- [ ] **ENG-04**: Navegación interna (header/footer) → `navigation_click`
- [ ] **ENG-05**: Uso de búsqueda → `search` (evento recomendado GA4)

### Config & verificación (CFG)

- [ ] **CFG-01**: Doc del setup en GTM (tag GA4-Event forward + trigger custom-event) para que Juan lo cree una vez
- [ ] **CFG-02**: Doc de Enhanced Measurement (qué es automático vs custom) para no duplicar
- [ ] **CFG-03**: Verificar que los eventos llegan al dataLayer / GA4 DebugView; sin doble conteo; sin PII

## Out of Scope

| Feature | Reason |
|---------|--------|
| Consent Mode v2 / banner de cookies | Juan eligió sin consent gate (portfolio personal) |
| Server-side tagging / Measurement Protocol | Client-side dataLayer cubre el objetivo |
| Dashboards / reportes en GA4 | Config de GA4 UI, no código |
| A/B testing / experimentos | Otro milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 11 | Complete |
| CORE-02 | Phase 11 | Complete |
| CORE-03 | Phase 11 | Complete |
| CORE-04 | Phase 11 | Complete |
| CONV-01 | Phase 12 | Complete |
| CONV-02 | Phase 12 | Complete |
| CONV-03 | Phase 12 | Complete |
| CONV-04 | Phase 12 | Complete |
| ENG-01 | Phase 13 | Complete |
| ENG-02 | Phase 13 | Complete |
| ENG-03 | Phase 13 | Complete |
| ENG-04 | Phase 13 | Complete |
| ENG-05 | Phase 13 | Complete |
| CFG-01 | Phase 14 | Complete |
| CFG-02 | Phase 14 | Complete |
| CFG-03 | Phase 14 | Complete |

**Coverage:** 16 reqs · mapeados 16 · sin mapear 0 ✓

---
*Requirements defined: 2026-06-24*
