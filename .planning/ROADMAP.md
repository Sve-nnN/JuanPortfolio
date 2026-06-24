# Roadmap: JuanPortfolio

## Milestones

- ✅ **v1.0 Render estático/ISR & Edge Caching** — Phases 1-5 (shipped 2026-05)
- ✅ **v1.1 Core Web Vitals & Performance** — Phases 6-10 (shipped 2026-06)
- ✅ **v1.2 GA4 Analytics Tracking** — Phases 11-14 (shipped 2026-06-24)
- 🚧 **v1.3 Remediación SEO técnica (Ahrefs Site Audit)** — Phases 15-20 (in progress)

## Phases

<details>
<summary>✅ v1.0 Render estático/ISR & Edge Caching (Phases 1-5) — SHIPPED</summary>

Sacar `headers()`/`draftMode()` del render → home y posts ISR/edge-cached. Verificado en prod: `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`, sin `no-store`.

</details>

<details>
<summary>✅ v1.1 Core Web Vitals & Performance (Phases 6-10) — SHIPPED</summary>

Diferir Calendly (IntersectionObserver), imágenes right-sized, Ahrefs lazyOnload, a11y footer, fix del gate de LCP. Resultado prod (PSI mobile): Perf 36→82, LCP 8.6→4.1s, TBT 1740→100ms.

</details>

<details>
<summary>✅ v1.2 GA4 Analytics Tracking (Phases 11-14) — SHIPPED 2026-06-24</summary>

### Phase 11: Fundación de analítica
**Goal**: Base escalable para trackear cualquier interacción sin cablear componente por componente
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04
**Success Criteria** (what must be TRUE):
  1. `trackEvent` pushea solo al dataLayer (sin gtag directo); tipos/nombres consistentes
  2. Un provider cliente con delegación global captura clicks en `[data-analytics]` con sus `data-*` params
  3. Outbound links/descargas se trackean sin duplicar lo ya instrumentado
  4. `docs/analytics-events.md` lista la taxonomía (nombre, params, mapeo GA4)
**Plans**: Complete

### Phase 12: Eventos de conversión
**Goal**: Las acciones que importan (lead, reunión, CTA, idioma) emiten eventos GA4
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04
**Success Criteria** (what must be TRUE):
  1. Submit del form de contacto emite `generate_lead` (éxito y error) sin PII
  2. Reserva en Calendly (postMessage `event_scheduled`) emite `schedule_meeting`
  3. CTAs primario/secundario emiten `cta_click` con label+ubicación
  4. El switcher de idioma emite `language_switch` con from/to
**Plans**: Complete

### Phase 13: Eventos de engagement
**Goal**: Medir consumo de contenido y navegación
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05
**Success Criteria** (what must be TRUE):
  1. Scroll depth 25/50/75/100% emite `scroll_depth` una vez por hito por página
  2. Páginas de contenido emiten `content_engagement` por hitos de tiempo/lectura
  3. Posts relacionados emiten `select_content`; TOC/code-copy siguen funcionando
  4. Nav de header/footer emite `navigation_click`; la búsqueda emite `search`
**Plans**: Complete

### Phase 14: Config GTM/GA4 & verificación
**Goal**: Que los eventos lleguen a GA4 y quede documentado el setup
**Requirements**: CFG-01, CFG-02, CFG-03
**Success Criteria** (what must be TRUE):
  1. `docs/analytics-gtm-setup.md` explica el tag GA4-Event forward + trigger custom-event y el Enhanced Measurement
  2. Verificación: los eventos aparecen en el dataLayer; sin doble conteo
  3. Sin PII en params; build/CI verdes
**Plans**: Complete

</details>

### 🚧 v1.3 Remediación SEO técnica (Ahrefs Site Audit) — In Progress

**Milestone Goal:** Cerrar las 35 categorías de issues del Site Audit de Ahrefs atacando primero la causa raíz (wikilinks `[[...]]` crudos) y luego 4XX, imágenes, hreflang, indexabilidad, on-page y schema. Baseline: 35 categorías de errores al 2026-06-24.

