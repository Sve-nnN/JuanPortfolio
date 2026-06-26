# Roadmap: JuanPortfolio

## Milestones

- ✅ **v1.0 Render estático/ISR & Edge Caching** — Phases 1-5 (shipped 2026-05)
- ✅ **v1.1 Core Web Vitals & Performance** — Phases 6-10 (shipped 2026-06)
- ✅ **v1.2 GA4 Analytics Tracking** — Phases 11-14 (shipped 2026-06-24)
- ✅ **v1.3 Remediación SEO técnica (Ahrefs Site Audit)** — Phases 15-20 (shipped 2026-06-25)
- 🚧 **v1.4 Keyword targeting & Yoast-style SEO scoring** — Phases 21-24 (in progress)

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

<details>
<summary>✅ v1.3 Remediación SEO técnica (Ahrefs Site Audit) — Phases 15-20 — SHIPPED 2026-06-25</summary>

### Phase 15: Causa raíz — emitter fijo y contenido saneado

**Goal**: El pipeline de internal-linking nunca vuelve a escribir `[[slug|label]]` crudo y todo el contenido publicado queda libre de wikilinks sin resolver
**Depends on**: Phase 14
**Requirements**: LINKS-01, LINKS-02, IMG-02
**Success Criteria** (what must be TRUE):

  1. Grep de `[[` sobre todos los archivos markdown del repo y el HTML renderizado de páginas spot-chequeadas devuelve cero ocurrencias en valores de `href` o `src`
  2. El `LinkInjector.ts` tiene tests que confirman que su output es siempre HTML válido o texto plano, nunca un wikilink crudo sin resolver
  3. Las imágenes embebidas como `![[...]]` en markdown del contenido se convierten a URLs válidas o se eliminan, sin `[[` en los `src` renderizados
  4. CI verde tras el fix; `build-internal-links.ts` no introduce regresiones en otros links válidos

**Plans**: Complete

### Phase 16: Integridad de enlaces

**Goal**: Cero links internos que apunten a 404/4XX, usen rutas de categoría incorrectas, redirijan en lugar de apuntar al destino final, o enlacen a contenido de test
**Depends on**: Phase 15
**Requirements**: LINKS-03, LINKS-04, LINKS-05, LINKS-06
**Success Criteria** (what must be TRUE):

  1. Los slugs reportados como inexistentes son eliminados de los links internos o redirigidos a su URL real con 200
  2. Ningún link interno usa ruta plana `/blog/[slug]` para posts que viven bajo `/blog/[category]/[slug]`
  3. Ningún link interno apunta a `/posts/*`; todos apuntan al destino `/blog/*` final sin cadena de redirects
  4. Rutas de test no aparecen en el sitemap ni en ningún anchor interno del site

**Plans**: Complete

### Phase 17: Imágenes y hreflang

**Goal**: Cero imágenes rotas en páginas públicas y consistencia total entre `<html lang>` y las anotaciones hreflang en todas las páginas
**Depends on**: Phase 16
**Requirements**: IMG-01, IMG-03, HREF-01, HREF-02
**Success Criteria** (what must be TRUE):

  1. `<html lang="es">` en páginas sin prefijo de locale; `<html lang="en">` en páginas bajo `/en/`
  2. Todas las anotaciones hreflang apuntan a URLs que devuelven 200 y son recíprocas (es ↔ en)
  3. La ruta `/_next/image?url=/api/media/file/juan-angulo-portrait-1.avif` devuelve HTTP 200 (el retrato deja de dar 400)
  4. Spot-check en Ahrefs o curl de `og:image` y `<img>` en páginas principales confirma 0 imágenes con respuesta non-200

**Plans**: Complete
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

**Plans**: Complete

### Phase 19: On-page, schema y rendimiento

**Goal**: Cada página indexable tiene on-page completo (meta desc, H1, títulos, OG), el JSON-LD no tiene errores de validación y ninguna página excede los límites de Googlebot
**Depends on**: Phase 18
**Requirements**: META-01, META-02, META-03, META-04, SCHEMA-01, PERF-01, PERF-02
**Success Criteria** (what must be TRUE):

  1. Cero páginas indexables sin meta description o con meta description demasiado corta
  2. Cada página tiene exactamente un `<h1>` no vacío
  3. Open Graph completo (og:title, og:description, og:image, og:url, og:type) en las páginas marcadas
  4. El MCP `schema-org` valida el JSON-LD del site sin errores
  5. Ninguna página pública supera 2 MB de HTML

**Plans**: Complete

