# Auditoría del Admin de Payload — Milestone v1.5

**Proyecto:** JuanPortfolio · **Stack:** Next.js 15 + Payload CMS 3.61.1 + MongoDB · bilingüe es/en
**Fecha:** 2026-06-26 · **Método:** análisis estático (grep/Read) con cross-reference contra `payload.config.ts`, configs de colecciones/globals e `importMap.js`.

Leyenda de estado: ✅ USED · ⚠️ PARTIAL/SUSPECT · ❌ UNUSED · ❓ UNKNOWN (requiere check en runtime)

---

## 0. Resumen ejecutivo (conteos por estado)

| Categoría | ✅ | ⚠️ | ❌ | ❓ | Total |
|---|---|---|---|---|---|
| 1. Componentes admin (`src/components/admin/`) | 21 | 0 | 0 | 0 | 21 |
| 2. Campos `type: 'ui'` (colecciones/globals) | 16 | 0 | 0 | 0 | 16 |
| 3. Views + nav links + beforeDashboard/beforeLogin | 7 | 0 | 0 | 0 | 7 |
| 4. Colecciones + globals | 22 | 1 | 1 | 0 | 24 |
| 5. Scripts (`src/scripts/`) | 12 | ~10 | ~18 | varios | ~40 |
| 6. Integraciones externas | 4 | 3 | 0 | 1 | 8 |
| **Plugin SEO casero (`src/plugins/seo/`)** | 4 mód. | 0 | 9 archivos | 0 | — |

**Hallazgo clave:** los 21 componentes de `src/components/admin/` están TODOS cableados (directa o indirectamente). El código muerto real NO está en `components/admin/`, sino en:
- `src/plugins/seo/index.ts` y su árbol (endpoints, components, hooks, schemaGenerator) — plugin casero **nunca registrado**.
- `src/domains/**` — andamiaje DDD abandonado del que solo vive `ad-banners/domain/AdBanner.ts`.
- `src/collections/Users/index.ts.backup` y `src/collections/AdBanners/index.ts` (re-export huérfano).
- Una pila de scripts one-off de fix/setup ya aplicados.

---

## 1. Componentes admin (`src/components/admin/`)

Los 21 archivos. Cada uno verificado contra `importMap.js` + config donde se monta.

