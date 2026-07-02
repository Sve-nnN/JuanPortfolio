# Roadmap: JuanPortfolio

## Milestones

- ✅ **v1.0 Render estático/ISR & Edge Caching** — Phases 1-5 (shipped 2026-05)
- ✅ **v1.1 Core Web Vitals & Performance** — Phases 6-10 (shipped 2026-06)
- ✅ **v1.2 GA4 Analytics Tracking** — Phases 11-14 (shipped 2026-06-24)
- ✅ **v1.3 Remediación SEO técnica (Ahrefs Site Audit)** — Phases 15-20 (shipped 2026-06-25)
- ✅ **v1.4 Keyword targeting & Yoast-style SEO scoring** — Phases 21-24 (shipped 2026-06-26)
- ✅ **v1.5 Limpieza y alineación del admin de Payload** — Phases 25-30 (shipped 2026-06-26)
- 🚧 **v1.6 Auditoría integral & remediación (SEO + código)** — Phases 31-37 (en curso, iniciado 2026-07-02)
- 🚧 **v1.7 Rendimiento avanzado (Core Web Vitals)** — Phases 38-43 (roadmapped, iniciado 2026-07-02)

## Phases

### 🚧 v1.6 Auditoría integral & remediación (SEO + código) — Phases 31-37