### Phase 20: Widget de Domain Rating en admin

**Goal**: Cada vez que Juan entra al admin ve el Domain Rating actual de juan-tech.com, refrescado a lo sumo 1 vez al día y cacheado server-side, con la atribución de licencia obligatoria
**Depends on**: Phase 19
**Requirements**: MONITOR-01, MONITOR-02, MONITOR-03
**Success Criteria** (what must be TRUE):

  1. Al entrar al admin de Payload, el dashboard muestra el Domain Rating numérico de `juan-tech.com` (endpoint público free, sin API key)
  2. El endpoint se llama a lo sumo 1 vez cada 24h; dentro de la ventana se sirve el valor cacheado desde el global `site-metrics` sin volver a pegarle
  3. La UI incluye la atribución "Domain Rating by Ahrefs" enlazada a ahrefs.com (cumple la Domain Rating License)
  4. Si el fetch falla, se muestra el último DR cacheado marcado como desactualizado sin romper el dashboard; build/CI verdes

**Plans**: Complete
**UI hint**: yes

</details>

### 🚧 v1.4 Keyword targeting & Yoast-style SEO scoring (In Progress)

**Milestone Goal:** Cada página (Post, Page, listado) tiene una keyword objetivo con sus métricas a la vista, un semáforo estilo Yoast en el editor que compara la keyword contra title/meta/H1/slug/contenido, y una auditoría de cobertura que permite saber de un vistazo qué páginas faltan de optimizar.

- [x] **Phase 21: Keyword data model** - Agregar `primaryKeyword` a Pages y mapeo de keyword para listados de categoría/autor, igual que Posts (completed 2026-06-25)
- [x] **Phase 22: Metrics panel + Yoast traffic light** - Panel de métricas de la keyword y semáforo verde/ámbar/rojo por check en el sidebar del editor, con recálculo en vivo (completed 2026-06-25)
- [x] **Phase 23: Coverage audit** - Reporte repetible de páginas sin keyword y páginas con keyword que fallan algún check del semáforo (completed 2026-06-26)
- [x] **Phase 24: Keyword research population** - Poblar keywords desde `content/keywords.md` / DinoRank y verificar que los docs de `keyword-metrics` tengan métricas cargadas (completed 2026-06-26)

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

### Phase 21: Keyword data model

**Goal**: Cada documento de Pages puede tener asignada una keyword objetivo idéntica a como ya funciona en Posts, y los listados de categoría/autor tienen un mecanismo para asignar la suya
**Depends on**: Phase 20
**Requirements**: KW-01, KW-02, KW-03
**Success Criteria** (what must be TRUE):

  1. En el admin de Payload, la vista de edición de cualquier Page tiene un campo "Primary Keyword" que guarda una relación a `keyword-metrics`, igual que Posts
  2. El documento de categoría (o la configuración de autor) expone un campo para asignar una keyword objetivo, de modo que esas páginas de listado entran en el scoring
  3. No existe ningún campo de texto suelto paralelo para la keyword en Posts ni en Pages: el único mecanismo es la relación `primaryKeyword`→`keyword-metrics`
  4. Guardar una keyword en Pages no rompe el comportamiento existente del campo `primaryKeyword` en Posts; tests/build CI verdes

**Plans**: 1 plan

  - [x] 21-1-PLAN.md — Agregar primaryKeyword (+semanticKeywords) a Pages y primaryKeyword a Categories/Users vía relación a keyword-metrics; regenerar tipos y verificar build

**UI hint**: yes

### Phase 22: Metrics panel + Yoast traffic light

**Goal**: El editor de cada Post y Page ve las métricas de la keyword asignada y un semáforo por check (title/meta/H1/slug/densidad/primer párrafo/subtítulos) que se actualiza con el contenido actual sin necesidad de publicar
**Depends on**: Phase 21
**Requirements**: METRICS-01, METRICS-02, SCORE-01, SCORE-02, SCORE-03, SCORE-04
**Success Criteria** (what must be TRUE):

  1. El sidebar del editor muestra volumen, dificultad, intent y opportunityScore de la keyword asignada, leídos de `keyword-metrics`
  2. Si la keyword no tiene métricas cargadas (o no hay keyword asignada), el panel muestra un estado claro ("sin datos") sin errores ni pantallas rotas
  3. El sidebar muestra un indicador verde/ámbar/rojo para cada uno de los checks: keyword en title, en meta description, en H1, en slug, densidad en el cuerpo, presencia en el primer párrafo y en subtítulos
  4. Cada check fallido muestra un texto de feedback accionable (qué falta y cómo corregirlo), construido sobre `seoAnalyzer.ts`
  5. Un score global 0-100 con badge de color es visible de un vistazo; el valor cambia en tiempo real al editar el contenido sin necesidad de guardar