| Componente | Propósito | Registrado/Cableado en | Estado | Notas |
|---|---|---|---|---|
| `IndexingControl.tsx` | Control de indexación Google (sidebar) | Posts `index.ts:306`, Pages `index.ts:267`, Categories `Categories.ts:63`; importMap ✓ | ✅ | API `/api/seo/indexing` |
| `LiveUrlLink.tsx` | Link a la URL en vivo del doc | Categories `:40`, Users `index.ts:246`; importMap ✓ (default) | ✅ | También referenciado por archivos muertos en `domains/` |
| `CloudinaryUploadButton.tsx` | Subir imagen individual a Cloudinary | Media `:231` (afterInput); importMap ✓ | ✅ | API `/api/media/...` |
| `CloudinaryUploadAllButton.tsx` | Subida masiva a Cloudinary | Media `:28` (beforeListTable); importMap ✓ | ✅ | Endpoint colección `/upload-all-cloudinary` (`Media.ts:122`) |
| `GSCField.tsx` | Tab Search Console (datos GSC por doc) | Posts `:215`, Pages `:198`; importMap ✓ | ✅ | Renderiza `GSCPerformanceView` |
| `GSCPerformanceView.tsx` | Vista de performance GSC | Importado por `GSCField.tsx:4` | ✅ | Sub-componente; correctamente NO en importMap |
| `GSCChart.tsx` | Gráfico de barras (recharts) | Importado por `GSCDashboard.tsx:4` y `GSCPerformanceView.tsx:4` | ✅ | Sub-componente |
| `GSCCell.tsx` | Celda "clicks GSC" en listados | Posts `:293`, Pages `:244` (Cell); importMap ✓ | ✅ | |
| `GSCAnalysis.tsx` | Banda de análisis sobre listado GSC | GSCMetrics `:10` (beforeListTable) + importado por `GSCDashboard.tsx:5`; importMap ✓ | ✅ | API `/api/gsc-metrics` |
| `GSCDashboard.tsx` | Dashboard GSC completo | View `/gsc-dashboard` (`payload.config.ts:56`); importMap ✓ | ✅ | Consume gsc-metrics, page-metrics, broken-links |
| `GSCDashboardLink.tsx` | Nav link al dashboard GSC | afterNavLinks (`payload.config.ts:52`); importMap ✓ | ✅ | |
| `GSCSummary.tsx` | Resumen GSC en dashboard | beforeDashboard (`payload.config.ts:49`); importMap ✓ | ✅ | API `/api/gsc-metrics` |
| `KeywordScorePanel.tsx` | Score keyword estilo Yoast (sidebar) | Posts `:316`, Pages `:257`; importMap ✓ | ✅ | API `/api/seo/keyword-score`; usa `plugins/seo/types/keywordScore` |
| `KeywordCoverageView.tsx` | Vista cobertura de keywords | View `/keyword-coverage` (`payload.config.ts:60`); importMap ✓ | ✅ | API `/api/seo/keyword-coverage` |
| `KeywordCoverageLink.tsx` | Nav link a cobertura keywords | afterNavLinks (`payload.config.ts:53`); importMap ✓ | ✅ | |
| `InternalLinksTab.tsx` | Tab de enlazado interno | Posts `:230`; importMap ✓ | ✅ | API `/api/internal-links/apply` |
| `ForceScanButton.tsx` | Forzar scan CWV de una URL | PageMetrics `:31`; importMap ✓ | ✅ | Route `(payload)/api/page-metrics/scan` |
| `ScanAllButton.tsx` | Scan CWV masivo | PageMetrics `:9` (beforeListTable); importMap ✓ | ✅ | Route `(payload)/api/page-metrics/scan-all` |
| `CWVBadge.tsx` | Badge de score Core Web Vitals | PageMetrics `:60,73,86,99,112,125`; importMap ✓ | ✅ | |
| `DomainRatingCard.tsx` | Card de Domain Rating (Ahrefs) | beforeDashboard (`payload.config.ts:48`); importMap ✓ | ✅ | API `/api/domain-rating` |
| `DinoRankWriteButton.tsx` | Acción "redactar con DinoRank" (sidebar) | Posts `:326`; importMap ✓ | ✅ | API `/api/dinorank/redactar` |

**Conclusión:** ningún componente de `components/admin/` es candidato a borrado. Todos están vivos.

---

## 2. Campos `type: 'ui'`

| Campo | Colección/Global | Componente | Estado | Notas |
|---|---|---|---|---|
| `liveUrl` | Categories `:36` | LiveUrlLink | ✅ | |
| `indexingControl` | Categories `:59` | IndexingControl | ✅ | |
| `forceScan` | PageMetrics `:27` | ForceScanButton | ✅ | sidebar |
| `gscData` | Posts `:212` | GSCField | ✅ | tab Search Console |
| `internalLinksTab` | Posts `:227` | InternalLinksTab | ✅ | tab Internal Links |
| `gscClicks` | Posts `:290` | GSCCell (Cell) | ✅ | columna listado |
| `indexingControl` | Posts `:302` | IndexingControl | ✅ | |
| `keywordScorePanel` | Posts `:312` | KeywordScorePanel | ✅ | |
| `dinoRankAction` | Posts `:322` | DinoRankWriteButton | ✅ | |
| `gscData` | Pages `:195` | GSCField | ✅ | |
| `gscClicks` | Pages `:241` | GSCCell (Cell) | ✅ | |
| `keywordScorePanel` | Pages `:253` | KeywordScorePanel | ✅ | |
| `indexingControl` | Pages `:263` | IndexingControl | ✅ | |
| `liveUrl` | Users `index.ts:242` | LiveUrlLink | ✅ | |
| (dup) | `domains/content/categories/.../Category.ts:34` | LiveUrlLink | ❌ | archivo muerto (ver §4) |
| (dup) | `domains/user/domain/User.ts:108` | LiveUrlLink | ❌ | archivo muerto (ver §4) |

