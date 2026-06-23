# Requirements: JuanPortfolio — Milestone v1.1 (Core Web Vitals & Performance)

**Defined:** 2026-06-23
**Core Value:** Páginas públicas rápidas y cacheables. v1.1 ataca el render del cliente (LCP/TBT), no el server (resuelto en v1.0).

**Baseline:** Perf 36 · LCP 8.6s · TBT 1740ms · FCP 3.6s · CLS 0 · Accessibility 73 · Agentic 1/3 (Lighthouse mobile, Slow 4G).

## v1 Requirements

### Third-party JS (TP) — el 80% del problema

- [ ] **TP-01**: El widget de Calendly NO se carga en el load inicial de la home; se monta solo cuando su sección entra al viewport (IntersectionObserver) o por interacción
- [ ] **TP-02**: Stripe (231KB, inyectado por Calendly) deja de cargarse en el load inicial de la home (consecuencia de TP-01)
- [ ] **TP-03**: GTM y Ahrefs analytics cargan con estrategia que no bloquea el hilo principal durante el LCP (post-load / idle)

### Imágenes (IMG)

- [ ] **IMG-01**: La imagen LCP (retrato) se sirve con `sizes` correcto (deja de bajar 756×758 para mostrar 434×579)
- [ ] **IMG-02**: Los logos de clientes y otras imágenes Cloudinary above/near-fold usan dimensiones/`sizes` ajustados (no 2–3× el tamaño mostrado)

### JS build (JS)

- [ ] **JS-01**: Eliminar los polyfills legacy innecesarios (browserslist apuntando a navegadores modernos) — Array.at, flat, flatMap, Object.fromEntries, etc.

### Accesibilidad / Agentic (A11Y)

- [ ] **A11Y-01**: El link de "Últimos Posts" del footer siempre tiene nombre accesible (icono `ArrowUpRight` decorativo marcado `aria-hidden`; fallback de texto si el título localizado está vacío)
- [ ] **A11Y-02**: Confirmar y documentar que `/llms.txt` se sirve 200 con H1 (el fallo del audit es Cloudflare challenge al bot, no código)

### Verificación (VERIFY)

- [ ] **VERIFY-01**: Lighthouse mobile muestra mejora medible de LCP y TBT vs baseline (objetivo: LCP < 4s, TBT < 600ms, Perf > 70)
- [ ] **VERIFY-02**: `next build` verde, CI verde, sin regresión funcional (Calendly sigue funcionando al hacer scroll)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cache lifetimes de scripts de terceros (Stripe/Calendly/CF) | No controlamos sus headers; se mitiga difiriéndolos |
| `cf-cache-status: HIT` (Cloudflare cachee el HTML) | Config de infra Cloudflare, no código; issue aparte |
| Render-blocking CSS de Calendly | Se elimina al diferir Calendly (TP-01) |
| Migrar de Calendly a otra solución | Cambio de producto, no perf |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TP-01 | Phase 6 | Complete |
| TP-02 | Phase 6 | Complete |
| TP-03 | Phase 8 | Complete |
| IMG-01 | Phase 7 | Complete |
| IMG-02 | Phase 7 | Complete |
| JS-01 | Phase 8 | Complete |
| A11Y-01 | Phase 9 | Complete |
| A11Y-02 | Phase 9 | Complete |
| VERIFY-01 | Phase 10 | Complete |
| VERIFY-02 | Phase 10 | Complete |

**Coverage:** 10 reqs · mapeados 10 · sin mapear 0 ✓

---
*Requirements defined: 2026-06-23*
