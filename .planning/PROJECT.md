# JuanPortfolio (juan-tech.com)

## What This Is

Sitio personal y blog técnico de Juan (juan-tech.com), construido sobre Next.js 15 (App Router) + Payload CMS 3, desplegado en Vercel con assets en Cloudinary. Bilingüe es/en con `es` por defecto sin prefijo y `en` bajo `/en`. El contenido vive en Payload y en markdown sincronizado; el SEO técnico (sitemaps, JSON-LD, hreflang, CWV) es prioridad activa.

## Core Value

Las páginas públicas (home y posts) deben servirse como HTML cacheado desde el edge para que carguen rápido y posicionen bien. Si todo lo demás falla, el rendimiento percibido y la cacheabilidad no pueden romperse.

## Current Milestone: v1.6 Auditoría integral & remediación (SEO + código) — jul 2026

**Goal:** Auditar el sitio completo (crawl SEO fresco + revisión de código local), consolidar hallazgos en issues de GitHub accionables (error → causa → fix) y remediarlos cerrando cada uno.

**Target features:**
- HTTP/recursos: corregir 4 páginas internas con error HTTP, 1 enlace externo roto, 2 recursos rotos (img + JS)
- Duplicados/hreflang: consolidar 13 grupos de contenido duplicado exacto + 15 return-links hreflang faltantes
- Schema/AEO: schemas de alto impacto (Person/ProfessionalService/Article/FAQPage) + datos estructurados orientados a IA + `llms.txt` estructurado
- On-page: home con 2 H1 → 1 H1
- Performance: LCP 4446ms→<2500ms, habilitar medición INP, Lighthouse 79→90+
- Arquitectura interna: enlazado interno de 4 páginas huérfanas del sitemap
- Code audit: bugs/errores en código Next/Payload → issues + fix

Base: reporte SEO jul-2026 (14 hallazgos) + crawl fresco (SEO skills) + auditoría de código local.

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

<!-- Scope v1.6 — auditoría integral & remediación. REQ-IDs en REQUIREMENTS.md. -->

- Milestone v1.6: remediación de hallazgos del reporte SEO jul-2026 + crawl fresco + auditoría de código (issues de GitHub error/causa/fix, fix + close)

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
*Last updated: 2026-07-02 — v1.6 (auditoría integral & remediación SEO+código) iniciado*
