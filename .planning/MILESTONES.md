# Milestones: JuanPortfolio

Historial de milestones enviados.

## Completed

### v1.0 — Render estático/ISR & Edge Caching (issue #20) ✅

**Goal:** Sacar headers()/draftMode() del camino de render estático → home y posts cacheados desde el edge (ISR).

**Started:** 2026-06-23 · **Shipped:** 2026-06-23 (PR #71→develop, #72→main)
**Resultado verificado en prod:** todas las rutas objetivo `x-vercel-cache: HIT` + `x-nextjs-prerender: 1`, sin `no-store`. `/es`→`/` 301 intacto.

## In Progress

### v1.1 — Core Web Vitals & Performance

**Goal:** Bajar LCP/TBT en mobile sacando el JS de terceros del load inicial (Calendly 2.6MB + Stripe), optimizar imágenes, limpiar polyfills y arreglar a11y agéntica.

**Started:** 2026-06-23
**Baseline (Lighthouse mobile, Slow 4G, Moto G Power):** Perf 36 · LCP 8.6s · TBT 1740ms · FCP 3.6s · Accessibility 73 · Agentic 1/3.
