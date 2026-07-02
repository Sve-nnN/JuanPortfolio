# Requirements — Milestone v1.7 (Rendimiento avanzado / Core Web Vitals)

Derivado de: medición Unlighthouse mobile (Chrome real) post-v1.6 y análisis de causa raíz.
Detalle y evidencia: `.planning/research/audit-jul2026/03-performance.md`. Issues asociados: #95 (LCP), #103 (INP).

**Baseline medido (mobile, post Rocket Loader OFF):** Perf 0.37 · FCP 2.7s · LCP 7.4s · TBT 2180ms · TTI 10.4s · CLS 0.001.
**Causa raíz:** ~27 chunks JS (~325KB gzip) ejecutan de una y saturan el main thread; el hero es todo `'use client'` con framer-motion (`useScroll`/`useTransform`) → el H1/LCP depende de la hidratación.

**Objetivos de salida (mobile):** LCP < 2500ms · INP < 200ms · sin regresión de CLS (≤ 0.01) · sin regresión visual del hero.

Convención label GitHub: `seo:performance`, bloque `perf`, tanda `v1.7-cwv`.

## v1.7 Requirements

### Hero & render del LCP
- [ ] **PERF-04** (alto): El H1 de la home se pinta en el HTML de SSR sin depender de la hidratación del hero — el hero se sirve como server component y solo la animación parallax vive en un wrapper cliente chico (`'use client'`) que envuelve el contenido ya renderizado en servidor.
- [ ] **PERF-05** (alto): La animación de entrada/parallax del hero se preserva idéntica a la actual (misma curva, timing y layout); un QA visual antes/después lo confirma. Si framer-motion no aporta sobre CSS puro para el entrance, se reemplaza por CSS/transición nativa para no bundlear la librería en el above-the-fold.

### Recorte de JavaScript inicial
- [ ] **PERF-06** (alto): El JS que ejecuta en el arranque de la home baja de forma medible respecto del baseline (~27 chunks / ~325KB gzip) — bloques below-the-fold cargados con `next/dynamic` (sin SSR donde aplique) y framer-motion aislado a los componentes que realmente animan.
- [ ] **PERF-07** (medio): El TBT mobile de la home baja de ~2180ms a un rango que permita INP < 200ms; se verifica con Unlighthouse mobile y con el INP de campo (#103).

### Fuentes
- [ ] **PERF-08** (medio): Solo la fuente del H1 (Array Bold) se preloadea; Geist Sans/Mono usan `preload:false` si no son above-the-fold, sin introducir FOUT visible (QA visual confirma que no hay salto de texto perceptible).

### Cache en el edge
- [ ] **PERF-09** (medio): El HTML de la home y de los posts se sirve cacheado desde el edge de Cloudflare (`cf-cache-status: HIT` en visita repetida) respetando el ISR de Next, sin servir contenido stale más allá de la ventana de revalidación ni romper el bypass de draft/preview.

### Medición & validación de campo
- [ ] **PERF-10** (medio): El INP real emitido por el reporter `web-vitals`→GA4 (#103) es consultable por interacción/página, y se usa para identificar cuál interacción concreta excede 200ms antes de optimizar (no se optimiza a ciegas).
- [ ] **PERF-11** (info): Existe un procedimiento repetible de re-medición mobile (`npx unlighthouse-ci --site https://juan-tech.com --urls /`) corrido antes y después del milestone, con los números registrados para comparar contra el baseline.

## Restricciones (constantes en todas las fases)
- **QA visual obligatorio** antes de mergear el refactor del hero y el cambio de preloads de fuentes: no romper la animación de entrada ni el layout.
- No regresionar el LCP-visible-en-SSR ya logrado en v1.1 (el H1 pinta en el primer render).
- Mantener tsc baseline (0 nuevos en `src/`) y tests verdes.
- Medir siempre en mobile (Unlighthouse throttlea como campo; PSI subestima).

## Future Requirements (deferidos)
- Cachear/optimizar rutas de blog/case-studies más allá de la home si la home no alcanza el objetivo sola.
- Auditar imágenes/LCP de plantillas de contenido (posts) en un milestone propio.
- Diferidos de v1.6 (acciones manuales de Juan): INFRA www TLS (#12), Rocket Loader ya OFF (#102), contenido (#104-#107).
- Diferidos de v1.5: VERIFY-01 (gate runtime), ASSET-01 (Blob→Cloudinary).

## Out of Scope
- Rediseño visual del hero (solo mover la lógica de render, no el diseño).
- Cambiar el proxy Cloudflare→Vercel más allá de reglas de cache.
- Rehacer keyword research o tocar contenido.
- Rediseño de Header/Footer.

## Traceability (REQ → fase)

| Requirement | Fase | Estado |
|-------------|------|--------|
| PERF-10 | Phase 38 | Pending |
| PERF-04 | Phase 39 | Pending |
| PERF-05 | Phase 39 | Pending |
| PERF-06 | Phase 39 | Pending |
| PERF-07 | Phase 40 | Pending |
| PERF-08 | Phase 41 | Pending |
| PERF-09 | Phase 42 | Pending |
| PERF-11 | Phase 43 | Pending |

Cobertura: 8/8 requirements v1.7 mapeados. Sin huérfanos.