Remediación de hallazgos del reporte SEO jul-2026 + crawl fresco + auditoría de código. 23 issues GitHub (#85-#107) + #12. Constante brownfield: 0 errores tsc nuevos sobre baseline (112 en tests/, 0 en src/), 776+ tests verdes, admin arranca.

#### Phase 31: Routing canónico del blog (crítico)

**Goal**: Un post = una URL canónica; las variantes de categoría dejan de duplicar y el hreflang se vuelve recíproco
**Requirements**: TECH-01, BUG-01, BUG-02, BUG-06
**Issues**: #85, #96, #97, #101
**Success Criteria**:
  1. `/blog/{cat-no-canónica}/{slug}` responde 301 a la categoría canónica (o 404 si categoría inválida)
  2. canonical y `alternates.languages` se derivan de la categoría real del post en Payload, no de `params`
  3. `revalidatePost` y `triggerCWVScan` usan la URL real `/blog/{categoría}/{slug}` (helper compartido)
  4. `generateStaticParams` prerenderiza el slug correcto por locale
**Gate**: tsc/tests verdes; verificación en `pnpm dev` de un 301 de variante

#### Phase 32: Sitemap & enlazado interno

**Goal**: Todo post publicado y accesible está en el sitemap y recibe ≥1 enlace interno
**Requirements**: TECH-04, TECH-05
**Issues**: #88, #89
**Success Criteria**:
  1. Los 3 posts hoy ausentes aparecen en `posts-sitemap.xml`
  2. Los 5 posts `/blog/general/*` reciben enlace interno (listado de categoría completo)
  3. Sin leaks: nada accesible fuera del sitemap ni huérfano

#### Phase 33: Metadata, OG image & schema

**Goal**: Preview social funciona en todo el blog, un solo H1 por página, JSON-LD con tipos reconocibles
**Requirements**: TECH-02, TECH-06, SCH-01, BUG-05
**Issues**: #86, #90, #92, #100
**Success Criteria**:
  1. og:image de posts con coma en el título devuelve 200 (doble-encode)
  2. Home tiene exactamente 1 H1; `/contact` conserva su H1
  3. JSON-LD consolidado en `@graph` único reconocible (sin "Unknown"), sin `@id` duplicados
  4. `generateMetadata` no emite metadata de drafts

#### Phase 34: Resiliencia runtime (authors 500 + llms.txt)

**Goal**: Las rutas que consultan Payload en runtime no caen en cold-start ni sirven contenido roto
**Requirements**: TECH-03, GEO-01, GEO-02
**Issues**: #87, #93, #94
**Success Criteria**:
  1. `/authors/[slug]` estable (try/catch + cache) y emite ProfilePage/Person
  2. `/llms.txt` sirve markdown válido en prod (no el string del catch)
  3. `/llms-full.txt` deja de servir HTML del home (implementado o 404 limpio)

#### Phase 35: Bugs restantes & hardening

**Goal**: Cerrar los bugs de bajo riesgo y endurecer headers
**Requirements**: BUG-03, BUG-04, TECH-07
**Issues**: #98, #99, #91
**Success Criteria**:
  1. `revalidatePost` usa optional chaining; sin crash en create
  2. `internal-links/apply` devuelve `success:false` si no aplica; no reescribe espurio
  3. `x-powered-by` ausente en las respuestas

#### Phase 36: Performance — LCP de la home

**Goal**: Reducir el render delay de la home hacia LCP < 2500ms
**Requirements**: PERF-01
**Issues**: #95
**Success Criteria**:
  1. Bloques below-the-fold cargados con `next/dynamic`
  2. Preloads de fuentes recortados al peso del H1
  3. Animación del hero aislada en wrapper cliente; H1/CTAs server-rendered
  4. Menos JS inicial medido (bundle de la home)

#### Phase 37: Acciones manuales (Juan) & verificación final

**Goal**: Dejar los items no-código accionables por Juan y verificar el milestone con re-crawl
**Requirements**: PERF-02, PERF-03, CNT-01, CNT-02, CNT-03, CNT-04, INFRA-01
**Issues**: #102, #103, #104, #105, #106, #107, #12
**Success Criteria**:
  1. Checklist claro de acciones Cloudflare (Rocket Loader, www TLS) y Vercel (INP) para Juan
  2. Ediciones de contenido en Payload documentadas (javascript-seo meta, FAQ /en, ejemplo.com, llms fullContent)
  3. Re-crawl/verificación de los fixes de código desplegados; issues de código cerrados


### 🚧 v1.7 Rendimiento avanzado (Core Web Vitals) — Phases 38-43

Bajar LCP mobile de la home de 7.4s a < 2500ms y el INP a < 200ms recortando el JS de arranque (~27 chunks/~325KB gzip) y refactorizando el hero a server component, sin regresión visual (QA visual obligatorio) ni del H1/LCP-en-SSR logrado en v1.1. Requirements PERF-04 a PERF-11. Issues #95 (LCP), #103 (INP).

#### Phase 38: Medición de campo — INP real por interacción

**Goal**: Saber qué interacción concreta dispara INP > 200ms antes de optimizar a ciegas
**Requirements**: PERF-10
**Success Criteria**:
  1. El INP emitido por el reporter `web-vitals`→GA4 (#103) es consultable por interacción y por página (evento GA4 con `interaction_id`/target o equivalente)
  2. Se identifica y documenta cuál interacción concreta de la home excede 200ms (o se confirma que ninguna lo hace con el tráfico disponible)
  3. La lectura de este INP de campo se usa para confirmar o ajustar la prioridad de las fases 39-42 (documentado en STATE.md)

#### Phase 39: Hero server component + recorte de JS inicial

**Goal**: El H1/LCP de la home deja de depender de la hidratación del hero, y el JS que ejecuta en el arranque baja de forma medible respecto al baseline (~27 chunks/~325KB gzip)
**Depends on**: Phase 38
**Requirements**: PERF-04, PERF-05, PERF-06
**Success Criteria**:
  1. El hero se sirve como server component; solo la animación parallax vive en un wrapper cliente chico (`'use client'`) que envuelve contenido ya renderizado en servidor
  2. El H1 se pinta en el HTML de SSR sin depender de hidratación (sin regresión del fix de v1.1); mismo layout/copy
  3. La animación de entrada/parallax es visualmente idéntica a la actual (misma curva, timing, layout) — confirmado por QA visual antes/después; si CSS puro iguala a framer-motion en el entrance, se reemplaza para no bundlear la librería en el above-the-fold
  4. Bloques below-the-fold (Testimonials, FeaturedBlog, Contact, etc.) cargan con `next/dynamic`; el peso JS medido de la home baja frente al baseline de 27 chunks/~325KB gzip
  5. tsc baseline (0 nuevos en `src/`) y tests verdes

**Gate**: QA visual obligatorio del hero (antes/después, mobile + desktop) antes de mergear — no se avanza a Phase 40 sin el visto bueno

#### Phase 40: Validación de TBT/INP tras el recorte de JS

**Goal**: El recorte de JS de Phase 39 se traduce en una baja medible de TBT que habilite INP < 200ms
**Depends on**: Phase 39
**Requirements**: PERF-07
**Success Criteria**:
  1. TBT mobile de la home baja de ~2180ms (baseline) medido con Unlighthouse mobile tras el merge de Phase 39
  2. El INP de campo (dataLayer→GA4, Phase 38) se re-consulta y confirma mejora frente a la lectura inicial, o se documenta por qué no
  3. Si TBT/INP no alcanzan el objetivo, se identifica el siguiente cuello de botella concreto (no se cierra la fase con "mejoró un poco")

#### Phase 41: Recorte de preloads de fuentes

**Goal**: Solo la fuente del H1 se preloadea; el resto no compite por ancho de banda con el LCP, sin introducir FOUT perceptible
**Depends on**: Phase 39
**Requirements**: PERF-08
**Success Criteria**:
  1. Solo el peso de Array usado por el H1 (Bold/Extrabold) queda con `preload:true`; Geist Sans/Mono pasan a `preload:false` si no son above-the-fold
  2. El HTML de la home baja de 5 a 1-2 `<link rel=preload as=font>`
  3. QA visual confirma que no hay salto de texto (FOUT) perceptible en la carga de la home, mobile y desktop

**Gate**: QA visual obligatorio del cambio de preloads antes de mergear

#### Phase 42: Cache de HTML en el edge (Cloudflare)

**Goal**: La home y los posts se sirven cacheados desde el edge de Cloudflare en visitas repetidas, sin romper el ISR de Next ni el bypass de draft/preview
**Depends on**: Phase 39
**Requirements**: PERF-09
**Success Criteria**:
  1. `curl -I` a la home y a un post en visita repetida devuelve `cf-cache-status: HIT` (hoy `DYNAMIC`)
  2. El contenido servido respeta la ventana de revalidación ISR de Next (sin servir stale más allá de lo configurado)
  3. `draftMode()`/preview sigue funcionando: una request en modo preview no se sirve desde la cache de Cloudflare

#### Phase 43: Re-medición final y procedimiento repetible

**Goal**: El milestone queda validado contra el baseline con números reproducibles, y queda un procedimiento que Juan puede repetir en el futuro
**Depends on**: Phase 40, Phase 41, Phase 42
**Requirements**: PERF-11
**Success Criteria**:
  1. `npx unlighthouse-ci --site https://juan-tech.com --urls /` corrido post-milestone da LCP < 2500ms e INP < 200ms mobile (o se documenta el gap remanente con causa identificada)
  2. Los números antes/después (Perf score, LCP, TBT, CLS, INP) quedan registrados en STATE.md junto al baseline de `.planning/research/audit-jul2026/03-performance.md`
  3. El procedimiento de re-medición queda documentado como comando reproducible (no ad-hoc) para usarlo en milestones futuros
  4. Sin regresión de CLS (≤ 0.01) ni del H1-visible-en-SSR de v1.1; tsc baseline y tests verdes en el estado final del milestone

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

<details>
<summary>✅ v1.4 Keyword targeting & Yoast-style SEO scoring (Phases 21-24) — SHIPPED 2026-06-26</summary>

**Milestone Goal:** Cada página (Post, Page, listado) tiene una keyword objetivo con sus métricas a la vista, un semáforo estilo Yoast en el editor que compara la keyword contra title/meta/H1/slug/contenido, y una auditoría de cobertura que permite saber de un vistazo qué páginas faltan de optimizar.

- [x] **Phase 21: Keyword data model** - Agregar `primaryKeyword` a Pages y mapeo de keyword para listados de categoría/autor, igual que Posts (completed 2026-06-25)
- [x] **Phase 22: Metrics panel + Yoast traffic light** - Panel de métricas de la keyword y semáforo verde/ámbar/rojo por check en el sidebar del editor, con recálculo en vivo (completed 2026-06-25)
- [x] **Phase 23: Coverage audit** - Reporte repetible de páginas sin keyword y páginas con keyword que fallan algún check del semáforo (completed 2026-06-26)
- [x] **Phase 24: Keyword research population** - Poblar keywords desde `content/keywords.md` / DinoRank y verificar que los docs de `keyword-metrics` tengan métricas cargadas (completed 2026-06-26)

</details>

### ✅ v1.5 Limpieza y alineación del admin de Payload (Phases 25-30) — SHIPPED 2026-06-26

**Milestone Goal:** Eliminar el código muerto del admin (plugin SEO fantasma, andamiaje DDD `domains/`, backups/re-exports, scripts one-off), endurecer accesos de las colecciones de métricas, unificar consistencia (group/labels/nav) y estrategia de assets — con verificación runtime de integraciones como gate previo a borrar cualquier código dependiente. Es un refactor brownfield: cada fase mantiene tsc sin errores nuevos (baseline 114), tests verdes (775+) y el admin arrancando tras regenerar el importMap.

- [ ] **Phase 25: Verificación runtime de integraciones (gate)** - Confirmar en `pnpm dev` qué integraciones funcionan/rotas/a-conservar ANTES de borrar código dependiente
- [ ] **Phase 26: Retirada del plugin SEO fantasma** - Borrar `src/plugins/seo/` reubicando los 4 módulos vivos sin romper consumidores
- [ ] **Phase 27: Colapso de `domains/` y leftovers huérfanos** - Mover AdBanner a `collections/`, borrar el resto de `domains/` + backups/re-exports
- [ ] **Phase 28: Limpieza de scripts one-off** - Borrar scripts fix/debug ya aplicados conservando lo cableado en package.json
- [ ] **Phase 29: Accesos endurecidos y assets unificados** - Restringir `access` de métricas y dejar una sola fuente de assets (Blob vs Cloudinary)
- [ ] **Phase 30: Consistencia del admin** - `group:'SEO'` uniforme, labels bilingües `{en,es}`, nav links con iconos del design system

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

### Phase 25: Verificación runtime de integraciones (gate)

**Goal**: Confirmar en runtime (`pnpm dev`, con credenciales reales) el estado de cada integración del admin — Ahrefs, DinoRank, Indexing API y GSC — y marcarla funcional / rota / a-conservar ANTES de borrar cualquier código dependiente. Fase de checklist humano; Juan ejecuta y firma el resultado.
**Depends on**: Phase 24
**Requirements**: VERIFY-01
**Success Criteria** (what must be TRUE):

  1. Existe un doc/checklist reproducible (en `.planning/` o `docs/`) con los pasos exactos en `pnpm dev` para probar end-to-end: Ahrefs (`/api/domain-rating` + `DomainRatingCard`), DinoRank (`DinoRankWriteButton`→`/api/dinorank/redactar`), Indexing (`IndexingControl`→`/api/seo/indexing`) y GSC (dashboard/OAuth + `sync:gsc`)
  2. Cada una de las 4 integraciones queda marcada explícitamente como **funcional / rota / a-conservar**, con evidencia registrada (status code, captura o nota)
  3. Por cada integración se listan sus archivos/rutas de código dependientes, de modo que ninguna limpieza posterior (fases 26-30) toque código de una integración marcada como viva
  4. Juan ejecuta el checklist con credenciales reales y el veredicto queda registrado en STATE.md como gate aprobado antes de iniciar cualquier borrado

**Plans**: TBD

### Phase 26: Retirada del plugin SEO fantasma (preservando módulos vivos)

**Goal**: Eliminar el árbol muerto de `src/plugins/seo/` (plugin casero nunca registrado) reubicando los 4 módulos vivos a una ubicación honesta, sin romper a ninguno de sus consumidores. Refactor brownfield: tsc/vitest/admin deben seguir verdes.
**Depends on**: Phase 25
**Requirements**: CLEAN-01
**Success Criteria** (what must be TRUE):

  1. Los 4 módulos vivos (`utils/seoAnalyzer.ts`, `utils/keywordCoverageAudit.ts` +test, `fields/seoFields.ts`, `types/keywordScore.ts`) se mueven a `src/lib/seo/` (o `src/utilities/seo/`) y todos sus imports se repointan: API routes `/api/seo/keyword-score` y `/api/seo/keyword-coverage`, `KeywordScorePanel`, `KeywordCoverageView`, script `audit-keywords`, y `seoFields` en Users/Categories
  2. `grep -r "plugins/seo" src/` devuelve cero ocurrencias y la carpeta `src/plugins/seo/` ya no existe (index, endpoints/*, components/*, hooks/*, `utils/schemaGenerator.ts` borrados)
  3. `tsc` no introduce errores nuevos sobre el baseline (114) y `vitest` sigue verde (775+ tests, incluido el de `keywordCoverageAudit`)
  4. Tras regenerar el importMap, el admin arranca y `KeywordScorePanel` + la vista de cobertura siguen renderizando datos correctamente

**Plans**: TBD
**UI hint**: yes

### Phase 27: Colapso de `src/domains/**` y leftovers huérfanos

**Goal**: Eliminar el andamiaje DDD abandonado de `src/domains/**` moviendo el único módulo vivo (`AdBanner.ts`) a `src/collections/` y repuntando la config, y borrar los backups/re-exports huérfanos. Refactor brownfield: tsc/vitest/admin verdes.
**Depends on**: Phase 26
**Requirements**: CLEAN-02, CLEAN-03
**Success Criteria** (what must be TRUE):

  1. `ad-banners/domain/AdBanner.ts` se mueve a `src/collections/` (p.ej. `src/collections/AdBanners/`) y `payload.config.ts:21` apunta al nuevo path; la colección `ad-banners` sigue registrada y editable en el admin
  2. `src/domains/` ya no existe y `grep -r "domains/" src/` devuelve cero imports (Category/User/Post duplicados, repos, use-cases y hooks borrados)
  3. `src/collections/Users/index.ts.backup` y `src/collections/AdBanners/index.ts` (re-export huérfano) están borrados, verificado que nadie los importa
  4. `tsc` sin errores nuevos (baseline 114), `vitest` verde y el admin arranca tras regenerar el importMap

**Plans**: TBD

### Phase 28: Limpieza de scripts one-off

**Goal**: Eliminar los scripts one-off/debug ya aplicados, conservando todos los scripts cableados en `package.json` y su soporte (`scripts/services|seo|sync|internal-linking|engine|dinorank`).
**Depends on**: Phase 27
**Requirements**: SCRIPT-01
**Success Criteria** (what must be TRUE):

  1. Los one-off confirmados (`fix-test-post-author`, `inspect-test-post`, `fix-user-slugs`, `delete-loop-redirects`, `debug-content`, `debug-dino`) están borrados
  2. Los ambiguos (`fix-registry`, `cleanup-registry`, `fix-categories`, `assign-categories`, setup/validate/verify) se revisan caso a caso y se borran o se conservan con una nota que justifica la decisión
  3. Todos los scripts referenciados en `package.json` y su soporte siguen existiendo; ningún `pnpm <script>` cableado rompe
  4. `tsc` sin errores nuevos y build/CI verdes (el build type-checkea los scripts)

**Plans**: TBD

### Phase 29: Accesos endurecidos y estrategia única de assets

**Goal**: Cerrar el `access` abierto de las colecciones de métricas y dejar una sola fuente de assets para Media, sin romper el cron ni las imágenes existentes. Cambios de comportamiento (no solo borrado): requieren verificación funcional.
**Depends on**: Phase 28
**Requirements**: SEC-01, ASSET-01
**Success Criteria** (what must be TRUE):

  1. `keyword-metrics`, `page-metrics` y `gsc-metrics` ya no tienen `access` con `() => true`; create/update (y read donde corresponda) requieren usuario `authenticated` o el secret del cron
  2. Los flujos de cron/scripts que escriben esas colecciones siguen funcionando con el secret (verificado), y un request no autenticado a create/update recibe 403
  3. Se decide y documenta una sola fuente de assets (Vercel Blob o Cloudinary) y se elimina la redundante de la colección Media (botones/endpoint Cloudinary o la config de Blob)
  4. Las imágenes existentes siguen sirviéndose con 200; `tsc` sin errores nuevos, el admin arranca y los tests siguen verdes

**Plans**: TBD
**UI hint**: yes

### Phase 30: Consistencia del admin (group/labels/nav)

**Goal**: Unificar la presentación del admin: agrupar las colecciones de métricas bajo SEO, labels bilingües consistentes y nav links con iconos del design system. Cambios cosméticos al final, una vez el código está limpio.
**Depends on**: Phase 29
**Requirements**: CONSIST-01, CONSIST-02, CONSIST-03
**Success Criteria** (what must be TRUE):

  1. Las 4 colecciones (`keyword-metrics`, `page-metrics`, `gsc-metrics`, `broken-links`) tienen `group: 'SEO'` y aparecen agrupadas bajo SEO en el menú lateral
  2. Los labels de colecciones, tabs ("Search Console", "Internal Links", "Meta") y campos usan objetos `{ en, es }` de forma consistente con la localización del proyecto
  3. `GSCDashboardLink` y `KeywordCoverageLink` usan iconos/tokens del design system de Payload en vez de emoji inline (📈) y estilos hardcodeados
  4. `tsc` sin errores nuevos, el admin arranca tras regenerar el importMap y los tests siguen verdes

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
| 17. Imágenes y hreflang | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 18. Indexabilidad y sitemap | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 19. On-page, schema y rendimiento | v1.3 | ◐ | ✅ Complete (META-03/04, PERF-02 parciales: faltan URLs Ahrefs) | 2026-06-24 |
| 20. Widget de Domain Rating en admin | v1.3 | ✓ | ✅ Complete | 2026-06-24 |
| 21. Keyword data model | v1.4 | 1/1 | ✅ Complete | 2026-06-25 |
| 22. Metrics panel + Yoast traffic light | v1.4 | 2/2 | ✅ Complete | 2026-06-25 |
| 23. Coverage audit | v1.4 | 2/2 | ✅ Complete | 2026-06-26 |
| 24. Keyword research population | v1.4 | 2/2 | ✅ Complete | 2026-06-26 |
| 25. Verificación runtime de integraciones (gate) | v1.5 | — | ⏳ Gate (Juan) | - |
| 26. Retirada del plugin SEO fantasma | v1.5 | 1/1 | ✅ Complete | 2026-06-26 |
| 27. Colapso de domains/ y leftovers huérfanos | v1.5 | 1/1 | ✅ Complete | 2026-06-26 |
| 28. Limpieza de scripts one-off | v1.5 | 1/1 | ✅ Complete | 2026-06-26 |
| 29. Accesos endurecidos y assets unificados | v1.5 | 1/1 | ✅ Complete | 2026-06-26 |
| 30. Consistencia del admin | v1.5 | 1/1 | ✅ Complete | 2026-06-26 |
| 38. Medición de campo — INP real por interacción | v1.7 | 0/? | Not started | - |
| 39. Hero server component + recorte de JS inicial | v1.7 | 0/? | Not started | - |
| 40. Validación de TBT/INP tras el recorte de JS | v1.7 | 0/? | Not started | - |
| 41. Recorte de preloads de fuentes | v1.7 | 0/? | Not started | - |
| 42. Cache de HTML en el edge (Cloudflare) | v1.7 | 0/? | Not started | - |
| 43. Re-medición final y procedimiento repetible | v1.7 | 0/? | Not started | - |
</content>
</invoke>