Todos los `ui` de colecciones/globals VIVOS tienen su componente existente y registrado en importMap. Los dos del árbol `domains/` apuntan a `LiveUrlLink` pero los archivos contenedores no se importan en ningún lado.

---

## 3. Views, nav links, dashboard y login

| Item | Ruta/Slot | Componente | Estado | Notas |
|---|---|---|---|---|
| View GSCDashboard | `/admin/gsc-dashboard` | GSCDashboard | ✅ | `payload.config.ts:56-59` |
| View KeywordCoverage | `/admin/keyword-coverage` | KeywordCoverageView | ✅ | `payload.config.ts:60-63` |
| afterNavLinks #1 | nav | GSCDashboardLink | ✅ | `:52` |
| afterNavLinks #2 | nav | KeywordCoverageLink | ✅ | `:53` |
| beforeDashboard #1 | dashboard | DomainRatingCard | ✅ | `:48` |
| beforeDashboard #2 | dashboard | GSCSummary | ✅ | `:49` |
| beforeLogin | login | `@/components/BeforeLogin` | ✅ | `:46`; importMap ✓ |

No hay views/nav muertos. (Pequeña inconsistencia UX: los dos nav links usan emoji inline y estilos hardcodeados — ver §Mejoras.)

---

## 4. Colecciones y globals

### Colecciones (14 registradas en `payload.config.ts:121-136`)

| Slug | Propósito | Personalizaciones admin | Estado | Notas |
|---|---|---|---|---|
| `pages` | Páginas del sitio | GSCField, GSCCell, KeywordScorePanel, IndexingControl; group SEO en plugin SEO | ✅ | |
| `posts` | Blog | GSCField, InternalLinksTab, GSCCell, IndexingControl, KeywordScorePanel, DinoRankWriteButton; hooks afterChange/beforeChange (revalidate, triggerCWVScan, syncKeywords, updateInternalLinksCount) | ✅ | núcleo del admin |
| `media` | Uploads | CloudinaryUploadButton/All + endpoint `/upload-all-cloudinary`; storage Vercel Blob | ✅ | ver overlap Cloudinary vs Blob (§6) |
| `categories` | Categorías blog | LiveUrlLink, IndexingControl, seoFields | ✅ | |
| `users` | Usuarios/autores | LiveUrlLink, seoFields | ✅ | existe `index.ts.backup` muerto |
| `works` | Portfolio | — | ✅ | |
| `case-studies` | Casos de estudio | hook revalidate | ✅ | |
| `clientes` | Logos de clientes | — | ✅ | |
| `ad-banners` | Banners sidebar | def. en `domains/content/ad-banners/domain/AdBanner.ts` | ✅ | importado directo en config `:21` (no vía `collections/AdBanners`) |
| `testimonials` | Testimonios | — | ✅ | |
| `keyword-metrics` | Métricas de keyword | useAsTitle, defaultColumns | ✅ | sin `group` (inconsistente); access abierto |
| `page-metrics` | Core Web Vitals por URL | ScanAllButton, ForceScanButton, CWVBadge | ✅ | sin `group`; access abierto |
| `gsc-metrics` | Datos GSC | GSCAnalysis; `group: 'SEO'` | ✅ | access abierto |
| `broken-links` | Enlaces rotos | `group: 'SEO'` | ✅ | poblado por script seo/check-links |

### Globals (8 registrados en `payload.config.ts:138`)

| Slug | Propósito | Estado |
|---|---|---|
| Header | Navegación (RowLabel custom) | ✅ |
| Footer | Pie (RowLabel custom x3) | ✅ |
| Home | Home page | ✅ |
| BlogListing | Listado blog (hook revalidate) | ✅ |
| CaseStudiesListing | Listado casos | ✅ |
| Styles | Estilos/colores | ✅ |
| SiteSettings | Config sitio | ✅ |
| LLM | llms.txt (hook revalidate) | ✅ |

### Leftovers de colección

