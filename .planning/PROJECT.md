# JuanPortfolio (juan-tech.com)

## What This Is

Sitio personal y blog técnico de Juan (juan-tech.com), construido sobre Next.js 15 (App Router) + Payload CMS 3, desplegado en Vercel con assets en Cloudinary. Bilingüe es/en con `es` por defecto sin prefijo y `en` bajo `/en`. El contenido vive en Payload y en markdown sincronizado; el SEO técnico (sitemaps, JSON-LD, hreflang, CWV) es prioridad activa.

## Core Value

Las páginas públicas (home y posts) deben servirse como HTML cacheado desde el edge para que carguen rápido y posicionen bien. Si todo lo demás falla, el rendimiento percibido y la cacheabilidad no pueden romperse.

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

### Active

<!-- Scope actual. Milestone v1.2 — GA4 Analytics Tracking. -->

- [ ] Cobertura GA4 completa vía dataLayer/GTM (CTAs, links, forms, Calendly, idioma)
- [ ] Delegación global por `data-analytics` (instrumentar sitewide sin tocar cada componente)
- [ ] Engagement: scroll depth, tiempo/lectura, navegación, búsqueda
- [ ] Doc de setup GTM (tag GA4-Event forward) + Enhanced Measurement

### Out of Scope

<!-- Límites explícitos. -->

- Migrar el resto de los issues SEO abiertos (#21+) — milestone aparte, este solo cubre ISR/CWV del #20
- Cambiar el modelo de contenido de Payload — no relacionado con caching
- Rediseño visual del Header/Footer — solo se reubican, no se rediseñan

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
*Last updated: 2026-06-23 after bootstrap for milestone v1.0 (issue #20 ISR/CWV)*
