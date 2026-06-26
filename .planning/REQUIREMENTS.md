# Requirements: JuanPortfolio — Milestone v1.4 (Keyword targeting & Yoast-style SEO scoring)

**Defined:** 2026-06-25
**Core Value:** Cada página tiene una keyword objetivo con sus métricas a la vista, y un semáforo estilo Yoast dice si el contenido/título/meta están optimizados para esa keyword — para decidir con datos qué falta y dónde.

**Entrega:** En el admin de Payload, cada Post y Page tiene una keyword objetivo (relación a `keyword-metrics`), muestra sus métricas (volumen, dificultad, intent, opportunityScore…) y un semáforo en el sidebar del editor que compara la keyword contra title, meta, H1, slug y contenido. Más una auditoría que lista qué páginas no tienen keyword y cuáles la tienen pero les falta optimización.

**Baseline (recon 2026-06-25):**

- `keyword-metrics` collection ya existe y es rica (keyword, targetURL, volume, difficulty, intent, paaQuestions, topDomain, hasAiOverview, opportunityScore, avgWordCount) y ya tiene relaciones `post` y `page`.
- Posts ya tienen `primaryKeyword` + `semanticKeywords` (relación a keyword-metrics). **Pages NO tienen keyword ni meta.**
- Existe `src/plugins/seo/utils/seoAnalyzer.ts` (Yoast-like: title length, keyword density, meta) → base del semáforo.
- Keyword research reciente en `content/keywords.md` (tabla Keyword|Target URL|métricas) y `content/keywords_map.json` (slug→keyword), poblado vía DinoRank.

## v1 Requirements

### KW — Modelo de keyword objetivo

- [x] **KW-01**: Pages tienen un campo `primaryKeyword` (relación a `keyword-metrics`), igual que Posts, para asignar una keyword objetivo a cada página estática
- [x] **KW-02**: Las páginas de listado generadas por código (categoría, autor) pueden asignarse una keyword objetivo (vía el doc de categoría/autor o un mapeo configurable) para entrar en el scoring
- [x] **KW-03**: La keyword objetivo de Posts y Pages es consistente: reusa `primaryKeyword`→`keyword-metrics` (no se duplica con un campo de texto suelto)

### METRICS — Métricas de la keyword en la página

- [x] **METRICS-01**: La vista de edición de cada Post/Page muestra las métricas de su keyword objetivo (volumen, dificultad, intent, opportunityScore y demás) leídas de `keyword-metrics`
- [x] **METRICS-02**: Si la keyword asignada no tiene métricas cargadas, la UI lo indica con un estado claro (sin romper el editor)

### SCORE — Semáforo estilo Yoast (sidebar del editor)

- [x] **SCORE-01**: El sidebar del editor muestra un semáforo (verde/ámbar/rojo) por check: keyword en el title, en la meta description, en el H1, en el slug/URL, densidad en el contenido, presencia en el primer párrafo y en subtítulos
- [x] **SCORE-02**: Cada check da feedback accionable (qué falta y cómo arreglarlo), reusando/extendiendo `seoAnalyzer.ts`
- [x] **SCORE-03**: Score global por página (0-100) con color, visible de un vistazo en el editor
- [x] **SCORE-04**: El semáforo se recalcula con el contenido actual del editor (no requiere re-publicar para ver el estado)

### AUDIT — Cobertura de keywords

- [x] **AUDIT-01**: Reporte/vista que lista todas las páginas (Posts + Pages + listados) SIN keyword objetivo asignada
- [x] **AUDIT-02**: Reporte/vista que lista las páginas CON keyword pero que fallan algún check del semáforo, con el detalle de qué les falta
- [x] **AUDIT-03**: La auditoría es repetible (script o vista) para volver a correrla tras cambios

### RESEARCH — Poblar keywords desde el research

- [x] **RESEARCH-01**: Revisar el keyword research más reciente (`content/keywords.md` / DinoRank) y asignar la keyword objetivo a cada página existente que aún no la tenga, según el mapeo keyword↔URL
- [x] **RESEARCH-02**: Las keywords asignadas tienen su doc de `keyword-metrics` con métricas (volumen/dificultad/intent) cargadas; las que falten se marcan para investigar

## Future Requirements

<!-- Diferido. -->

- Sugerencias automáticas de keyword por página (NLP / DinoRank en vivo)
- Reescritura asistida del contenido para subir el score
- Tracking histórico del score por página

## Out of Scope

<!-- Excluido. -->

- Rehacer el keyword research desde cero (se usa el existente de DinoRank)
- Cambiar el modelo de `keyword-metrics` más allá de relacionarlo con Pages
- Optimización on-page automática del contenido (el semáforo informa, no reescribe)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| KW-01 | Phase 21 | Complete |
| KW-02 | Phase 21 | Complete |
| KW-03 | Phase 21 | Complete |
| METRICS-01 | Phase 22 | Complete |
| METRICS-02 | Phase 22 | Complete |
| SCORE-01 | Phase 22 | Complete |
| SCORE-02 | Phase 22 | Complete |
| SCORE-03 | Phase 22 | Complete |
| SCORE-04 | Phase 22 | Complete |
| AUDIT-01 | Phase 23 | Complete |
| AUDIT-02 | Phase 23 | Complete |
| AUDIT-03 | Phase 23 | Complete |
| RESEARCH-01 | Phase 24 | Complete |
| RESEARCH-02 | Phase 24 | Complete |