| Item | Estado | Notas |
|---|---|---|
| `src/collections/Users/index.ts.backup` | ❌ | Backup commiteado; importa `LiveUrlLink` con `dynamic()` (patrón viejo). Nadie lo importa. Borrar. |
| `src/collections/AdBanners/index.ts` | ❌ | Solo re-exporta `AdBannersCollection` desde `domains/`. **Nadie lo importa** (config usa el path de `domains/` directo). Borrar. |
| `src/domains/**` (todo menos `ad-banners/domain/AdBanner.ts`) | ⚠️→❌ | Andamiaje DDD abandonado: `Category.ts`, `User.ts`, `Post.ts`, repositorios, use-cases, hooks duplicados. NINGUNO se importa fuera de `domains/`. Único vivo: `ad-banners/domain/AdBanner.ts` (config `:21`). Candidato fuerte a limpieza. |

---

## 5. Scripts (`src/scripts/`)

### Cableados en `package.json` (relevantes / activos)

| Script (`npm run`) | Archivo | Propósito | Estado |
|---|---|---|---|
| `sync` / `import:posts` | `syncContent.ts` | Sincroniza markdown ↔ Payload | ✅ |
| `sync:keywords` | `syncKeywords.ts` | Sincroniza keywords | ✅ |
| `populate:keywords` | `populate-keywords.ts` | Puebla keyword-metrics | ✅ |
| `audit:keywords` | `audit-keywords.ts` | Auditoría cobertura keywords (usa `plugins/seo/utils/keywordCoverageAudit`) | ✅ |
| `audit:urls` | `audit-urls.ts` | Auditoría de URLs | ✅ |
| `sync:gsc` | `seo/sync-gsc.ts` | Importa datos GSC → gsc-metrics | ✅ |
| `redirects` | `fetch-redirects.ts` | Genera redirects en build | ✅ (en `build`/`dev`) |
| `fix:links` | `fix-internal-links.ts` | Repara enlaces internos | ⚠️ revisar si one-off |
| `utils` | `utils/tui.ts` | TUI de utilidades | ✅ |
| `create-post` | `create-post.ts` | Crea post (pipeline contenido) | ✅ |
| `scrape:dinorank` | `scrape-dinorank.ts` | Scrapea DinoRank | ✅ (caveat login, ver §6) |
| `export:keywords` | `export-keywords-csv.ts` | Exporta keywords a CSV | ✅ |

### One-off / fix / setup (NO en package.json — candidatos a limpieza)

| Script | Indicio | Estado |
|---|---|---|
| `fix-test-post-author.ts` | Comentario: arregla "corrupt test artifact" vía Mongo directo | ❌ one-off aplicado |
| `inspect-test-post.ts` | Inspecciona post de prueba | ❌ debug one-off |
| `fix-registry.ts`, `cleanup-registry.ts` | Fix de registry | ⚠️ probablemente aplicados |
| `fix-categories.ts`, `assign-categories.ts` | Fix/asignación categorías | ⚠️ one-off |
| `fix-user-slugs.ts` | Fix slugs usuarios | ❌ one-off |
| `delete-loop-redirects.ts` | Borra redirects en loop | ❌ one-off |
| `setup-english-simple.ts`, `setup-english-dinorank-account.ts` | Setup cuentas/inglés | ⚠️ setup inicial |
| `validate-accounts.ts`, `verify-authors.ts`, `update-author-profile.ts` | Validaciones autores | ⚠️ |
| `debug-content.ts`, `debug-dino.ts` | Debug | ❌ |
| `identify-short-posts.ts`, `validate-post.ts`, `quick-research.ts`, `search-keyword.ts`, `test-email.ts`, `update-seo-metrics.ts`, `generate-gaps.ts`, `rewrite-post.ts`, `engine.ts` | Utilidades sueltas | ⚠️/❓ verificar caso a caso |

> Nota: el grueso de la lógica reutilizable vive bajo `scripts/services/`, `scripts/seo/`, `scripts/internal-linking/`, `scripts/sync/`, `scripts/engine/`, `scripts/dinorank/` y es soporte de los scripts cableados (no se audita línea a línea aquí; no afecta el admin directamente salvo vía las API routes).