- [x] **Phase 15: Causa raíz — emitter fijo y contenido saneado** - Arreglar el pipeline de internal-linking para que nunca emita `[[...]]` crudo y sanear todo el contenido ya publicado
- [x] **Phase 16: Integridad de enlaces** - Eliminar los 404/4XX por posts inexistentes, rutas de categoría incorrectas, redirects legacy y contenido de test
- [ ] **Phase 17: Imágenes y hreflang** - Cerrar las 159 imágenes rotas restantes, el retrato 400 y los ~90 mismatches hreflang ↔ html lang
- [ ] **Phase 18: Indexabilidad y sitemap** - noindex fuera del sitemap, indexables dentro, robots.txt 200, canonical con inlinks
- [ ] **Phase 19: On-page, schema y rendimiento** - Meta descriptions, H1 único, OG completo, JSON-LD sin errores de validación, páginas bajo 2 MB
- [ ] **Phase 20: Widget de Domain Rating en admin** - Mostrar el DR del dominio en el dashboard del admin vía endpoint público free de Ahrefs, refrescado a lo sumo 1/día y cacheado server-side

## Phase Details

### Phase 15: Causa raíz — emitter fijo y contenido saneado
**Goal**: El pipeline de internal-linking nunca vuelve a escribir `[[slug|label]]` crudo y todo el contenido publicado queda libre de wikilinks sin resolver
**Depends on**: Phase 14
**Requirements**: LINKS-01, LINKS-02, IMG-02
**Success Criteria** (what must be TRUE):
  1. Grep de `[[` sobre todos los archivos markdown del repo y el HTML renderizado de páginas spot-chequeadas devuelve cero ocurrencias en valores de `href` o `src`
  2. El `LinkInjector.ts` tiene tests que confirman que su output es siempre HTML válido o texto plano, nunca un wikilink crudo sin resolver
  3. Las imágenes embebidas como `![[...]]` en markdown del contenido se convierten a URLs válidas o se eliminan, sin `[[` en los `src` renderizados
  4. CI verde tras el fix; `build-internal-links.ts` no introduce regresiones en otros links válidos
**Plans**: TBD

### Phase 16: Integridad de enlaces
**Goal**: Cero links internos que apunten a 404/4XX, usen rutas de categoría incorrectas, redirijan en lugar de apuntar al destino final, o enlacen a contenido de test
**Depends on**: Phase 15
**Requirements**: LINKS-03, LINKS-04, LINKS-05, LINKS-06
**Success Criteria** (what must be TRUE):
  1. Los slugs reportados como inexistentes (`typescript-best-practices`, `payloadcms-tutorial`, `nextjs-server-components`, `payloadcms-vs-strapi`, etc.) son eliminados de los links internos o redirigidos a su URL real con 200
  2. Ningún link interno usa ruta plana `/blog/[slug]` para posts que viven bajo `/blog/[category]/[slug]`
  3. Ningún link interno apunta a `/posts/*`; todos apuntan al destino `/blog/*` final sin cadena de redirects
  4. Rutas de test (`/blog/test/see-also-test` y similares) no aparecen en el sitemap ni en ningún anchor interno del site
**Plans**: TBD

### Phase 17: Imágenes y hreflang
**Goal**: Cero imágenes rotas en páginas públicas y consistencia total entre `<html lang>` y las anotaciones hreflang en todas las páginas
**Depends on**: Phase 16
**Requirements**: IMG-01, IMG-03, HREF-01, HREF-02
**Success Criteria** (what must be TRUE):
  1. `<html lang="es">` en páginas sin prefijo de locale; `<html lang="en">` en páginas bajo `/en/`
  2. Todas las anotaciones hreflang apuntan a URLs que devuelven 200 y son recíprocas (es ↔ en)
  3. La ruta `/_next/image?url=/api/media/file/juan-angulo-portrait-1.avif` devuelve HTTP 200 (el retrato deja de dar 400)
  4. Spot-check en Ahrefs o curl de `og:image` y `<img>` en páginas principales confirma 0 imágenes con respuesta non-200
