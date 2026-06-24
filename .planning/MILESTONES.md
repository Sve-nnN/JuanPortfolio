# Milestones: JuanPortfolio

Historial de milestones enviados.

## Completed

### v1.0 — Render estático/ISR & Edge Caching (issue #20) ✅
Sacar headers()/draftMode() del render → home y posts ISR/edge-cached. Verificado en prod: `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`, sin `no-store`.

### v1.1 — Core Web Vitals & Performance ✅
Diferir Calendly (IntersectionObserver), imágenes right-sized, Ahrefs lazyOnload, a11y footer, fix del gate de LCP (template de ruta opacity:0). Resultado prod (PSI mobile): Perf 36→82, LCP 8.6→4.1s, TBT 1740→100ms, A11y 73→96, Best Practices →100. Hotfix de build: sitemap queries paralelas (Vercel prerender timeout).

## In Progress

### v1.2 — GA4 Analytics Tracking

**Goal:** Cobertura completa de eventos GA4 (vía dataLayer/GTM) en todo el sitio — CTAs, botones, links, navegación, forms, Calendly, switcher de idioma, scroll/tiempo, engagement de contenido y búsqueda.

**Started:** 2026-06-24
**Entrega:** dataLayer + 1 tag GA4-Event en GTM (forward de todos los eventos). Sin consent gate.
**Baseline:** `trackEvent` helper existe; instrumentación parcial (CMSLink, CopyButton, TOC). GA4 dispara vía GTM.