### Hooks de colección que afectan UX del admin

| Hook | Colección | Wiring | Estado |
|---|---|---|---|
| `triggerCWVScan` | Posts | afterChange `Posts/index.ts:361` | ✅ dispara scan CWV al guardar |
| `syncKeywordsAfterPostSave` | Posts | afterChange `:361` | ✅ |
| `updateInternalLinksCount` | Posts | beforeChange `:362` | ✅ alimenta columna `internalLinksCount` |
| `populateAuthors`, `revalidatePost` | Posts | hooks | ✅ |

---

## 6. Integraciones externas en el admin

| Integración | Superficie admin | Estado | Notas |
|---|---|---|---|
| **GSC (Search Console)** | GSCSummary, GSCDashboard, GSCField, GSCCell, GSCAnalysis, colección gsc-metrics, `sync:gsc` | ✅ / ❓ | Cableado completo. ❓ depende de credenciales OAuth en runtime (caveat memoria GSC). |
| **Core Web Vitals** | PageMetrics, CWVBadge, ForceScan/ScanAll + routes `(payload)/api/page-metrics/scan(-all)`, hook triggerCWVScan | ✅ | Pipeline completo |
| **Internal Links** | InternalLinksTab + `/api/internal-links(/apply)` + `scripts/internal-linking/` | ✅ | |
| **Indexing (Google)** | IndexingControl + `/api/seo/indexing` | ✅ / ❓ | Funcional; ❓ requiere creds Indexing API en runtime |
| **Ahrefs (Domain Rating)** | DomainRatingCard + `/api/domain-rating` | ⚠️ / ❓ | Card en dashboard; verificar que la route tenga API key/MCP en prod |
| **DinoRank** | DinoRankWriteButton + `/api/dinorank/redactar` + `scrape:dinorank` | ⚠️ | Caveat conocido de login de cuenta (memoria). Verificar que la acción del botón funcione end-to-end |
| **Cloudinary** | CloudinaryUploadButton/All + endpoint Media | ⚠️ | **Overlap**: el storage real de Media es **Vercel Blob** (`payload.config.ts:198`). Cloudinary convive como subida paralela → posible confusión/duplicación. Aclarar estrategia única de assets. |
| **Search (plugin-search)** | LinkToDoc, ReindexButton (importMap) | ✅ | `searchPlugin` sobre posts |

---

## Plugin SEO casero (`src/plugins/seo/`) — anexo crítico

Carpeta separada de `components/admin/`. **`src/plugins/seo/index.ts` NUNCA se registra** (en `plugins/index.ts` se usa el oficial `@payloadcms/plugin-seo`). Resultado: todo lo que solo cuelga de ese `index.ts` está muerto.

| Archivo | ¿Usado fuera de `plugins/seo/`? | Estado |
|---|---|---|
| `index.ts` | No (no registrado en config) | ❌ |
| `endpoints/sitemap.ts` | Solo por `index.ts` muerto | ❌ |
| `endpoints/seo-analyzer.ts` | idem | ❌ |
| `endpoints/gsc-integration.ts` | idem | ❌ |
| `components/SEOHead.tsx` | Ninguna ref | ❌ |
| `components/SEOAnalysisField.tsx` | Ninguna ref | ❌ |
| `components/SEOScoreField.tsx` | Ninguna ref | ❌ |
| `components/CharacterCounter.tsx` | Ninguna ref | ❌ |
| `hooks/afterChange.ts`, `hooks/beforeChange.ts` | Ninguna ref | ❌ |
| `utils/schemaGenerator.ts` | Ninguna ref | ❌ |
| `utils/seoAnalyzer.ts` | ✅ `app/api/seo/keyword-score` | ✅ |
| `utils/keywordCoverageAudit.ts` (+test) | ✅ API + audit-keywords + KeywordCoverageView | ✅ |
| `fields/seoFields.ts` | ✅ Users, Categories (+ domains muertos) | ✅ |
| `types/keywordScore.ts` | ✅ KeywordScorePanel, KeywordCoverageView | ✅ |

