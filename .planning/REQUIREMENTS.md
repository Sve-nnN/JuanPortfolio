# Requirements: JuanPortfolio — Milestone v1.3 (Remediación SEO técnica · Ahrefs Site Audit)

**Defined:** 2026-06-24
**Core Value:** Las páginas públicas se sirven rápido y cacheables desde el edge; el SEO técnico no puede emitir basura (links/imágenes rotos, hreflang inconsistente) que degrade indexación y ranking.

**Entrega:** El sitio crawleado por Ahrefs/Googlebot deja de exponer wikilinks `[[...]]` crudos, 404/4XX por links internos malos, imágenes rotas, hreflang/lang inconsistente y errores de schema. Las 35 categorías del audit bajan a cero (o a un residual justificado y documentado).

**Baseline (audit 2026-06-24T15:26:07Z, project 7702617):** 35 categorías. Causa raíz #1 = internal-linking emite `[[slug|label]]` crudo. La API de Site Audit de Ahrefs vía MCP devuelve `Insufficient plan`, así que las URLs afectadas se derivan del snapshot de crawl pegado + grep del repo. Validación de schema.org se hará con el MCP `schema-org` de mcp-hub.

## v1 Requirements

### LINKS — Integridad de enlaces internos

- [ ] **LINKS-01**: El pipeline de internal-linking (`build-internal-links.ts` / `LinkInjector.ts`) nunca escribe `[[slug|label]]` crudo en el contenido publicado; toda referencia se resuelve a un link válido con su URL canónica (categoría y locale correctos) o se omite
- [ ] **LINKS-02**: El contenido ya publicado (markdown + Payload) se sanea: cero ocurrencias de `[[` / `]]` en el HTML renderizado de cualquier página
- [ ] **LINKS-03**: Cero links internos a posts inexistentes; cada anchor interno apunta a una URL que responde 200 (resolver casos como `typescript-best-practices`, `payloadcms-tutorial`, `nextjs-server-components`, `payloadcms-vs-strapi` por locale)
- [ ] **LINKS-04**: Los links internos usan la ruta con categoría correcta (ej. `/blog/cs-fundamentals/tablas-hash`, no `/blog/tablas-hash`) y el prefijo de locale correcto (`/en/...` solo si existe la traducción)
- [ ] **LINKS-05**: Links internos no apuntan a URLs que redirigen; se actualizan al destino final (incl. legacy `/posts/*` → `/blog/*` que hoy dan 308)
- [ ] **LINKS-06**: Contenido y rutas de test fuera de producción (ej. `/blog/test/see-also-test`) — no crawleable ni linkeado

### IMG — Imágenes

- [ ] **IMG-01**: Cero imágenes rotas en páginas públicas; toda `<img>`/`og:image` resuelve a un asset que responde 200 (Ahrefs marca 159+2)
- [ ] **IMG-02**: Las imágenes embebidas en contenido vía wikilink (`![[...]]` u `[[...]]`) se convierten a markdown de imagen con URL válida o se eliminan
- [ ] **IMG-03**: El retrato del autor vía `_next/image?url=/api/media/file/juan-angulo-portrait-1.avif` deja de devolver 400 (loader / `remotePatterns` o servir el asset correcto)

### HREF — Hreflang y atributo lang

- [ ] **HREF-01**: `<html lang>` coincide con el locale de cada página (es en raíz, en bajo `/en`) — resuelve el mismatch hreflang↔lang en ~90 páginas
- [ ] **HREF-02**: Las anotaciones hreflang siguen correctas y recíprocas (es ↔ en) y apuntan a URLs 200 tras los fixes de LINKS

### INDEX — Indexabilidad y sitemap

- [ ] **INDEX-01**: El sitemap no incluye URLs noindex (los 8 casos salen del sitemap o pierden el noindex según corresponda)
- [ ] **INDEX-02**: Las páginas indexables relevantes están en el sitemap (resolver los 22 "indexable page not in sitemap")
- [ ] **INDEX-03**: `robots.txt` accesible y servido con 200 + content-type correcto
- [ ] **INDEX-04**: La URL canónica reportada sin inlinks recibe al menos un enlace interno dofollow (o se ajusta su canonical)

### META — On-page

- [ ] **META-01**: Cada página indexable tiene meta description presente y de longitud adecuada (resolver missing ×5 y short ×8)
- [ ] **META-02**: Cada página tiene exactamente un `<h1>` no vacío (resolver missing ×3 y multiple H1 ×22)
- [ ] **META-03**: Titles sin quedar demasiado cortos y coincidiendo con el title de SERP donde aplique
- [ ] **META-04**: Open Graph completo en las 6 páginas marcadas (og:title/description/image/url/type)

### SCHEMA — Datos estructurados

- [ ] **SCHEMA-01**: Los 14 errores de validación schema.org se corrigen; el JSON-LD valida con el MCP `schema-org` de mcp-hub sin errores

### PERF — Peso de página

- [ ] **PERF-01**: Ninguna página excede el límite de crawl de 2 MB de Googlebot; se reduce el HTML de las 2 páginas marcadas como demasiado grandes
- [ ] **PERF-02**: Las 6 páginas "slow" se revisan; las que sigan lentas se documentan o se optimizan (continuidad del CWV de v1.1)

## Future Requirements

<!-- Diferido a milestones posteriores. -->

- Rediseñar la lógica de selección de anchors/keywords del internal-linking (este milestone solo arregla la emisión y sanea)
- Auditoría de calidad editorial / E-E-A-T del contenido
- Monitoreo continuo automatizado del Site Audit (alertas ante regresiones)

## Out of Scope

<!-- Excluido explícitamente con razón. -->

- Reescritura de contenido por calidad (este milestone es técnico)
- Cambios al modelo de contenido de Payload (no relacionado con los issues)
- Rediseño visual del Header/Footer
- Re-crawl manual en Ahrefs para validar (lo hace Juan; el MCP de Site Audit está en plan insuficiente)

## Traceability

<!-- Lo completa el roadmapper: REQ-ID → Phase. -->
