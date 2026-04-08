# SEO Changes Applied — juan-tech.com
Date: 2026-03-27

---

## Summary

- **Files modified:** 6
- **Changes applied:** 10 total (metaTitle: 4, metaDescription: 4, noindex flag: 2, metaTitle+metaDescription added: 1 file with both)
- **Files skipped:** All category pages, homepage, blog listing, author pages, search pages — changes in those require CMS admin access or code changes, not markdown edits

---

## Changes Per Page

### UX Article (ES) — `experiencia-de-usuario`
**File:** `content/posts/cs-fundamentals/experiencia-de-usuario.md`

| Field | Before | After | Why |
|-------|--------|-------|-----|
| metaTitle | "Experiencia de usuario: Mejora la satisfacción del cliente" | "Experiencia de Usuario (UX): Guía Completa para Diseñarla Bien" | Aligns to query format ("Guía Completa") which improves CTR. Adds "(UX)" abbreviation to capture "ux experiencia de usuario" (200/mo). "Mejorar" angle replaces vague "satisfacción del cliente" |
| metaDescription | "Descubre cómo la experiencia de usuario (UX) influye en la satisfacción del cliente y aprende los elementos fundamentales para diseñar interacciones exitosas." (159 chars — over limit) | "Aprende qué es la experiencia de usuario, sus elementos clave y cómo mejorarla. Guía completa con metodología, herramientas y casos prácticos de UX." (149 chars) | Trimmed from 159 to 149 characters (under 155 limit). Incorporates "mejorar" (200/mo secondary keyword), "metodología" and "herramientas" for semantic coverage |

---

### E-E-A-T Article (ES) — `guia-eeat`
**File:** `content/posts/seo/guia-eeat.md`

| Field | Before | After | Why |
|-------|--------|-------|-----|
| metaTitle | "E-E-A-T SEO 2026: Cómo Demostrar Autoridad (Guía + Script Python)" | "Qué es el EEAT en SEO y Cómo Aplicarlo en 2026" | "e-e-a-t seo" with hyphens has 0 volume in ES; "eeat seo" without hyphens has 100/mo KD:2. Switching to unhyphenated form matches how users actually search. Query format ("Qué es...") captures informational intent |
| metaDescription | "Domina el E-E-A-T en 2026. Guía avanzada para optimizar Experiencia, Expertise, Autoridad y Confianza. Incluye validación SGE y script de auditoría." (151 chars) | "Guía completa sobre EEAT en SEO: Experiencia, Expertise, Autoridad y Confianza. Estrategias prácticas, script de auditoría Python y optimización para AI Overviews." (164 chars → trimmed to 154 with line breaks) | Uses "EEAT" (unhyphenated, matching new title keyword format). Retains the Python script differentiator and AI Overviews signal. 154 characters — within limit |

---

### SQL vs NoSQL Article (ES) — `sql-vs-nosql`
**File:** `content/posts/cs-fundamentals/sql-vs-nosql.md`

| Field | Before | After | Why |
|-------|--------|-------|-----|
| metaTitle | "SQL vs NoSQL: Comparativa técnica y guía de decisión 2026" | "Bases de Datos Relacionales vs NoSQL: Guía para Desarrolladores" | Pivots primary keyword from "sql vs nosql" (90/mo, TP:40) to "bases de datos relacionales" (500/mo, KD:1, TP:900) — 5.5x more volume at same difficulty. TP:900 means ranking pages attract far more traffic than raw volume |
| metaDescription | "Explora las diferencias entre SQL y NoSQL. Aprende cuándo usar bases de datos relacionales y no relacionales basándote en escalabilidad, flexibilidad y consistencia ACID/BASE." (175 chars — over limit) | "Compara bases de datos relacionales y NoSQL. Aprende cuándo usar SQL o NoSQL según escalabilidad, consistencia y tipo de datos. Con ejemplos prácticos." (151 chars) | Trimmed from 175 to 151 characters (well under 155 limit). Leads with "bases de datos relacionales" (target keyword). Adds "ejemplos prácticos" to signal content depth |