---

## Cleanup candidates (qué borrar)

| # | Item | Por qué | Riesgo |
|---|---|---|---|
| 1 | `src/collections/Users/index.ts.backup` | Backup commiteado, sin imports | Nulo |
| 2 | `src/collections/AdBanners/index.ts` | Re-export huérfano; config usa path de `domains/` | Nulo (verificar ningún import) |
| 3 | `src/plugins/seo/index.ts` + `endpoints/*` + `components/*` + `hooks/*` + `utils/schemaGenerator.ts` | Plugin casero nunca registrado; código muerto | Bajo. **Conservar** `utils/seoAnalyzer`, `utils/keywordCoverageAudit`, `fields/seoFields`, `types/keywordScore` (sí se usan) |
| 4 | `src/domains/**` salvo `content/ad-banners/domain/AdBanner.ts` | Andamiaje DDD abandonado, sin imports externos | Medio: revisar 1x1 antes de borrar; mover `AdBanner.ts` a `collections/` para eliminar la carpeta entera |
| 5 | Scripts one-off de fix/debug: `fix-test-post-author`, `inspect-test-post`, `fix-user-slugs`, `delete-loop-redirects`, `debug-content`, `debug-dino`, (revisar) `fix-registry`, `cleanup-registry`, `fix-categories` | Fixes ya aplicados / debug | Bajo |
| 6 | Datos de prueba "test-sync-post" en Mongo | Artefacto corrupto que motivó scripts de fix | Bajo (verificar en runtime) |

---

## Improvement opportunities (accionable)

**A. Reubicar / colapsar el árbol `domains/`**
Mover `AdBanner.ts` a `src/collections/AdBanners.ts` y borrar `src/domains/**` completo. Elimina ~25 archivos muertos y la duplicación Category/User/Post que confunde el grep y el grafo.

**B. Consolidar el "plugin SEO"**
Hoy hay dos mundos: el oficial `@payloadcms/plugin-seo` (registrado) y el casero `src/plugins/seo/` (mayormente muerto). Mover los 4 módulos vivos (`seoAnalyzer`, `keywordCoverageAudit`, `seoFields`, `keywordScore`) a `src/utilities/seo/` o `src/lib/seo/` y borrar el resto de la carpeta. Quita la ilusión de que existe un plugin propio.

**C. Estandarizar el `group` del admin (SEO)**
`gsc-metrics` y `broken-links` tienen `group: 'SEO'`; `page-metrics` y `keyword-metrics` no. Añadir `group: 'SEO'` a las cuatro para agrupar el menú lateral de forma consistente.

**D. Endurecer `access` de las colecciones de métricas**
`keyword-metrics`, `page-metrics`, `gsc-metrics` tienen `read/create/update: () => true` con TODOs "restrict in production". Restringir create/update a `authenticated` o al cron secret antes del milestone.

**E. Decidir estrategia única de assets**
Media usa Vercel Blob como storage, pero conviven los botones Cloudinary. Definir una sola fuente (Blob o Cloudinary) y quitar la otra para evitar imágenes duplicadas/confusión editorial.

**F. Estandarizar labels bilingües es/en**
Mezcla de labels en español plano, objetos `{en, es}` y labels en inglés (tabs "Search Console", "Internal Links", "Meta"). Unificar a objetos `{en, es}` en todas las colecciones para coherencia con la localización del proyecto.

**G. Pulir los nav links custom**
`GSCDashboardLink` / `KeywordCoverageLink` usan emoji inline (📈) y estilos hardcodeados. Migrar a iconos del design system de Payload y tokens de tema para consistencia visual.

**H. Verificación en runtime pendiente (❓)**
Antes de tocar nada, confirmar end-to-end con sesión real: (1) `/api/domain-rating` (Ahrefs key), (2) `DinoRankWriteButton` → `/api/dinorank/redactar` (login DinoRank), (3) `IndexingControl` → Indexing API, (4) `sync:gsc`/GSC dashboard (OAuth). Son los puntos que el análisis estático no puede cerrar.
