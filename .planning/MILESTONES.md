# Milestones: JuanPortfolio

Historial de milestones enviados.

## Completed

### v1.0 — Render estático/ISR & Edge Caching (issue #20) ✅
Sacar headers()/draftMode() del render → home y posts ISR/edge-cached. Verificado en prod: `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`, sin `no-store`.

### v1.1 — Core Web Vitals & Performance ✅
Diferir Calendly (IntersectionObserver), imágenes right-sized, Ahrefs lazyOnload, a11y footer, fix del gate de LCP (template de ruta opacity:0). Resultado prod (PSI mobile): Perf 36→82, LCP 8.6→4.1s, TBT 1740→100ms, A11y 73→96, Best Practices →100. Hotfix de build: sitemap queries paralelas (Vercel prerender timeout).

### v1.2 — GA4 Analytics Tracking ✅
Cobertura completa de eventos GA4 vía dataLayer/GTM: conversiones (generate_lead, Calendly schedule_meeting, cta_click, language_switch) y engagement (scroll depth, tiempo/lectura, navegación, búsqueda, select_content). Helper `trackEvent` dataLayer-only + delegación global por `data-analytics`. Doc de setup GTM (tag GA4-Event forward) + Enhanced Measurement. Fases 11-14. CI verde.

## In Progress

### v1.3 — Remediación SEO técnica (Ahrefs Site Audit)

**Goal:** Cerrar las 35 categorías de issues del Site Audit de Ahrefs (project 7702617), empezando por la causa raíz que genera ~80% del daño: wikilinks `[[slug|label]]` filtrándose crudos a hrefs e imágenes renderizadas.

**Started:** 2026-06-24
**Causa raíz #1:** El sistema de internal-linking (`src/scripts/build-internal-links.ts`, `internal-linking/LinkInjector.ts`) inyecta `[[wikilink]]` y la conversión a links reales está rota → `[[...]]` literal llega al HTML. Explica los 94 "links to broken page", 159 "broken image" y la mayoría de los 404.
**Scope:** completo — Errores + Warnings + Notices, agrupados en 7 buckets (LINKS, IMG, HREF, INDEX, META, SCHEMA, PERF).
**Baseline (audit 2026-06-24T15:26:07Z):** 35 categorías. Errores top: broken image ×159, links to broken page ×94, hreflang/lang mismatch ×90, 4XX ×20, 404 ×19, noindex in sitemap ×8.