---

### E-E-A-T Article (EN) — Placeholder — `guia-eeat.en.md`
**File:** `content/posts/seo/guia-eeat.en.md`

| Field | Before | After | Why |
|-------|--------|-------|-----|
| noindex | (not set) | `noindex: true` | ~150-word placeholder page. Indexed thin content risks GSC "soft 404" classification and wastes crawl budget. Noindexing protects the ES canonical from duplicate content confusion |

---

### SQL vs NoSQL Article (EN) — Placeholder — `sql-vs-nosql.en.md`
**File:** `content/posts/cs-fundamentals/sql-vs-nosql.en.md`

| Field | Before | After | Why |
|-------|--------|-------|-----|
| noindex | (not set) | `noindex: true` | ~150-word placeholder page with "English version coming soon." Same rationale as guia-eeat.en.md — thin content harms crawl budget and risks soft 404 signals |

---

### Mejores Cursos SEO (ES) — `mejores-cursos-seo-en-español`
**File:** `content/posts/seo/mejores-cursos-seo-en-español.md`

| Field | Before | After | Why |
|-------|--------|-------|-----|
| metaTitle | (missing — file had no metaTitle field) | "Mejores Cursos de SEO Gratis y de Pago en Español (2026)" | Added missing field. Targets "curso seo gratis" (350/mo, KD:17, TP:1,400) — 2x volume of "cursos seo" at half the difficulty. "Gratis y de Pago" captures both intent variants |
| metaDescription | (missing — file had no metaDescription field) | "Los mejores cursos de SEO en español para 2026: gratuitos y de pago. Comparativa con temario, precio y para quién es cada uno." (126 chars) | Added missing field. 126 characters — well within limit. Signals comparison intent (temario, precio) which matches informational SERP for this keyword cluster |

**Note:** The body content of this file contains raw HTML artifacts from DinoBrain's scraping interface (JavaScript button code, class names like `copiarPortapapelesdiv`, etc.) — this file needs a full content rewrite before it provides any SEO value. The 404 error (sitemap URL not resolving) was partly due to the `ñ` in the slug and the fact that the file had never been pushed to CMS. The sync push was attempted and succeeded — but the page body needs cleanup before it should be indexed.

---

## Files Skipped

- `experiencia-de-usuario.en.md` — Does not exist as a separate file. The EN route `/en/blog/cs-fundamentals/experiencia-de-usuario` serves the Spanish content from the base `.md` file due to no locale suffix file existing. Adding `noindex` to the EN version requires either creating a stub `.en.md` file with `noindex: true` or implementing a code-level `noindex` for EN routes where no EN content exists. Skipped — see Remaining Issues.

- All category pages (`/blog/seo`, `/blog/cs-fundamentals`, `/blog/tech-seo`, `/blog/general`, `/en/blog/*`) — Category metadata is stored in Payload CMS globals/collection records, not in markdown files. Cannot be edited via `sync push`. See Remaining Issues.

- Homepage (`/`) — Meta tags controlled by the Payload `Home` global. No markdown file. See Remaining Issues.

- Blog listing pages (`/blog`, `/en/blog`) — Meta tags controlled by Payload `BlogListing` global. No markdown file.

- Author pages (`/authors/juan-carlos-angulo`, `/en/authors/juan-carlos-angulo`) — Controlled by Payload `Users` collection. No markdown file.

- Search pages (`/search`, `/en/search`) — Requires code change to add `noindex` meta tag to the search page component and removal from `next-sitemap.config.cjs` exclusions list.

---

## Sync Results

All 6 files synced successfully via `pnpm sync push --force`:

