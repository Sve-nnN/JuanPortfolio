# Roadmap: JuanPortfolio — Milestone v1.1 (Core Web Vitals & Performance)

## Overview

Baja LCP/TBT en mobile en 5 fases. Empieza por el mayor ofensor (diferir Calendly, ~2.9MB fuera del load inicial), luego imágenes, higiene de JS/terceros, a11y agéntica, y verificación con Lighthouse.

## Phases

- [ ] **Phase 6: Diferir Calendly** - Montar el widget solo al entrar al viewport; saca Calendly+Stripe del load inicial
- [ ] **Phase 7: Optimización de imágenes** - `sizes`/dimensiones correctos en LCP image y logos
- [ ] **Phase 8: Higiene de JS** - browserslist (polyfills) + estrategia de carga de GTM/Ahrefs
- [ ] **Phase 9: A11y & agentic** - link del footer con nombre accesible; confirmar llms.txt
- [ ] **Phase 10: Medición & verificación** - Lighthouse mobile vs baseline; build/CI verde

## Phase Details

### Phase 6: Diferir Calendly
**Goal**: El widget de Calendly no carga en el load inicial de la home; se monta al hacer scroll a su sección
**Requirements**: TP-01, TP-02
**Success Criteria**:
  1. En el HTML/network inicial de `/` no aparece `assets.calendly.com/.../booking-*.js|css` ni `js.stripe.com/v3` hasta hacer scroll a la sección
  2. El widget sigue cargando y funcionando cuando entra al viewport (IntersectionObserver) o por click
  3. `next build` verde; sin regresión visual de la sección (placeholder/loader mientras no carga)

### Phase 7: Optimización de imágenes
**Goal**: La imagen LCP y los logos se sirven al tamaño mostrado
**Requirements**: IMG-01, IMG-02
**Success Criteria**:
  1. El retrato LCP tiene `sizes` que evita bajar 756px para 434px de display
  2. Los logos de clientes usan dimensiones ajustadas (no 2–3× el display)
  3. Lighthouse "Improve image delivery" baja respecto al baseline

### Phase 8: Higiene de JS
**Goal**: Menos polyfills legacy y third-parties que no bloqueen el LCP
**Requirements**: JS-01, TP-03
**Success Criteria**:
  1. browserslist configurado a navegadores modernos → desaparecen los polyfills Array.at/flat/flatMap/Object.fromEntries del bundle
  2. GTM/Ahrefs cargan con estrategia que no bloquea el hilo durante el LCP
  3. Lighthouse "Legacy JavaScript" y "unused JS" first-party bajan

### Phase 9: A11y & agentic
**Goal**: El árbol de accesibilidad queda bien formado; agentes pueden leer la página
**Requirements**: A11Y-01, A11Y-02
**Success Criteria**:
  1. El link de "Últimos Posts" del footer tiene nombre accesible siempre (icono `aria-hidden`, fallback de texto)
  2. `/llms.txt` confirmado 200 + H1 (documentado; fallo del audit = Cloudflare challenge)
  3. Lighthouse a11y no reporta "Links must have discernible text" en el footer

### Phase 10: Medición & verificación
**Goal**: LCP/TBT mejoran de forma medible y nada se rompe
**Requirements**: VERIFY-01, VERIFY-02
**Success Criteria**:
  1. Lighthouse mobile: LCP y TBT bajan vs baseline (objetivo LCP<4s, TBT<600ms, Perf>70)
  2. `next build` + CI verdes
  3. QA funcional: Calendly carga al scrollear, home/posts sin regresión

## Progress

| Phase | Status | Completed |
|-------|--------|-----------|
| 6. Diferir Calendly | Not started | - |
| 7. Optimización de imágenes | Not started | - |
| 8. Higiene de JS | Not started | - |
| 9. A11y & agentic | Not started | - |
| 10. Medición & verificación | Not started | - |
