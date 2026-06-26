# JuanPortfolio (juan-tech.com)

## What This Is

Sitio personal y blog técnico de Juan (juan-tech.com), construido sobre Next.js 15 (App Router) + Payload CMS 3, desplegado en Vercel con assets en Cloudinary. Bilingüe es/en con `es` por defecto sin prefijo y `en` bajo `/en`. El contenido vive en Payload y en markdown sincronizado; el SEO técnico (sitemaps, JSON-LD, hreflang, CWV) es prioridad activa.

## Core Value

Las páginas públicas (home y posts) deben servirse como HTML cacheado desde el edge para que carguen rápido y posicionen bien. Si todo lo demás falla, el rendimiento percibido y la cacheabilidad no pueden romperse.

## Current Milestone: v1.5 Limpieza y alineación del admin de Payload

**Goal:** Eliminar el código muerto del admin (plugin SEO fantasma, andamiaje DDD `domains/`, backups, scripts one-off), endurecer accesos de las colecciones de métricas, unificar consistencia (group/labels/nav) y estrategia de assets — con verificación runtime de integraciones antes de borrar nada dependiente.

**Target features:**
- Verificación runtime de integraciones (Ahrefs/DinoRank/Indexing/GSC) como gate previo a la limpieza
- Borrado del plugin SEO casero nunca registrado (conservando seoAnalyzer/keywordCoverageAudit/seoFields/keywordScore reubicados)
- Colapso del árbol `src/domains/**` (mover AdBanner a collections/, borrar el resto) + backups/re-exports huérfanos
- Limpieza de scripts one-off/debug ya aplicados
- Endurecer `access` de keyword-metrics/page-metrics/gsc-metrics; estrategia única de assets (Blob vs Cloudinary)
- Consistencia admin: `group:'SEO'` uniforme, labels bilingües `{en,es}`, nav links con iconos del design system

Inventario base: `.planning/admin-audit-v1.5.md`

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

### Active

<!-- Scope actual. Milestone v1.5 — Limpieza y alineación del admin de Payload. -->

- [ ] Eliminar código muerto del admin: plugin SEO fantasma, `domains/` DDD, backups/re-exports huérfanos
- [ ] Limpiar scripts one-off/debug ya aplicados
- [ ] Endurecer `access` de las colecciones de métricas (keyword-metrics/page-metrics/gsc-metrics)
- [ ] Unificar estrategia de assets (Vercel Blob vs Cloudinary)
- [ ] Consistencia admin: `group:'SEO'`, labels bilingües `{en,es}`, nav links del design system
- [ ] Verificación runtime de integraciones (Ahrefs/DinoRank/Indexing/GSC)

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
*Last updated: 2026-06-26 — v1.5 (limpieza y alineación del admin de Payload) iniciado*
