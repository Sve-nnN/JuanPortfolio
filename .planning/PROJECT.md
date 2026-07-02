# JuanPortfolio (juan-tech.com)

## What This Is

Sitio personal y blog técnico de Juan (juan-tech.com), construido sobre Next.js 15 (App Router) + Payload CMS 3, desplegado en Vercel con assets en Cloudinary. Bilingüe es/en con `es` por defecto sin prefijo y `en` bajo `/en`. El contenido vive en Payload y en markdown sincronizado; el SEO técnico (sitemaps, JSON-LD, hreflang, CWV) es prioridad activa.

## Core Value

Las páginas públicas (home y posts) deben servirse como HTML cacheado desde el edge para que carguen rápido y posicionen bien. Si todo lo demás falla, el rendimiento percibido y la cacheabilidad no pueden romperse.

## Current Milestone: v1.7 Rendimiento avanzado (Core Web Vitals) — jul 2026

**Goal:** Bajar el LCP mobile de la home a < 2500ms y el INP a < 200ms recortando el JavaScript de arranque y refactorizando el hero, sin romper la animación/diseño (QA visual obligatorio).

**Target features:**
- Hero → server component con wrapper cliente chico solo para el parallax (H1/LCP deja de depender de la hidratación del hero)
- Recorte de JS inicial: auditar ~27 chunks/~325KB gzip; `next/dynamic` agresivo below-the-fold; aislar/reducir framer-motion (evaluar entrance con CSS puro)
- Recorte de preloads de fuentes al peso del H1 (Array Bold); `preload:false` en Geist Sans/Mono si no son above-the-fold (riesgo FOUT → QA visual)
- Cache de HTML en edge de Cloudflare (hoy `cf-cache-status: DYNAMIC`) respetando el ISR de Next
- Validación con field data: usar el INP real del reporter `web-vitals`→GA4 (#103) para priorizar, re-medir con Unlighthouse mobile

Base: medición Unlighthouse mobile post-v1.6 (Perf 0.37 · LCP 7.4s · TBT 2180ms). Detalle: `.planning/research/audit-jul2026/03-performance.md`. Issues #95 (LCP), #103 (INP).

## Requirements

### Validated

<!-- Shipped y confirmado valioso. -->

- ✓ i18n es/en con `es` sin prefijo y redirect 301 de `/es` → `/` — SEO audit jun-2026
- ✓ JSON-LD Organization/WebSite, hreflang, sitemaps sin trailing slash — SEO audit jun-2026
- ✓ Speculation Rules (prefetch moderate) emitidas desde SSR — SEO audit jun-2026
- ✓ Home y posts estático/ISR con `x-vercel-cache: HIT` (sin no-store) — v1.0 (#20)
- ✓ Locale por param `[locale]` fuera del render estático; `draftMode()` bypass-gated — v1.0 (#20)
- ✓ CWV: Calendly diferido, imágenes right-sized, fix del gate de LCP → Perf 36→82, LCP 8.6→4.1s — v1.1
- ✓ A11y footer + Ahrefs CSP → A11y 96, Best Practices 100 — v1.1
- ✓ Cobertura GA4 completa vía dataLayer/GTM (conversiones + engagement), delegación global por `data-analytics`, doc GTM — v1.2
- ✓ Remediación SEO técnica Ahrefs: wikilinks saneados + guard, links/imágenes/hreflang/sitemap/H1/OG/schema, author page peso, widget DR — v1.3 (pendiente re-crawl)
- ✓ Keyword objetivo (`primaryKeyword`→keyword-metrics, localizado es/en) en Pages, Categorías y Autores (Posts ya lo tenían) — v1.4
- ✓ Semáforo estilo Yoast en el sidebar del editor: 7 checks + score 0-100 ponderado, recálculo en vivo, stemming es/en (reusa `seoAnalyzer.ts`) — v1.4
- ✓ Auditoría de cobertura repetible (script `audit:keywords` + vista admin, locale-aware) — v1.4
- ✓ Keywords pobladas desde DinoRank: 136/136 mapeadas por locale + stubs needs-research — v1.4 (validación visual admin de 22/23 diferida)

- ✓ Limpieza del admin: plugin SEO fantasma + 2 árboles DDD (`domains/`+`domain/`) + 12 scripts one-off + backups eliminados (~50 archivos) — v1.5
- ✓ Accesos de colecciones de métricas endurecidos a `authenticated`; consistencia admin (group SEO, labels bilingües, nav sin emoji) — v1.5

### Active

<!-- Scope v1.7 — rendimiento avanzado (Core Web Vitals). REQ-IDs en REQUIREMENTS.md. -->

- Milestone v1.7: LCP mobile home < 2500ms + INP < 200ms vía hero server component, recorte de JS/fuentes, cache edge y validación con field data

**v1.6 (código shipped, branch `fix/v1.6-audit-remediation`):** 12 issues cerrados en código; acciones manuales de Juan pendientes (#12 #88 #95 #102-#107, JUAN-ACTIONS.md). El fix real del LCP (#95) se retoma aquí.

**Diferidos de v1.5:** VERIFY-01 (gate runtime, checklist listo) · ASSET-01 (migración storage Blob→Cloudinary, milestone propio)

### Out of Scope

<!-- Límites explícitos. -->

- Rehacer el keyword research desde cero (se usa el existente de DinoRank)
- Optimización on-page automática del contenido (el semáforo informa, no reescribe)
- Cambiar el modelo de `keyword-metrics` más allá de relacionarlo con Pages
- Rediseño visual del Header/Footer

## Context

- Issue #20 (GitHub): home y posts devuelven `cache-control: private, no-cache, no-store`, `x-vercel-cache: MISS`, `cf-cache-status: DYNAMIC`. TTFB ~1.9s, LCP ~7.3s (Unlighthouse).
- Causa: `src/app/(frontend)/layout.tsx:84-87` llama `await draftMode()` y `await headers()` (lee `x-pathname` para derivar locale). Ambas son dynamic APIs → marcan TODO el árbol como dinámico (opt-out de prerender/ISR).
- Las 4 plantillas de contenido (`[locale]/[slug]`, `blog`, `blog/[category]/[slug]`, `case-studies/[slug]`) también llaman dynamic APIs por su cuenta.
- La home ES la sirve `(frontend)/page.tsx` FUERA de `[locale]` — landmine al mover el chrome (Header/Footer) a un `[locale]/layout.tsx`.
- AdminBar ya se autodetecta por login del lado cliente (confirmado), así que el prop `preview` de `draftMode()` se puede quitar del root.

## Constraints

- **Tech stack**: Next.js 15.2.8 (App Router), Payload 3.61.1, Vercel, Cloudinary — fijo
- **Compatibility**: el live preview de Payload no puede romperse al aislar `draftMode()`
- **SEO**: hreflang y canonical deben seguir correctos; `<html lang>` correcto (cliente acepta corrección cosmética para `/en`)
- **Routing**: la home ES (`/`) es la URL más importante; su ruteo cambia (entra a `[locale]`) y requiere QA

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `<html lang="es">` fijo en root + corrección cliente para `/en` | El root layout no recibe locale por param; evita `headers()` | — Pending |
| Mover chrome y locale a nuevo `[locale]/layout.tsx` | Layout dentro de `[locale]` recibe param → apto ISR | — Pending |
| Reescribir `/` → `/es` en middleware y borrar `(frontend)/page.tsx` | Home ES hereda el chrome del `[locale]/layout.tsx` | — Pending |
| Semáforo Yoast: análisis server-side, UI dependency-light (v1.4) | `natural` (stemmer es/en) no debe bundlearse en el admin; endpoint debounced | ✓ Good |
| `primaryKeyword` localizado es/en en las 4 colecciones (v1.4) | Sitio bilingüe → keyword distinta por locale; Mongo schemaless sin migración | ✓ Good |
| Lógica de checks/auditoría sobre `seoAnalyzer.ts` (fuente única) (v1.4) | Panel y auditoría comparten el motor → sin drift | ✓ Good |
| `fallbackLocale: false` en lecturas por-locale (v1.4) | Evita que el fallback es contamine la cobertura/no-clobber en en | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-02 — v1.7 (rendimiento avanzado / Core Web Vitals) iniciado*