**Plans**: 2 plans

Plans:

- [x] 22-1-PLAN.md — Scoring engine: analyzeKeywordChecks (es/en stemming, weighted score, blocks-aware extractor) + authenticated /api/seo/keyword-score endpoint + tests
- [x] 22-2-PLAN.md — KeywordScorePanel sidebar component (metrics + 7-check traffic light + score badge, 4 states, 300ms live recompute) + register ui field in Posts & Pages

**UI hint**: yes

### Phase 23: Coverage audit

**Goal**: Un reporte repetible lista de forma completa qué páginas no tienen keyword asignada y cuáles tienen keyword pero fallan algún check del semáforo
**Depends on**: Phase 22
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03
**Success Criteria** (what must be TRUE):

  1. Ejecutar la auditoría (script o vista en el admin) produce una lista de todos los Posts, Pages y listados que no tienen `primaryKeyword` asignada
  2. La auditoría produce una segunda lista con las páginas que tienen keyword pero fallan uno o más checks del semáforo, con el detalle de qué checks fallan en cada una
  3. La auditoría se puede volver a ejecutar tras hacer cambios y refleja el estado actualizado (sin datos stale hardcoded)

**Plans**: 2 plans

Plans:

- [ ] 23-01-PLAN.md — Shared coverage core (runKeywordCoverageAudit reusing analyzeKeywordChecks, N/A for listings) + tsx script (console + markdown report) + audit:keywords alias + unit test
- [ ] 23-02-PLAN.md — Authenticated /api/seo/keyword-coverage endpoint + Payload admin view (two lists, bilingual, refresh) + config registration

### Phase 24: Keyword research population

**Goal**: Todas las páginas mapeadas en el research de DinoRank tienen su `primaryKeyword` asignada y los docs de `keyword-metrics` correspondientes tienen métricas cargadas; las que no tienen datos quedan marcadas explícitamente
**Depends on**: Phase 21
**Requirements**: RESEARCH-01, RESEARCH-02
**Success Criteria** (what must be TRUE):

  1. Cada Post y Page que aparece en `content/keywords_map.json` tiene un `primaryKeyword` asignado en Payload (sin nulos donde el mapeo existe)
  2. Cada keyword asignada tiene su doc de `keyword-metrics` con al menos volume, difficulty e intent cargados desde el research de DinoRank
  3. Las keywords sin datos de métricas disponibles están marcadas en su doc de `keyword-metrics` (campo o nota) para investigar, y la auditoría de Phase 23 las lista correctamente

**Plans**: 2 plans

- [x] 24-01-PLAN.md — Localizar primaryKeyword (Posts/Pages/Categories/Users) + regenerar tipos + ripple Fases 22/23 (panel locale-aware, auditoría per-locale) + tests ✅ (776 tests, tsc baseline intacto, sin regresión 21/22/23)
- [x] 24-02-PLAN.md — Script populate:keywords (resolver slug→doc por locale, match keyword-metrics insensible a may/acentos, no clobber/--force/--dry-run, stubs needs-research, marcado de métricas faltantes) + alias package.json

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 11. Fundación de analítica | v1.2 | — | ✅ Complete | 2026-06-24 |
| 12. Eventos de conversión | v1.2 | — | ✅ Complete | 2026-06-24 |
| 13. Eventos de engagement | v1.2 | — | ✅ Complete | 2026-06-24 |
| 14. Config GTM/GA4 & verificación | v1.2 | — | ✅ Complete | 2026-06-24 |
| 15. Causa raíz — emitter fijo y contenido saneado | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 16. Integridad de enlaces | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 17. Imágenes y hreflang | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 18. Indexabilidad y sitemap | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 19. On-page, schema y rendimiento | v1.3 | ◐ | ✅ Complete (META-03/04, PERF-02 parciales: faltan URLs Ahrefs) | 2026-06-24 |
| 20. Widget de Domain Rating en admin | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 21. Keyword data model | v1.4 | 1/1 | Complete   | 2026-06-25 |
| 22. Metrics panel + Yoast traffic light | v1.4 | 2/2 | Complete   | 2026-06-25 |
| 23. Coverage audit | v1.4 | 2/2 | ✅ Complete | 2026-06-26 |
| 24. Keyword research population | v1.4 | 2/2 | Complete   | 2026-06-26 |
