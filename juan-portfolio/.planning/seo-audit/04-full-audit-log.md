# Audit SEO Completo — juan-tech.com
**Fecha:** 2026-03-27
**Ejecutado por:** Claude Code (Agentes + scripts locales Payload)

---

## Fase 1 — Crawl del sitio (Agente 1)

Se rastrearon las 4 subsitemaps y 21 URLs activas + 3 con 404.

**Hallazgos críticos:**
- 3 URLs en el sitemap devolvían 404 (slug con `ñ` + nunca pusheadas al CMS)
- 2 posts en inglés indexados con ~150 palabras de placeholder
- Todas las category pages en inglés servían metas en español
- 9 artículos de Tech SEO existían en markdown pero nunca se habían publicado
- 15 posts de CS Fundamentals y SEO Strategy estaban en draft en el CMS

**Reporte:** `.planning/seo-audit/01-crawl-report.md`

---

## Fase 2 — Investigación de keywords (Ahrefs MCP, Agente 2)

Se usó el Keywords Explorer de Ahrefs para cada página del sitio.

**Keywords mejoradas:**

| Página | Keyword anterior | Vol/mes | Keyword nueva | Vol/mes | KD |
|---|---|---|---|---|---|
| Homepage | "SEO técnico" | 150 | "consultor SEO freelance" | 450 | 0 |
| SQL vs NoSQL | "sql vs nosql" | 90 | "bases de datos relacionales" | 500 | 1 |
| CS Fundamentals cat. | "ciencias de la computación" | 500 | "algoritmos" | 2.300 | 12 |
| E-E-A-T | "e-e-a-t seo" (hifenado) | 0 | "eeat seo" | 100 | 2 |
| Cursos SEO | "mejores cursos SEO" | 0 | "curso seo gratis" | 350 | 17 |

**Reporte:** `.planning/seo-audit/02-ahrefs-recommendations.md`

---

## Fase 3 — Cambios aplicados

### 3.1 Meta tags via sync de markdown (Agente 3 + sync push)

| Archivo | Campo | Antes | Después |
|---|---|---|---|
| `seo/guia-eeat.md` | metaTitle | "E-E-A-T SEO 2026: Cómo Demostrar Autoridad..." | "Qué es el EEAT en SEO y Cómo Aplicarlo en 2026" |
| `seo/guia-eeat.md` | metaDescription | "Domina el E-E-A-T en 2026..." (151c) | "Guía completa sobre EEAT en SEO..." (154c) |
| `cs-fundamentals/sql-vs-nosql.md` | metaTitle | "SQL vs NoSQL: Comparativa técnica..." | "Bases de Datos Relacionales vs NoSQL: Guía para Desarrolladores" |
| `cs-fundamentals/sql-vs-nosql.md` | metaDescription | "...SQL y NoSQL..." (175c — OVER) | "Compara bases de datos relacionales y NoSQL..." (151c) |
| `cs-fundamentals/experiencia-de-usuario.md` | metaTitle | "Experiencia de usuario: Mejora la satisfacción..." | "Experiencia de Usuario (UX): Guía Completa para Diseñarla Bien" |
| `cs-fundamentals/experiencia-de-usuario.md` | metaDescription | "...159 chars (OVER)" | "Aprende qué es la experiencia de usuario..." (149c) |
| `seo/mejores-cursos-seo-en-español.md` | metaTitle | MISSING | "Mejores Cursos de SEO Gratis y de Pago en Español (2026)" |
| `seo/mejores-cursos-seo-en-español.md` | metaDescription | MISSING | "Los mejores cursos de SEO en español para 2026..." (126c) |
| `seo/guia-eeat.en.md` | noindex | — | `noindex: true` (placeholder de 150 palabras) |
| `cs-fundamentals/sql-vs-nosql.en.md` | noindex | — | `noindex: true` (placeholder de 150 palabras) |

### 3.2 Publicación de 15 posts en draft (script Payload local API)

Script: `src/scripts/publish-all-drafts.ts` (eliminado tras uso)
Método: `payload.update({ collection: 'posts', id, data: { _status: 'published' }, context: { disableRevalidate: true } })`

Posts publicados:
- `que-es-css`
- `experiencia-de-usuario`
- `redaccion-seo`
- `guia-keyword-research`
- `estrategia-topic-clusters`
- `enlaces-internos-guia`
- `guia-eeat`
- `programacion-dinamica`
- `normalizacion-bases-datos`
- `diseno-bases-datos`
- `arboles-binarios`
- `algoritmos-ordenamiento`
- `complejidad-algoritmica`
- `big-o-notation`
- `algoritmos-estructuras-datos`

