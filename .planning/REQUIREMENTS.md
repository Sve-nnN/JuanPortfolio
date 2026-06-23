# Requirements: JuanPortfolio — Milestone v1.0 (issue #20 ISR/CWV)

**Defined:** 2026-06-23
**Core Value:** Páginas públicas servidas como HTML cacheado desde el edge (rápido + cacheable).

## v1 Requirements

Requirements del milestone v1.0. Cada uno mapea a una fase del roadmap.

### Locale (LOCALE)

- [ ] **LOCALE-01**: El root layout deriva el locale sin llamar `headers()` (queda `<html lang="es">` fijo por defecto)
- [ ] **LOCALE-02**: En `/en` el `<html lang>` se corrige a `en` en el cliente (componente con `useEffect`)
- [ ] **LOCALE-03**: Header, Footer y links internos renderizan el idioma correcto en todas las plantillas, tomando el locale del param `[locale]`

### Routing (ROUTE)

- [ ] **ROUTE-01**: Existe `src/app/(frontend)/[locale]/layout.tsx` que recibe `params.locale`, hace fetch de siteSettings, emite JSON-LD Organization/WebSite y envuelve children en LocaleProvider + Header + Footer
- [ ] **ROUTE-02**: La home ES (`/`) se sirve vía `[locale]/page.tsx` con `locale=es` y hereda el chrome del nuevo layout
- [ ] **ROUTE-03**: El middleware reescribe internamente `/` → `/es`, y `src/app/(frontend)/page.tsx` queda eliminado

### Preview (PREVIEW)

- [ ] **PREVIEW-01**: `draftMode()` removido del root layout; AdminBar se renderiza sin el prop `preview` (autodetección por login cliente)
- [ ] **PREVIEW-02**: El render publicado (visitantes) de las 4 plantillas de contenido NO llama `draftMode()` ni `headers()`
- [ ] **PREVIEW-03**: El live preview de Payload sigue mostrando borradores (draftMode aislado en un subárbol dinámico que solo se activa con la cookie de preview)

### Caching & ISR (CACHE)

- [ ] **CACHE-01**: Las 4 plantillas de contenido (`[locale]/[slug]`, `blog`, `blog/[category]/[slug]`, `case-studies/[slug]`) tienen `export const revalidate = 3600`
- [ ] **CACHE-02**: `next build` muestra home y plantillas de contenido como estáticas/ISR (○/●), no dinámicas (ƒ)
- [ ] **CACHE-03**: En producción, home y un post devuelven `x-vercel-cache: HIT` y `cache-control` sin `no-store` (tras warm-up)

### Verification (QA)

- [ ] **QA-01**: hreflang y canonical siguen correctos en home y posts para es y en
- [ ] **QA-02**: El cambio de idioma funciona en todas las plantillas
- [ ] **QA-03**: `/sitemap` y los sitemaps XML siguen intactos

## v2 Requirements

Diferidos a milestones futuros.

### SEO técnico restante

- **SEO-NEXT**: Resto de issues SEO abiertos del audit jun-2026 (#21+) — fuera del alcance del #20

## Out of Scope

| Feature | Reason |
|---------|--------|
| Migrar otros issues SEO (#21+) | Este milestone solo cubre ISR/CWV del #20 |
| Cambiar el modelo de contenido de Payload | No relacionado con caching |
| Rediseño visual de Header/Footer | Solo se reubican al nuevo layout, no se rediseñan |
| Eliminar Speculation Rules | Se mantienen; el fix las vuelve efectivas (prefetch ya no choca con no-store) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOCALE-01 | Phase 1 | Complete |
| LOCALE-02 | Phase 1 | Complete |
| LOCALE-03 | Phase 1 | Complete |
| ROUTE-01 | Phase 1 | Complete |
| ROUTE-02 | Phase 2 | Complete |
| ROUTE-03 | Phase 2 | Complete |
| PREVIEW-01 | Phase 1 | Complete |
| PREVIEW-02 | Phase 3 | Complete |
| PREVIEW-03 | Phase 3 | Complete |
| CACHE-01 | Phase 4 | Complete |
| CACHE-02 | Phase 4 | Complete |
| CACHE-03 | Phase 4 | Complete |
| QA-01 | Phase 5 | Complete |
| QA-02 | Phase 5 | Complete |
| QA-03 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-23*
*Last updated: 2026-06-23 — Traceability completada tras creación de roadmap*