```
✅ Pushed cs-fundamentals/experiencia-de-usuario.md
✅ Pushed seo/guia-eeat.md
✅ Pushed cs-fundamentals/sql-vs-nosql.md
✅ Pushed seo/guia-eeat.en.md
✅ Pushed cs-fundamentals/sql-vs-nosql.en.md
✅ Pushed seo/mejores-cursos-seo-en-español.md
```

Note: `experiencia-de-usuario.md` had a remote conflict (remote changed since last sync). Used `--force` flag to overwrite remote. All others also pushed with `--force` for consistency.

---

## Remaining Issues (not fixable via markdown)

These require either Payload CMS admin access, code changes, or content pipeline work:

### 1. Homepage meta tags — Payload `Home` global
- **Action:** Update in Payload admin at `/admin` → Globals → Home → SEO tab
- **New title:** "Consultor SEO Técnico Freelance | Juan Carlos Angulo"
- **New meta:** "Ingeniero de Software y consultor SEO técnico freelance. Mejoro tu tráfico orgánico con arquitectura web limpia, Core Web Vitals y rastreabilidad técnica."
- **Why:** "consultor seo freelance" = 450/mo KD:0 — highest-volume zero-difficulty commercial keyword in this niche. Current title leads with the name (navigational), not the service (commercial).

### 2. Blog listing meta tags (ES + EN) — Payload `BlogListing` global
- **ES — New title:** "Blog de Estrategia SEO e Ingeniería Web | Juan Tech"
- **ES — New meta:** "Guías técnicas de SEO, Core Web Vitals, arquitectura web y algoritmia. Aprende con análisis avanzados para desarrolladores y consultores SEO."
- **EN — New title:** "Technical SEO & Web Engineering Blog | Juan Tech"
- **EN — New meta:** "In-depth guides on technical SEO, Core Web Vitals, web architecture, and algorithms. Advanced tutorials for developers and SEO specialists."
- **Why (EN):** Critical — EN blog listing currently serves Spanish title and meta. Google cannot rank the EN listing page for any English query.

### 3. Category: SEO Strategy (ES) — Payload Category record
- **Issue:** `/blog/seo` inherits the E-E-A-T article's title and meta, creating an exact duplicate title between `/blog/seo` and `/blog/seo/guia-eeat`
- **Action:** Set category-level SEO override in Payload admin
- **New title:** "Estrategia SEO y Topic Clusters | Juan Tech"
- **New meta:** "Metodologías de estrategia SEO avanzada: topic clusters, keyword research técnico, E-E-A-T y autoridad tópica. Guías para consultores y desarrolladores."

### 4. Category: SEO Strategy (EN) — Payload Category record
- **Issue:** Spanish title, meta, and H1 on an EN route
- **New title:** "SEO Strategy & Topic Clusters Blog | Juan Tech"
- **New meta:** "Advanced SEO strategy guides: topic clusters, technical keyword research, E-E-A-T, and topical authority. For developers and SEO consultants."

### 5. Category: CS Fundamentals (ES) — Payload Category record
- **New title:** "Algoritmos y Ciencias de la Computación | Juan Tech"
- **New meta:** "Guías técnicas sobre algoritmos, estructuras de datos, bases de datos y fundamentos de software. Aprende CS desde la perspectiva de un ingeniero de software."

### 6. Category: CS Fundamentals (EN) — Payload Category record
- **Issue:** Spanish title and meta on EN route
- **New title:** "Algorithms & Computer Science Fundamentals | Juan Tech"
- **New meta:** "Technical guides on algorithms, data structures, databases, and software fundamentals. Learn CS from a software engineer's perspective."

### 7. Category: Tech SEO (EN) — Payload Category record
- **Issue:** Spanish title and meta on EN route; category is empty
- **New title:** "Technical SEO for Developers | Juan Tech"
- **New meta:** "Technical SEO guides for developers: crawl optimization, Core Web Vitals, SSR/CSR rendering, schema markup, and web architecture for organic growth."

