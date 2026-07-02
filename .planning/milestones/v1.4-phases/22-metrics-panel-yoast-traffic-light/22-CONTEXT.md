# Phase 22: Metrics panel + Yoast traffic light - Context

**Gathered:** 2026-06-25
**Status:** Ready for planning

<domain>
## Phase Boundary

El editor de cada Post y Page muestra, en el sidebar: (1) las métricas de la keyword asignada (volumen, dificultad, intent, opportunityScore) leídas de `keyword-metrics`, y (2) un semáforo estilo Yoast con un indicador verde/ámbar/rojo por cada uno de 7 checks (keyword en title, meta description, H1, slug, densidad en el cuerpo, primer párrafo, subtítulos), cada uno con feedback accionable, más un score global 0-100 con color. El semáforo se recalcula con el contenido actual del editor sin necesidad de publicar. No incluye la auditoría de cobertura (Fase 23) ni la población de keywords (Fase 24). Solo Posts y Pages (listados quedan fuera de esta fase).

</domain>

<decisions>
## Implementation Decisions

### Arquitectura del componente
- Un solo UI field (`type: 'ui'`) en `admin.position: 'sidebar'`, montado en **Posts y Pages**, que combina métricas + 7 checks + score en un componente client (`'use client'`).
- Lee el id de `primaryKeyword` desde el form state y obtiene el doc de `keyword-metrics` (client fetch `/api/keyword-metrics/:id` o vía el form value ya poblado).
- Lee el contenido en vivo del editor con hooks de `@payloadcms/ui` (`useAllFormFields` / `useFormFields`): title, meta.title, meta.description, slug, content (lexical).

### Lógica de checks + score
- **La lógica de los 7 checks vive en una función pura nueva en `src/plugins/seo/utils/seoAnalyzer.ts`** (extiende, no implementación paralela). Devuelve resultados estructurados por check (estado verde/ámbar/rojo + mensaje accionable). El componente solo renderiza.
- **Score global ponderado (Yoast-like):** title/meta/H1 pesan más que subtítulos/primer-párrafo/densidad. Mapeo a color: verde ≥ ~80, ámbar 50-79, rojo < 50 (el planner fija los pesos exactos).
- **Match de keyword con stemming/lematización es/en.** Por el peso de un stemmer NLP en el bundle del admin, preferir correr el análisis en el **server** (endpoint API que reusa `seoAnalyzer` async + un stemmer node, ej. PorterStemmer/PorterStemmerEs de `natural` o equivalente liviano) y llamarlo **debounced (~300ms)** desde el componente. Alternativa aceptable si el planner ve algo más simple: stemmer liviano client-side. El criterio duro: stemming es/en real, sin trabar el editor.
- **Fuentes de cada check:** title = meta.title con fallback al `title` del doc; meta description = meta.description; H1 = primer h1 del content lexical (fallback al título); slug = `slug`; cuerpo = `extractText` del content (reusar `extractText`/`extractHeadings` ya existentes en seoAnalyzer); primer párrafo = primer bloque de texto; subtítulos = headings h2-h4.
- **Estado ámbar = parcial** (presente pero subóptimo: densidad fuera del rango objetivo, keyword aparece tarde en el texto), **rojo = ausente**, **verde = óptimo**.

### Real-time
- Recalculo **on-change con debounce ~300ms** tras dejar de escribir. Cumple SCORE-04 (sin re-publicar).

### Estados vacíos + i18n
- **Sin keyword asignada:** panel con CTA "asigná una keyword objetivo"; sin checks.
- **Keyword asignada sin métricas cargadas (METRICS-02):** la sección de métricas muestra "sin datos" claramente; los checks del semáforo igual corren (solo necesitan el string de la keyword).
- **Feedback i18n es/en** según el locale del admin.

### Claude's Discretion
- Pesos exactos del score y umbrales de color/densidad.
- Decisión final client-stemmer vs server-endpoint (criterio: stemming es/en real + sin jank).
- Estética fina (la define la UI-SPEC de esta fase).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/plugins/seo/utils/seoAnalyzer.ts` — `analyzeSEO()` async + helpers `extractText`, `extractHeadings`, `countWords`, ya calcula keywordDensity y headings de contenido lexical. Base del semáforo.
- `src/components/admin/IndexingControl.tsx`, `GSCField.tsx`, `DinoRankWriteButton.tsx` — patrón de UI field client: `'use client'`, hooks `useDocumentInfo`/`useFormFields`, fetch a `/api/...`, `@payloadcms/ui` Button/toast. `DinoRankWriteButton` ya lee `primaryKeyword` del form (string | {keyword,title,value,slug}).
- `src/collections/Posts/index.ts` — content `richText` lexical (localized) en tab Content; `primaryKeyword` en tab Meta (Fase 21).
- `src/collections/Pages/index.ts` — content `blocks` (no richText); el texto vive en bloques (Content/Section). El extractor debe contemplar que Pages no tiene un único campo richText.
- `src/plugins/seo/fields/seoFields.ts` — grupo `meta` con title (max 60) / description (max 160) / keywords.

### Established Patterns
- Custom admin fields registrados como `type: 'ui'` con `admin.components.Field: '@/components/admin/X#X'`.
- Componentes client con hooks de `@payloadcms/ui`.
- Labels y mensajes bilingües `{ en, es }`.

### Integration Points
- Registrar el UI field en el sidebar de Posts y Pages.
- Si se usa endpoint server: crear un route handler (ej. `/api/seo/keyword-score`) o un custom Payload endpoint que reciba {keyword, title, meta, slug, content} y devuelva los checks.
- `payload-types.ts` no cambia (UI field no persiste datos).

### OJO (riesgo)
- **Pages usa `blocks`, no un `content` richText único** (a diferencia de Posts). El extractor de texto/headings para Pages debe recorrer los bloques. Posible divergencia title/H1/contenido entre Posts y Pages — el plan debe manejar ambas formas.

</code_context>

<specifics>
## Specific Ideas

- Reusar `extractText`/`extractHeadings` de seoAnalyzer en lugar de reparsear lexical.
- El semáforo es el de Yoast/Rank Math que Juan ya conoce (verde/ámbar/rojo + feedback accionable + score con color).

</specifics>

<deferred>
## Deferred Ideas

- Auditoría de cobertura repetible (Fase 23).
- Población de keywords desde DinoRank (Fase 24).
- Semáforo en listados (Categories/Users) — keyword existe desde Fase 21 pero el scoring de listados queda fuera de esta fase.
- Sugerencias automáticas de keyword / reescritura asistida (Future).

</deferred>
