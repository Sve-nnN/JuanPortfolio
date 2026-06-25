# Milestones: JuanPortfolio

Historial de milestones enviados.

## Completed

### v1.0 — Render estático/ISR & Edge Caching (issue #20) ✅
Sacar headers()/draftMode() del render → home y posts ISR/edge-cached. Verificado en prod: `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`, sin `no-store`.

### v1.1 — Core Web Vitals & Performance ✅
Diferir Calendly (IntersectionObserver), imágenes right-sized, Ahrefs lazyOnload, a11y footer, fix del gate de LCP (template de ruta opacity:0). Resultado prod (PSI mobile): Perf 36→82, LCP 8.6→4.1s, TBT 1740→100ms, A11y 73→96, Best Practices →100. Hotfix de build: sitemap queries paralelas (Vercel prerender timeout).

### v1.2 — GA4 Analytics Tracking ✅
Cobertura completa de eventos GA4 vía dataLayer/GTM: conversiones (generate_lead, Calendly schedule_meeting, cta_click, language_switch) y engagement (scroll depth, tiempo/lectura, navegación, búsqueda, select_content). Helper `trackEvent` dataLayer-only + delegación global por `data-analytics`. Doc de setup GTM (tag GA4-Event forward) + Enhanced Measurement. Fases 11-14. CI verde.

### v1.3 — Remediación SEO técnica (Ahrefs Site Audit) ✅
Saneados 312 wikilinks `[[]]` + guard en el sync; 748 links auditados → 0 dead/nested/corruptos; imágenes AVIF (`unoptimized`, fix del 400); `<html lang>` por locale; sitemap sin noindex + `/author`→`/authors` 301 + robots.txt 200; H1 único + og:title + schema sin errores (ProfessionalService/CollectionPage) + title de categorías; author page 2.3MB→fracción; widget de Domain Rating en admin. Fases 15-20. 741 tests verdes. Mergeado a main (PR #82→develop, #83→main). Pendiente: re-crawl Ahrefs.

## In Progress

### v1.4 — Keyword targeting & Yoast-style SEO scoring

**Goal:** Cada página (Post, Page, listado) con una keyword objetivo y sus métricas a la vista, más un semáforo estilo Yoast en el editor que compara la keyword contra title/meta/H1/slug/contenido, y una auditoría de cobertura.

**Started:** 2026-06-25
**Baseline:** `keyword-metrics` collection ya existe (rica, con relaciones post/page); Posts ya tienen `primaryKeyword`; Pages no. `seoAnalyzer.ts` (Yoast-like) existe. Keyword research en `content/keywords.md` (DinoRank).
**Scope:** Posts + Pages + listados; reusar `primaryKeyword`→keyword-metrics + agregarlo a Pages; semáforo en el sidebar del editor; auditoría de cobertura (sin keyword / con keyword pero falta algo).
