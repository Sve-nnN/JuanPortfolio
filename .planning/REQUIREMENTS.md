# Requirements — Milestone v1.9 (Estandarización del admin de Payload)

Derivado de: pedido de Juan (reducir secciones del admin y poder crear/editar páginas; hoy son globals poco escalables) + codebase de referencia `aprendoclub` (nav Contenido/Sitio, page-builder en `Pages`, 1 global).

**Enfoque:** refactor interno del admin de Payload. Migrar layouts singleton (globals con `layout: blocks`) a la colección `Pages` (creable/duplicable), agrupar la nav y sumar Authors, **sin regresionar** rendimiento/ISR, SEO (hreflang/canonical/`<html lang>`), live preview ni tests.

**Riesgo eje:** el ruteo de la home ES (`/`) ya es delicado por el trabajo ISR de v1.0/v1.7. Toda superficie pública migrada exige QA de render + visual antes de mergear.

Convención label GitHub: `payload`, `admin`, `refactor`, tanda `v1.9-admin`.

## Definition of Done (por superficie migrada)

- La ruta pública renderiza idéntica a antes (paridad visual) y mantiene `x-vercel-cache: HIT` / ISR (sin `no-store`).
- `hreflang`, `canonical` y `<html lang>` correctos por locale.
- Live preview de Payload funciona sobre la nueva entrada de `Pages`.
- El global migrado se retira del config sin rutas rotas ni datos huérfanos.
- tsc baseline (0 nuevos en `src/`) y tests verdes.

## v1.9 Requirements

### Migración globals → colección Pages
- [x] **PAGES-01**: El editor puede crear una página nueva desde la colección `Pages`, asignarle slug y publicarla en su ruta pública.
- [x] **PAGES-02**: El editor puede duplicar una página existente como base para una nueva.
- [ ] **PAGES-03**: El contenido de la Home se sirve desde una entrada editable de `Pages` en `/` (home ES), sin regresionar ISR/edge-cache ni el ruteo.
- [x] **PAGES-04**: El listado de blog (ex-`BlogListing`) se sirve desde una entrada editable de `Pages` en lugar del global.
- [x] **PAGES-05**: El listado de case studies (ex-`CaseStudiesListing`) se sirve desde una entrada editable de `Pages` en lugar del global.
- [ ] **PAGES-06**: Los globals `home`/`bloglisting`/`casestudieslisting` se retiran del config y del render sin dejar rutas rotas ni datos huérfanos (migración de datos incluida).

### Consolidación de la nav del admin
- [x] **NAV-01**: El contenido editorial (Pages, Posts, Categories, Authors, Media) aparece agrupado bajo **Contenido** en el sidebar.
- [x] **NAV-02**: La configuración del sitio (Site Settings, Header, Footer, Styles, LLM, Robots) aparece agrupada bajo **Sitio**.
- [x] **NAV-03**: Las herramientas SEO/métricas (KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks, Redirects) aparecen agrupadas bajo **SEO/Métricas**.
- [x] **NAV-04**: Las piezas de marketing/portfolio (Works, CaseStudies, Clientes, Testimonials, AdBanners, Forms, Search) aparecen agrupadas bajo **Marketing**.
- [x] **NAV-05**: El admin no muestra secciones sueltas sin grupo; el orden de grupos es intencional y consistente (labels bilingües es/en).

### Colección Authors
- [x] **AUTHORS-01**: Existe una colección `Authors` editable en el admin (bajo Contenido).
- [x] **AUTHORS-02**: Un `Post` puede relacionarse con uno o más `Authors` vía campo relación.
- [x] **AUTHORS-03**: La author page pública y el `authors-sitemap` consumen la colección `Authors` sin romperse (paridad de datos actuales).

### Limpieza de globals
- [ ] **CLEAN-01**: Se revisan los globals restantes (Styles, LLM, Robots) y se consolidan/reubican los redundantes de forma coherente con los grupos de nav, documentando la decisión.
- [ ] **CLEAN-02**: Documentar en el repo cómo crear una página nueva y qué global quedó como qué (guía corta para el editor/Juan).

### QA & no-regresión (cross-cutting)
- [ ] **QA-01**: Las rutas públicas migradas (`/`, blog, case studies) conservan ISR/edge-cache (`x-vercel-cache: HIT`, sin `no-store`) verificado.
- [ ] **QA-02**: `hreflang`, `canonical` y `<html lang>` verificados correctos por locale post-migración.
- [ ] **QA-03**: Live preview de Payload verificado sobre las páginas migradas.
- [ ] **QA-04**: tsc baseline y suite de tests verdes al cierre del milestone.

## Future Requirements (deferidos)
- Nested docs / jerarquía de páginas (padre-hijo) para árboles de páginas grandes.
- Page-builder unificado: fusionar la librería de bloques de `Home` y `Pages` en un set único curado.
- Migración de storage Blob→Cloudinary (ASSET-01, milestone propio).

## Out of Scope
- Rediseño visual de las páginas públicas (eso fue v1.8; aquí paridad visual, no rebrand).
- Reescritura de contenido/copy.
- Nuevas features de sitio público más allá de la creación de páginas.
- Cambiar el modelo de datos de las colecciones de métricas SEO.

## Dependencias / notas
- **PAGES-03 (Home) es la de mayor riesgo:** el ruteo de `/` cambió/es delicado por v1.0/v1.7. Conviene migrar primero listados (blog/case studies) para validar el patrón y dejar Home al final con QA reforzado.
- **NAV** puede hacerse en paralelo/temprano (bajo riesgo: solo `admin.group`), da valor visible rápido.
- **AUTHORS-03** depende de conocer cómo se resuelven hoy los autores (author page + sitemap) antes de introducir la colección.

## Traceability (REQ → fase)

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAGES-01 | Phase 53 | Done |
| PAGES-02 | Phase 53 | Done |
| PAGES-03 | Phase 57 | Pending |
| PAGES-04 | Phase 54 | Done |
| PAGES-05 | Phase 55 | Done |
| PAGES-06 | Phase 58 | Pending |
| NAV-01 | Phase 52 | Done |
| NAV-02 | Phase 52 | Done |
| NAV-03 | Phase 52 | Done |
| NAV-04 | Phase 52 | Done |
| NAV-05 | Phase 52 | Done |
| AUTHORS-01 | Phase 56 | Done |
| AUTHORS-02 | Phase 56 | Done |
| AUTHORS-03 | Phase 56 | Done |
| CLEAN-01 | Phase 58 | Pending |
| CLEAN-02 | Phase 58 | Pending |
| QA-01 | Phase 59 | Pending |
| QA-02 | Phase 59 | Pending |
| QA-03 | Phase 59 | Pending |
| QA-04 | Phase 59 | Pending |