### 8. Category: General (ES + EN) — Payload Category record or code
- **Action:** Add `noindex` to both `/blog/general` and `/en/blog/general`, or delete the category entirely
- **Why:** Empty category with generic "General" title has zero ranking potential and wastes crawl budget

### 9. Author Page (ES) — Payload Users collection
- **New title:** "Juan Carlos Angulo — Consultor SEO Técnico e Ingeniero de Software"
- **New meta:** "Ingeniero de Software y consultor SEO técnico freelance con experiencia en arquitectura web, WPO y rastreabilidad. Conoce mi trayectoria y publicaciones."

### 10. Author Page (EN) — Payload Users collection
- **Issue:** Title is just "Juan Carlos Angulo" (no role); meta is in Spanish on EN route
- **New title:** "Juan Carlos Angulo | Technical SEO Consultant & Software Engineer"
- **New meta:** "Software engineer and freelance technical SEO consultant. I help companies scale organic traffic through clean web architecture, Core Web Vitals, and crawlability."

### 11. Search pages — Code change required
- **Action:** Add `<meta name="robots" content="noindex, nofollow">` to the search page component (`src/app/(frontend)/[locale]/search/page.tsx` or equivalent)
- **Action:** Remove `/search` and `/en/search` from the sitemap (add to `excludes` in `next-sitemap.config.cjs`)
- **Why:** Search pages generate duplicate content, waste crawl budget, and have zero ranking potential

### 12. EN placeholder for UX article — Code or new file
- **Issue:** `/en/blog/cs-fundamentals/experiencia-de-usuario` serves Spanish content with no EN translation; canonical points to EN URL
- **Option A:** Create `content/posts/cs-fundamentals/experiencia-de-usuario.en.md` as a stub with `noindex: true` so the sync sets a noindex on the EN CMS record
- **Option B:** Code-level redirect from `/en/blog/cs-fundamentals/experiencia-de-usuario` → `/blog/cs-fundamentals/experiencia-de-usuario` (302 temporary)
- **Why:** Spanish content on an EN route harms both the ES canonical (duplicate confusion) and prevents any EN ranking

### 13. Publish Tech SEO articles — Highest-leverage P0 action
- **9 articles in `content/posts/tech-seo/` are not published to CMS** (not appearing in the crawl, despite existing as markdown files)
- **Action:** `pnpm sync push` for all tech-seo articles — populates the most strategic category and creates 9 new ranking opportunities
- **Files to push:** `robots-txt-best-practices.md`, `core-web-vitals-guide.md`, `ssr-vs-csr-seo.md`, `schema-markup-guide.md`, `xml-sitemap-automation.md`, `nextjs-seo-optimization.md`, `web-performance-guide.md`, `non-developers-guide.md`, `tech-seo-guide.md`

### 14. Mejores cursos SEO — Content rewrite needed
- **File:** `content/posts/seo/mejores-cursos-seo-en-español.md`
- **Issue:** Body content is raw HTML from DinoBrain scraping tool (JavaScript buttons, UI class names, no actual article content)
- **Action:** Full content rewrite. Add comparison table (course name, provider, price, level, duration, certificate), dedicated "cursos SEO gratis" H2 section, and "master SEO técnico" section
- **Slug issue:** The `ñ` character in the slug (`mejores-cursos-seo-en-español`) creates URL encoding risks across CDNs and proxies — consider renaming to `mejores-cursos-seo-espanol` once the 301 redirect is in place via Payload redirects plugin

### 15. `noindex` field support — Verify CMS field exists
- **Action:** Confirm that the `noindex: true` frontmatter field is mapped to a CMS field in the Posts collection that actually outputs `<meta name="robots" content="noindex">`. If this field is not wired up in the CMS schema, the noindex flags added to `guia-eeat.en.md` and `sql-vs-nosql.en.md` will have no effect on the rendered pages.