**Plans**: TBD
**UI hint**: yes

### Phase 18: Indexabilidad y sitemap
**Goal**: El sitemap es coherente con las directivas de indexación: solo páginas indexables, robots.txt accesible y páginas clave enlazadas internamente
**Depends on**: Phase 17
**Requirements**: INDEX-01, INDEX-02, INDEX-03, INDEX-04
**Success Criteria** (what must be TRUE):
  1. Ninguna de las 8 URLs con `noindex` aparece en el sitemap (o han perdido el noindex y son indexables)
  2. Las 22 páginas indexables ausentes están en el sitemap, o su exclusión está documentada con justificación
  3. `GET /robots.txt` responde HTTP 200 con `Content-Type: text/plain`
  4. La URL canónica que carecía de inlinks recibe al menos un enlace interno dofollow desde una página con tráfico
**Plans**: TBD

### Phase 19: On-page, schema y rendimiento
**Goal**: Cada página indexable tiene on-page completo (meta desc, H1, títulos, OG), el JSON-LD no tiene errores de validación y ninguna página excede los límites de Googlebot
**Depends on**: Phase 18
**Requirements**: META-01, META-02, META-03, META-04, SCHEMA-01, PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. Cero páginas indexables sin meta description o con meta description demasiado corta (resolver los 5 missing + 8 short)
  2. Cada página tiene exactamente un `<h1>` no vacío (resolver 3 missing + 22 páginas con múltiples H1)
  3. Open Graph completo (og:title, og:description, og:image, og:url, og:type) en las 6 páginas marcadas
  4. El MCP `schema-org` valida el JSON-LD del site sin errores (0 de los 14 errores de validación actuales)
  5. Ninguna página pública supera 2 MB de HTML; las 6 páginas marcadas como lentas están revisadas o documentadas
**Plans**: TBD

### Phase 20: Widget de Domain Rating en admin
**Goal**: Cada vez que Juan entra al admin ve el Domain Rating actual de juan-tech.com, refrescado a lo sumo 1 vez al día y cacheado server-side, con la atribución de licencia obligatoria
**Depends on**: Phase 19
**Requirements**: MONITOR-01, MONITOR-02, MONITOR-03
**Success Criteria** (what must be TRUE):
  1. Al entrar al admin de Payload, el dashboard muestra el Domain Rating numérico de `juan-tech.com` (endpoint público free, sin API key)
  2. El endpoint se llama a lo sumo 1 vez cada 24h; dentro de la ventana se sirve el valor cacheado desde el global `site-metrics` (`domainRating` + `fetchedAt`) sin volver a pegarle
  3. La UI incluye la atribución "Domain Rating by Ahrefs" enlazada a ahrefs.com (cumple la Domain Rating License)
  4. Si el fetch falla, se muestra el último DR cacheado marcado como desactualizado sin romper el dashboard; build/CI verdes
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 11. Fundación de analítica | v1.2 | — | ✅ Complete | 2026-06-24 |
| 12. Eventos de conversión | v1.2 | — | ✅ Complete | 2026-06-24 |
| 13. Eventos de engagement | v1.2 | — | ✅ Complete | 2026-06-24 |
| 14. Config GTM/GA4 & verificación | v1.2 | — | ✅ Complete | 2026-06-24 |
| 15. Causa raíz — emitter fijo y contenido saneado | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 16. Integridad de enlaces | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 17. Imágenes y hreflang | v1.3 | 0/TBD | Not started | - |
| 18. Indexabilidad y sitemap | v1.3 | 0/TBD | Not started | - |
| 19. On-page, schema y rendimiento | v1.3 | 0/TBD | Not started | - |
| 20. Widget de Domain Rating en admin | v1.3 | 0/TBD | Not started | - |
