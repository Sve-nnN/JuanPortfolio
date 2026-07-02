# Milestones: JuanPortfolio

## v1.5 Limpieza y alineación del admin de Payload (Shipped: 2026-06-26)

**Phases completed:** 6 phases (25-30)

**Key accomplishments:**

- Auditoría completa del admin de Payload (`.planning/admin-audit-v1.5.md`): los 21 componentes vivos; código muerto identificado fuera de `components/admin/`.
- Eliminado el plugin SEO casero nunca registrado, reubicando 4 módulos vivos a `src/utilities/seo/` (CLEAN-01).
- Colapsados dos árboles DDD abandonados (`src/domains/**` + `src/domain/**`); AdBanner movido a `collections/` (CLEAN-02/03).
- Borrados 12 scripts one-off/debug ya aplicados + podado el registry del TUI (SCRIPT-01).
- Endurecido el `access` de keyword-metrics/page-metrics/gsc-metrics a `authenticated` (SEC-01).
- Consistencia admin: `group:'SEO'` uniforme, labels bilingües `{en,es}`, nav links sin emoji con SVG (CONSIST-01/02/03).
- ~50 archivos muertos eliminados; tsc baseline 114 intacto, 776 tests verdes en cada fase.

**Known deferred items at close:** VERIFY-01 (gate runtime de integraciones — checklist producido, ejecución con credenciales pendiente de Juan) y ASSET-01 (migración storage Blob→Cloudinary diferida a milestone propio por riesgo en prod). Ver STATE.md Deferred Items.

---

## v1.4 Keyword targeting & Yoast-style SEO scoring (Shipped: 2026-06-26)

**Phases completed:** 4 phases, 7 plans, 9 tasks

**Key accomplishments:**

- Modelo de keyword objetivo (`primaryKeyword`→`keyword-metrics`) en Pages, Categorías y Autores, espejando Posts; localizado es/en (Fases 21 + 24).
- Semáforo estilo Yoast en el sidebar del editor: 7 checks (keyword en title/meta/H1/slug/densidad/primer-párrafo/subtítulos), score 0-100 ponderado, recálculo en vivo (~300ms), stemming es/en server-side. Reusa `seoAnalyzer.ts` (Fase 22).
- Auditoría de cobertura repetible: script `pnpm audit:keywords` + vista admin, locale-aware (Fase 23).
- Población live desde DinoRank: 136/136 keywords mapeadas asignadas por locale + stubs `needs-research` para faltantes (Fase 24).
- Calidad: 776 tests verdes, tsc baseline intacto, integración cross-fase verificada (WIRING SOUND). Auditoría: sin-keyword 53→9.

**Known deferred items at close:** 5 (validaciones visuales admin de fases 22/23 + 3 visuales de milestones viejos; ver STATE.md Deferred Items). Backlog: 9 keyword-metrics duplicados por acento; keywords sin métricas vía `pnpm sync:keywords`.

---

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

### v1.4 — Keyword targeting & Yoast-style SEO scoring ✅

Keyword objetivo (`primaryKeyword`→keyword-metrics, localizado es/en) en Posts/Pages/Categorías/Autores; semáforo estilo Yoast en el sidebar (7 checks + score 0-100 ponderado, recálculo en vivo, stemming es/en server-side, reusa `seoAnalyzer.ts`); auditoría de cobertura repetible (script `audit:keywords` + vista admin, locale-aware); población live desde DinoRank (136/136 mapeadas, stubs needs-research). Fases 21-24. 776 tests verdes, integración WIRING SOUND. Pendiente: validación visual admin de fases 22/23 (diferida).