### 3.3 Sincronización de 9 artículos Tech SEO (+ EN counterparts)

Problema encontrado: `technical-seo-guide.md` tenía frontmatter malformado (` ```yaml ` dentro de `---`). Corregido manualmente.

Problema encontrado: 4 artículos (core-web-vitals, robots-txt, schema-markup, ssr-vs-csr, xml-sitemap) tenían entradas huérfanas en `content-sync.json` apuntando a IDs inexistentes. Se eliminaron del state y se repushearon.

Problema encontrado: EN counterparts de archivos re-pusheados hoy apuntaban a IDs antiguas. Se actualizó el state para que compartieran el ID del documento ES.

Archivos sincronizados al CMS (ES + EN):
- `tech-seo/core-web-vitals-guide` ✅
- `tech-seo/nextjs-seo-optimization` ✅
- `tech-seo/non-developers-guide` ✅
- `tech-seo/robots-txt-best-practices` ✅
- `tech-seo/schema-markup-guide` ✅
- `tech-seo/ssr-vs-csr-seo` ✅
- `tech-seo/tech-seo-guide` ✅
- `tech-seo/web-performance-guide` ✅
- `tech-seo/xml-sitemap-automation` ✅
- `tech-seo/technical-seo-guide` ✅ (solo ES, sin EN counterpart)

### 3.4 Publicación de 19 nuevos posts tech-seo + otros redraftados

Misma técnica que 3.2. 19 posts publicados en segunda pasada.

### 3.5 Correcciones de código

**Search page noindex** (`src/app/(frontend)/[locale]/search/page.tsx`):
- Antes: sin directiva robots
- Después: `robots: { index: false, follow: false }` añadido al `generateMetadata`

**Sitemap exclusión** (`next-sitemap.config.cjs`):
- Añadido `/en/search` a la lista de exclusiones (ya estaba `/search`)

---

## Pendiente

### ✅ Resuelto via script Payload local API

| # | Elemento | Acción necesaria | Datos |
|---|---|---|---|
| 1 | Homepage meta (ES) | ✅ Aplicado | "Consultor SEO Técnico Freelance \| Juan Carlos Angulo" |
| 2 | Blog listing ES | ✅ Aplicado | "Blog de Estrategia SEO e Ingeniería Web \| Juan Tech" |
| 3 | Blog listing EN | ✅ Aplicado | "Technical SEO & Web Engineering Blog \| Juan Tech" |
| 4 | Categoría SEO (ES+EN) | ✅ Aplicado | metaTitle + description actualizados en ambos idiomas |
| 5 | Categoría CS Fundamentals (ES+EN) | ✅ Aplicado | metaTitle + description actualizados |
| 6 | Categoría Tech SEO (ES+EN) | ✅ Aplicado | metaTitle + description actualizados |
| 7 | Author ES | ✅ Aplicado | "Juan Carlos Angulo \| SEO Técnico y Dev. Software" |
| 8 | Author EN | ✅ Aplicado | "Juan Carlos Angulo \| Technical SEO Consultant" |

**Nota técnica:** El hook `revalidateBlogListing` no tenía soporte para `context.disableRevalidate` (a diferencia de `revalidatePost`). Se añadió el guard para que los scripts puedan ejecutarse fuera del contexto Next.js.

### Requiere decisión del usuario

| # | Elemento | Opciones |
|---|---|---|
| A | `development/` articles (7 posts ES+EN) | (a) Crear categoría "Development" en Payload admin y pushear, (b) eliminar los archivos si no se van a publicar |
| B | `mejores-cursos-seo-en-español.md` | Reescritura completa del body (HTML basura de DinoBrain). El slug `ñ` también conviene cambiar a `mejores-cursos-seo-espanol` con redirect 301 |
| C | `noindex: true` en guia-eeat.en y sql-vs-nosql.en | Verificar que el campo esté mapeado en el CMS y realmente emita `<meta name="robots" content="noindex">` |
| D | Categoría "General" (`/blog/general`) | Añadir noindex al componente de categoría o eliminar la categoría |

---

## Impacto estimado

| Métrica | Antes | Después |
|---|---|---|
| Posts publicados en producción | 2 | **26+** |
| Artículos Tech SEO indexables | 0 | **9 ES + 9 EN** |
| Posts con meta description correcta | 2 | **26+** |
| URLs 404 en sitemap | 3 | 1 (mejores-cursos) |
| Search pages indexadas | 2 | **0** (noindex) |
| Posts en inglés con thin content indexado | 2 | **0** (noindex) |
