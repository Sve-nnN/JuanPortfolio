# SEO Crawl Report — juan-tech.com
Date: 2026-03-27

---

## Summary

- **Total pages found in sitemap:** 24 (across pages, posts, categories, authors sub-sitemaps)
- **Total unique pages crawled:** 21 (3 returned 404)
- **Languages:** `es` (Spanish, default) / `en` (English)
- **Pages with missing meta description:** 4 (`/search`, `/en/search`, `/blog/general`, `/en/blog/general`)
- **Pages with thin content (<500 words):** 7 (search pages, category pages with no posts, English stub posts)
- **404 errors in sitemap:** 3 (`/blog/general/mejores-cursos-seo-en-español`, `/en/blog/general/mejores-cursos-seo-en-español`, and their percent-encoded variants — the slug uses a special character that breaks the URL)
- **English placeholder posts:** 2 (`/en/blog/seo/guia-eeat`, `/en/blog/cs-fundamentals/sql-vs-nosql` — "English version coming soon")

---

## Pages

### Homepage
- **URL:** https://juan-tech.com
- **Title tag:** "Juan Carlos Angulo | Ing. de Software & SEO Técnico"
- **Meta description:** "Consultoría en SEO Técnico e Ingeniería de Software. Escalamos tu tráfico orgánico mediante arquitectura web limpia, optimización WPO y rastreabilidad"
- **Canonical:** https://juan-tech.com
- **H1:** "Ingeniería de Software aplicada al SEO Técnico"
- **H2s:**
  - Estrategia y datos. Más allá del código
  - Mi enfoque en Consultoría Técnica
  - SEO Técnico
  - Rendimiento web
  - Arquitectura escalable
  - Ingeniería de UX
  - He trabajado con empresas increíbles
  - Últimos análisis y guías técnicas
  - Qué dicen mis clientes
  - ¿Dudas?
  - Hablemos de tu proyecto
  - Charlemos sobre tu próximo proyecto
  - Preguntas frecuentes
- **H3s:** None (feature cards use custom markup instead of semantic H3)
- **Word count:** ~3,500–4,200 words
- **Target keyword (inferred):** "SEO Técnico" / "consultoría SEO técnico"
- **Language:** es
- **Topic:** Technical SEO consulting + software engineering personal brand homepage with services, client logos, testimonials, blog highlights, FAQ, and contact form
- **SEO issues:**
  - Title tag uses the `&` character which may render as HTML entity in some contexts — consider replacing with `y` or `and`
  - H1 ("Ingeniería de Software aplicada al SEO Técnico") does not contain the primary keyword from the title ("SEO Técnico" is present but word order differs from the page title)
  - Too many H2s (13) — dilutes hierarchy; several service names used as H2 could be H3
  - No H3 under service-section H2s — missing semantic depth for feature descriptions
  - Meta description is 135 characters, within acceptable range but could be more specific (no unique value proposition beyond general consulting)

---

### Blog Listing (ES)
- **URL:** https://juan-tech.com/blog
- **Title tag:** "Blog de SEO Técnico y Desarrollo Web | Juan Carlos Angulo"
- **Meta description:** "Aprende sobre algoritmos, Core Web Vitals, arquitectura web y SEO técnico. Guías avanzadas y tutoriales para desarrolladores y especialistas en búsqueda."
- **Canonical:** https://juan-tech.com/blog
- **H1:** "Artículos sobre SEO Técnico e Ingeniería de Software"
- **H2s:** (Rendering issue — the fetched H2s belong to the article being surfaced in the listing, not the archive page itself; the listing page likely has no standalone H2s of its own)
- **H3s:** None
- **Word count:** ~200–400 words of listing-page-specific content (article cards)
- **Target keyword (inferred):** "blog SEO técnico"
- **Language:** es
- **Topic:** Blog archive/listing page for SEO and software engineering articles
- **SEO issues:**
  - The H2s surfaced during crawl are from the first article displayed, not from the listing page itself — the archive page likely lacks its own structural H2 headings
  - Thin original page content (relies entirely on article cards)
  - Title tag (57 chars) is good

---

### Blog Listing (EN)
- **URL:** https://juan-tech.com/en/blog
- **Title tag:** "Blog de SEO Técnico y Desarrollo Web | Juan Carlos Angulo"
- **Meta description:** "Aprende sobre algoritmos, Core Web Vitals, arquitectura web y SEO técnico. Guías avanzadas y tutoriales para desarrolladores y especialistas en búsqueda."
- **Canonical:** https://juan-tech.com/en/blog
- **H1:** "Desde mi Blog"
- **H2s:**
  - Mejores cursos SEO en español para impulsar tu carrera digital en 2026
  - Experiencia de usuario: Clave para el éxito del cliente
  - SQL vs NoSQL: How to Choose the Right Database...
  - E-E-A-T in SEO 2026: Guide to Dominating Authority...
- **H3s:** None
- **Word count:** ~3,500–4,500 words (article card content)
- **Target keyword (inferred):** "blog SEO técnico"
- **Language:** en
- **Topic:** English version of blog archive
- **SEO issues:**
  - **Critical: Title and meta description are identical to the Spanish `/blog` page** — no localized EN version of the meta tags
  - H1 "Desde mi Blog" is in Spanish on the English `/en/blog` route — mixed-language content; should be "From My Blog" or similar
  - The H2s are article titles used as headings on the listing — not proper archive-page structural headings
  - Meta description is in Spanish on an English-language route

---

### Search Page (ES)
- **URL:** https://juan-tech.com/search
- **Title tag:** "búsqueda"
- **Meta description:** MISSING
- **Canonical:** https://juan-tech.com/search
- **H1:** "búsqueda"
- **H2s:** None
- **H3s:** None
- **Word count:** ~200–300 words
- **Target keyword (inferred):** N/A (utility page)
- **Language:** es
- **Topic:** Site search results / blog discovery page
- **SEO issues:**
  - Title tag "búsqueda" is too minimal — not descriptive or keyword-rich
  - Meta description is MISSING
  - Should include `<meta name="robots" content="noindex">` since search pages provide no SEO value and can cause duplicate content
  - Page should be excluded from sitemap

---

### Search Page (EN)
- **URL:** https://juan-tech.com/en/search
- **Title tag:** "search"
- **Meta description:** MISSING
- **Canonical:** https://juan-tech.com/en/search
- **H1:** "search"
- **H2s:** None
- **H3s:** None
- **Word count:** ~800 words (navigation/footer heavy)
- **Target keyword (inferred):** N/A (utility page)
- **Language:** en
- **Topic:** Site search results page (English)
- **SEO issues:**
  - Title tag "search" is too minimal
  - Meta description is MISSING
  - Should be noindexed and excluded from sitemap

---

### Article: Experiencia de Usuario (ES)
- **URL:** https://juan-tech.com/blog/cs-fundamentals/experiencia-de-usuario
- **Title tag:** "Experiencia de usuario: Mejora la satisfacción del cliente"
- **Meta description:** "Descubre cómo la experiencia de usuario (UX) influye en la satisfacción del cliente y aprende los elementos fundamentales para diseñar interacciones exitosas."
- **Canonical:** https://juan-tech.com/blog/cs-fundamentals/experiencia-de-usuario
- **H1:** "Experiencia de usuario: Clave para el éxito del cliente"
- **H2s:**
  1. Definición y alcance de la experiencia de usuario
  2. Elementos fundamentales del diseño de experiencia de usuario
  3. Rol y funciones del diseñador de experiencia de usuario
  4. Proceso estructurado para crear experiencias de usuario efectivas
  5. Pruebas de usabilidad y evaluación continua de la experiencia
  6. Impacto de la experiencia de usuario en empresas y mercados
  7. Tecnologías emergentes que transforman la experiencia de usuario
  8. Retos actuales y consideraciones éticas en el diseño UX
  9. Estrategias para mejorar la experiencia de usuario en entornos digitales
  10. Integración de la experiencia de usuario en la transformación digital
- **H3s:** None identified
- **Word count:** ~3,500–4,200 words
- **Target keyword (inferred):** "experiencia de usuario"
- **Language:** es
- **Topic:** UX design fundamentals, methodology, impact on business, emerging tech in UX, and ethical considerations
- **SEO issues:**
  - Title tag ("Mejora la satisfacción del cliente") and H1 ("Clave para el éxito del cliente") are different — minor inconsistency; ideally they match closely
  - No H3 headings under any of the 10 H2 sections — for a 4000-word article, H3 sub-sections would improve readability and keyword coverage
  - Meta description (159 chars) is slightly long — aim for under 155 characters
  - Post is in the `cs-fundamentals` category which may dilute SEO Técnico topical authority of the site

---

### Article: Experiencia de Usuario (EN)
- **URL:** https://juan-tech.com/en/blog/cs-fundamentals/experiencia-de-usuario
- **Title tag:** "Experiencia de usuario: Mejora la satisfacción del cliente"
- **Meta description:** "Descubre cómo la experiencia de usuario (UX) influye en la satisfacción del cliente y aprende los elementos fundamentales para diseñar interacciones exitosas."
- **Canonical:** https://juan-tech.com/en/blog/cs-fundamentals/experiencia-de-usuario
- **H1:** "Experiencia de usuario: Clave para el éxito del cliente"
- **H2s:** (same 10 headings as Spanish version — content appears to be in Spanish)
- **H3s:** None
- **Word count:** ~4,200 words
- **Target keyword (inferred):** "user experience" / "experiencia de usuario"
- **Language:** Marked as `en` route but content is in Spanish
- **Topic:** Same UX design article as the Spanish version
- **SEO issues:**
  - **Critical: Title and meta description are in Spanish on an `/en/` route** — the page has no English translation
  - **Critical: H1 and all body content are in Spanish** — this is a language mismatch; the page claims to be English but serves Spanish content
  - Canonical points to `/en/` URL, which is correct structurally, but hreflang implementation is suspicious given the content is still Spanish
  - Should either redirect to the Spanish version or actually provide English content

---

### Article: E-E-A-T SEO 2026 (ES)
- **URL:** https://juan-tech.com/blog/seo/guia-eeat
- **Title tag:** "E-E-A-T SEO 2026: Cómo Demostrar Autoridad (Guía + Script Python)"
- **Meta description:** "Domina el E-E-A-T en 2026. Guía avanzada para optimizar Experiencia, Expertise, Autoridad y Confianza. Incluye validación SGE y script de auditoría."
- **Canonical:** https://juan-tech.com/blog/seo/guia-eeat
- **H1:** "E-E-A-T en SEO 2026: Guía para Dominar la Autoridad en la Era de la IA"
- **H2s:**
  1. Fundamentos del E-E-A-T: Por qué es tu Seguro de Vida SEO
  2. Estrategias para Demostrar Experiencia Real (La Primera 'E')
  3. Expertise y Autoridad: Construyendo la Entidad del Autor
  4. Trust: El Factor Crítico en Contenido YMYL
  5. Optimización para AI Overviews (SGE)
  6. Preguntas frecuentes sobre que es e-e-a-t seo
  7. Conclusión: El E-E-A-T como Ventaja Competitiva
  8. See Also
- **H3s:**
  1. Los 4 Pilares de la Calidad de Google
  2. Cómo ganar "Information Gain" en cada post
  3. Checklist de Autoría Verificable
  4. Señales Técnicas de Confianza que debes auditar
  5. Python: Script para Auditar Señales E-E-A-T
- **Word count:** ~2,100 words (main body, excluding code blocks)
- **Target keyword (inferred):** "E-E-A-T SEO" / "qué es E-E-A-T SEO"
- **Language:** es
- **Topic:** Comprehensive guide to E-E-A-T optimization in 2026, covering Google's four quality pillars, author entity building, YMYL trust signals, and AI Overview optimization with a Python audit script
- **SEO issues:**
  - Title tag uses "Cómo Demostrar Autoridad" while H1 uses "Guía para Dominar la Autoridad" — inconsistency between title and H1 (minor but best practice is close alignment)
  - The "See Also" H2 is a structural artifact from the topic cluster system — acceptable but may look odd as a standalone section heading
  - Word count (~2,100 words) is below typical pillar content threshold (3,000+ words); if this is intended as a pillar, needs expansion
  - FAQ H2 text "Preguntas frecuentes sobre que es e-e-a-t seo" contains un-accented "que" which looks like an SEO optimization leftover — grammatically should be "qué es"
  - Meta description is 151 characters — within acceptable range

---

### Article: E-E-A-T SEO 2026 (EN) — PLACEHOLDER
- **URL:** https://juan-tech.com/en/blog/seo/guia-eeat
- **Title tag:** "E-E-A-T SEO 2026: How to Demonstrate Authority (Guide + Python Script)"
- **Meta description:** "Optimize your E-E-A-T for 2026. Includes Python script to validate trust signals, strategies for YMYL content and optimization for AI Overviews (SGE)."
- **Canonical:** https://juan-tech.com/en/blog/seo/guia-eeat
- **H1:** "E-E-A-T in SEO 2026: Guide to Dominating Authority in the AI Era"
- **H2s:** "See Also"
- **H3s:** None
- **Word count:** ~150 words (placeholder only)
- **Target keyword (inferred):** "E-E-A-T SEO 2026"
- **Language:** en
- **Topic:** Placeholder page for the English version of the E-E-A-T guide — "English version coming soon"
- **SEO issues:**
  - **Critical: Thin content — placeholder page with ~150 words.** Google may penalize or ignore this page
  - Despite having good title and meta description (translated properly to English), the page body is essentially empty
  - Should be noindexed (`<meta name="robots" content="noindex">`) until real English content is available
  - Currently indexed via the sitemap, which could generate a "soft 404" signal in GSC
  - The "See Also" H2 with no surrounding content is a structural orphan

---

### Article: SQL vs NoSQL (ES)
- **URL:** https://juan-tech.com/blog/cs-fundamentals/sql-vs-nosql
- **Title tag:** "SQL vs NoSQL: Comparativa y Guía de Decisión para Desarrolladores"
- **Meta description:** "Explora las diferencias entre SQL y NoSQL. Aprende cuándo usar bases de datos relacionales y no relacionales basándote en escalabilidad, flexibilidad y consistencia."
- **Canonical:** https://juan-tech.com/blog/cs-fundamentals/sql-vs-nosql
- **H1:** "SQL vs NoSQL: Cómo Elegir la Base de Datos Correcta para tu Aplicación"
- **H2s:**
  1. Diferencias fundamentales entre bases relacionales y no relacionales
  2. Escalabilidad y rendimiento en bases de datos
  3. Modelos de datos y tipos de bases de datos no relacionales
  4. Seguridad y coherencia en el almacenamiento de datos
  5. Casos prácticos de elección: cuándo usar cada tipo de base
  6. Gestión y administración de sistemas de bases de datos
  7. Impacto en aplicaciones y servicios empresariales
- **H3s:** ~24 subsections (data structures, schema flexibility, ACID/BASE, scaling, database types, integrity, practical applications, enterprise)
- **Word count:** ~5,500+ words
- **Target keyword (inferred):** "SQL vs NoSQL"
- **Language:** es
- **Topic:** Comprehensive comparison of SQL and NoSQL databases — architecture, scalability, data models, security, use cases, and enterprise applications
- **SEO issues:**
  - Title tag (63 chars) is slightly long but acceptable
  - Meta description (162 chars) **exceeds 155-character guideline** — likely to be truncated in SERPs
  - Title tag uses "Comparativa y Guía de Decisión" while H1 uses "Cómo Elegir" — topic alignment is good but phrasing diverges
  - Category `cs-fundamentals` is appropriate for this article

---

### Article: SQL vs NoSQL (EN) — PLACEHOLDER
- **URL:** https://juan-tech.com/en/blog/cs-fundamentals/sql-vs-nosql
- **Title tag:** "SQL vs NoSQL: Comparison and Decision Guide for Developers"
- **Meta description:** "Explore the differences between SQL and NoSQL. Learn when to use relational and non-relational databases based on scalability, flexibility and consistency."
- **Canonical:** https://juan-tech.com/en/blog/cs-fundamentals/sql-vs-nosql
- **H1:** "SQL vs NoSQL: How to Choose the Right Database for Your Application"
- **H2s:** "See Also"
- **H3s:** None
- **Word count:** ~150 words (placeholder only)
- **Target keyword (inferred):** "SQL vs NoSQL"
- **Language:** en
- **Topic:** Placeholder for English version of SQL vs NoSQL database comparison article
- **SEO issues:**
  - **Critical: Thin content — placeholder page with ~150 words**
  - Should be noindexed until real English content is published
  - Both title and meta description are properly translated to English (good)
  - "See Also" section links to related CS article — minimal structural value at this state
  - Included in sitemap despite being a stub — potential "soft 404" / thin content signal to Google

---

### Article: Mejores Cursos SEO en Español — 404 ERROR
- **URL (sitemap):** https://juan-tech.com/blog/general/mejores-cursos-seo-en-español
- **URL (sitemap):** https://juan-tech.com/en/blog/general/mejores-cursos-seo-en-español
- **Status:** 404 Not Found
- **Title tag:** N/A
- **Meta description:** N/A
- **H1:** N/A
- **Word count:** N/A
- **Target keyword (inferred):** "mejores cursos SEO en español"
- **Language:** es / en
- **Topic:** Article about the best SEO courses in Spanish (inferred from slug)
- **SEO issues:**
  - **Critical: Both ES and EN versions return 404 but are listed in the sitemap** — Googlebot will crawl these URLs and receive 404 errors, which wastes crawl budget and may generate GSC errors
  - The slug contains a special character (`ñ`) — the actual URL in the sitemap may be percent-encoded as `%C3%B1` but the server is not resolving it correctly
  - The local Markdown file exists at `content/posts/seo/mejores-cursos-seo-en-español.md` (visible in git status) but has not been pushed to the CMS
  - **Action required:** Either push the post to CMS via `pnpm sync push` or remove the URL from the sitemap until the content is live

---

### Category: General (ES)
- **URL:** https://juan-tech.com/blog/general
- **Title tag:** "General"
- **Meta description:** MISSING
- **Canonical:** https://juan-tech.com/blog/general
- **H1:** "General"
- **H2s:** "Explora otras categorías"
- **H3s:** None
- **Word count:** ~150–200 words
- **Target keyword (inferred):** N/A (empty category)
- **Language:** es
- **Topic:** Blog category archive — currently empty, no published posts
- **SEO issues:**
  - **Critical: Title tag "General" is completely non-descriptive** — provides no SEO value
  - Meta description is MISSING
  - Page displays "No se encontraron posts" — should either be noindexed or have a meaningful description and actual content
  - Thin content page with no articles

---

### Category: General (EN)
- **URL:** https://juan-tech.com/en/blog/general
- **Title tag:** "General"
- **Meta description:** MISSING
- **Canonical:** https://juan-tech.com/en/blog/general
- **H1:** "General"
- **H2s:** "Explore Other Categories"
- **H3s:** None
- **Word count:** ~350 words (navigation heavy)
- **Target keyword (inferred):** N/A (empty category)
- **Language:** en
- **Topic:** English version of the General category archive — empty
- **SEO issues:**
  - Same issues as ES version
  - Title tag "General" provides no SEO value
  - Meta description is MISSING
  - Should be noindexed if no content is planned

---

### Category: SEO Strategy (ES)
- **URL:** https://juan-tech.com/blog/seo
- **Title tag:** "E-E-A-T SEO 2026: Cómo Demostrar Autoridad (Guía + Script Python)"
- **Meta description:** "Domina el E-E-A-T en 2026. Guía avanzada para optimizar Experiencia, Expertise, Autoridad y Confianza. Incluye validación SGE y script de auditoría."
- **Canonical:** https://juan-tech.com/blog/seo
- **H1:** "Estrategia SEO"
- **H2s:** (Article headings from the featured post surfaced on the category page; no category-level H2s)
- **H3s:** Article section headings from featured post
- **Word count:** ~3,500+ words (mostly from the one featured article)
- **Target keyword (inferred):** "estrategia SEO"
- **Language:** es
- **Topic:** SEO Strategy category archive — currently contains one published post (guia-eeat)
- **SEO issues:**
  - **Critical: Title tag and meta description belong to the E-E-A-T article, not the category page** — the category page is inheriting/displaying the article's meta tags instead of having its own. This creates a duplicate title tag between `/blog/seo` and `/blog/seo/guia-eeat`
  - Canonical is correctly pointing to `/blog/seo` but the title/description mismatch is an indexing problem
  - Only 1 post in this category — thin collection

---

### Category: SEO Strategy (EN)
- **URL:** https://juan-tech.com/en/blog/seo
- **Title tag:** "Estrategia SEO, Topic Clusters y E-E-A-T | Juan Tech"
- **Meta description:** "Metodologías avanzadas de SEO estratégico. Aprende a estructurar topic clusters, ejecutar keyword research técnico y construir autoridad tópica."
- **Canonical:** https://juan-tech.com/en/blog/seo
- **H1:** "Estrategia SEO"
- **H2s:**
  - E-E-A-T in SEO 2026: Guide to Dominating Authority in the AI Era
  - Explore Other Categories
- **H3s:** Navegación, Últimos Posts
- **Word count:** ~800–1,200 words
- **Target keyword (inferred):** "estrategia SEO"
- **Language:** en (but H1 "Estrategia SEO" and meta description are in Spanish)
- **Topic:** English SEO strategy category archive
- **SEO issues:**
  - **H1 "Estrategia SEO" is in Spanish** on an English-language route
  - **Meta description is in Spanish** on an English route
  - English category page has its own properly titled meta (unlike the ES version's inherited article meta) — but still in Spanish language
  - H3s labeled "Navegación" and "Últimos Posts" are footer/navigation elements leaking into the heading hierarchy

---

### Category: CS Fundamentals (ES)
- **URL:** https://juan-tech.com/blog/cs-fundamentals
- **Title tag:** "Ciencias de la Computación y Algoritmia | Juan Tech"
- **Meta description:** "Fundamentos de ingeniería de software. Guías técnicas sobre estructuras de datos, notación Big O..."
- **Canonical:** https://juan-tech.com/blog/cs-fundamentals
- **H1:** "Ciencias de la Computación"
- **H2s:** "Explora otras categorías" (category page nav H2; article H2s are surfaced inline)
- **H3s:** Article titles (Experiencia de usuario, SQL vs NoSQL)
- **Word count:** ~8,500+ words (heavy due to full article previews)
- **Target keyword (inferred):** "ciencias de la computación" / "fundamentos de software"
- **Language:** es
- **Topic:** CS Fundamentals category archive — 2 published posts
- **SEO issues:**
  - Meta description is truncated in the crawl extract (ends with "...") — may be incomplete
  - Category page word count is inflated by full article content surfaced inline — this can cause duplicate content issues since the same paragraphs appear on both the article page and the category listing
  - Title has a missing space after "..." in the meta description from the crawl — verify actual character limit

---

### Category: CS Fundamentals (EN)
- **URL:** https://juan-tech.com/en/blog/cs-fundamentals
- **Title tag:** "Ciencias de la Computación y Algoritmia | Juan Tech"
- **Meta description:** "Fundamentos de ingeniería de software. Guías técnicas sobre estructuras de datos, notación Big O y eficiencia algorítmica para desarrolladores."
- **Canonical:** https://juan-tech.com/en/blog/cs-fundamentals
- **H1:** "Fundamentos de Ciencias de la Computación"
- **H2s:** Article section headings from featured posts (same 10 UX H2s surfaced inline)
- **H3s:** Article preview cards
- **Word count:** ~6,500 words
- **Target keyword (inferred):** "ciencias de la computación"
- **Language:** en (but title tag and meta description are in Spanish)
- **Topic:** English CS Fundamentals category archive
- **SEO issues:**
  - **Critical: Title tag in Spanish** on an English route
  - **Critical: Meta description in Spanish** on an English route
  - Article H2 content is rendered inline on the category page — duplicate content risk
  - H1 "Fundamentos de Ciencias de la Computación" is in Spanish despite being the `/en/` path

---

### Category: Tech SEO (ES)
- **URL:** https://juan-tech.com/blog/tech-seo
- **Title tag:** "SEO Técnico. Arquitectura Web e Indexación | Juan Tech"
- **Meta description:** "Estrategias de Tech SEO para desarrolladores. Optimización de rastreo, renderizado (SSR/CSR) y Core Web Vitals para escalar tráfico orgánico."
- **Canonical:** https://juan-tech.com/blog/tech-seo
- **H1:** "SEO Técnico"
- **H2s:** "Guías sobre rastreo, indexación, renderizado y optimización de arquitectura web...", "Explora otras categorías"
- **H3s:** None
- **Word count:** ~400–500 words
- **Target keyword (inferred):** "SEO técnico" / "tech SEO"
- **Language:** es
- **Topic:** Technical SEO category archive — currently empty, no published posts
- **SEO issues:**
  - Page displays "No se encontraron posts" — entire category exists with no content
  - Despite a good title and meta description, the category has no articles — thin/empty page should be noindexed or populated
  - H2 text "Guías sobre rastreo, indexación..." reads like a tagline/description but is marked as H2 — more appropriate as a paragraph (`<p>`)

---

### Category: Tech SEO (EN)
- **URL:** https://juan-tech.com/en/blog/tech-seo
- **Title tag:** "SEO Técnico. Arquitectura Web e Indexación | Juan Tech"
- **Meta description:** "Estrategias de Tech SEO para desarrolladores. Optimización de rastreo, renderizado (SSR/CSR) y Core Web Vitals para escalar tráfico orgánico."
- **Canonical:** https://juan-tech.com/en/blog/tech-seo
- **H1:** "Tech SEO"
- **H2s:** "Explore Other Categories"
- **H3s:** None
- **Word count:** ~450 words
- **Target keyword (inferred):** "tech SEO"
- **Language:** en (but title and meta description are in Spanish)
- **Topic:** English Tech SEO category archive — empty
- **SEO issues:**
  - **Title tag and meta description are in Spanish** on an English route
  - Empty category — should be noindexed
  - No content whatsoever

---

### Author: Juan Carlos Angulo (ES)
- **URL:** https://juan-tech.com/authors/juan-carlos-angulo
- **Title tag:** "Juan Carlos Angulo | Ing. de Software y SEO Técnico"
- **Meta description:** "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico. Conoce mi trayectoria ayudando a escalar tráfico mediante arquitectura web y WPO."
- **Canonical:** https://juan-tech.com/authors/juan-carlos-angulo
- **H1:** "Juan Carlos Angulo"
- **H2s:**
  - Experiencia Profesional
  - Educación y Certificaciones
  - Artículos Publicados (3)
- **H3s:**
  - Especialista en Tech SEO — AprendoSEO
  - Desarrollador Web — Cripto Avances & Nakama Digital
  - Ingeniero de software
  - Técnico en informática
- **Word count:** ~3,500 words (excluding article previews)
- **Target keyword (inferred):** "Juan Carlos Angulo" / "Ingeniero de Software SEO Técnico"
- **Language:** es
- **Topic:** Author/portfolio biography page — professional experience, education/certifications, and links to published articles; supports E-E-A-T trust signals
- **SEO issues:**
  - H1 is just the name "Juan Carlos Angulo" — acceptable for an author page but could include role context (e.g. "Juan Carlos Angulo | Consultor SEO Técnico")
  - "Artículos Publicados (3)" shows only 3 articles — thin portfolio for an author page; will improve naturally as more posts are published
  - Meta description (152 chars) is within acceptable range

---

### Author: Juan Carlos Angulo (EN)
- **URL:** https://juan-tech.com/en/authors/juan-carlos-angulo
- **Title tag:** "Juan Carlos Angulo"
- **Meta description:** "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico. Conoce mi trayectoria ayudando a escalar tráfico mediante arquitectura web y WPO."
- **Canonical:** https://juan-tech.com/en/authors/juan-carlos-angulo
- **H1:** "Juan Carlos Angulo"
- **H2s:**
  - Professional Experience
  - Education and Certifications
  - Published Articles (3)
- **H3s:** None identified
- **Word count:** ~8,500 words (article preview content included)
- **Target keyword (inferred):** "Juan Carlos Angulo" / software engineer / technical SEO consultant
- **Language:** en
- **Topic:** English version of author biography page
- **SEO issues:**
  - **Critical: Title tag is just "Juan Carlos Angulo"** — missing the role descriptor that exists in the Spanish version ("Ing. de Software y SEO Técnico")
  - **Critical: Meta description is in Spanish** on an English route
  - H2s are properly in English ("Professional Experience", etc.) — good localization of structure
  - Word count inflation due to article preview content rendering inline — duplicate content risk

---

## Aggregate Issues

### Critical Issues (fix immediately)

1. **3 sitemap URLs return 404** — `mejores-cursos-seo-en-español` (ES and EN) returns 404. The Markdown file exists locally but is not synced to CMS. Either run `pnpm sync push` or remove from sitemap until live.

2. **2 English placeholder posts are publicly indexed** — `/en/blog/seo/guia-eeat` and `/en/blog/cs-fundamentals/sql-vs-nosql` contain ~150 words of placeholder content ("English version coming soon") but are in the sitemap and crawlable. Add `noindex` until full English content is ready.

3. **Meta descriptions in Spanish on all English (`/en/`) category pages** — `/en/blog/cs-fundamentals`, `/en/blog/tech-seo`, `/en/blog/seo` all serve Spanish meta descriptions. This signals to Google that hreflang is inconsistent and can suppress EN rankings.

4. **Title tags in Spanish on English category pages** — `/en/blog/cs-fundamentals` and `/en/blog/tech-seo` have Spanish title tags.

5. **`/blog/seo` category page inherits the E-E-A-T article's title and meta description** — creates exact duplicate title/description between the category URL and the article URL. The category needs its own distinct meta tags.

6. **`/en/blog` H1 is in Spanish** ("Desde mi Blog") — the English listing page should have an English H1.

7. **`/en/authors/juan-carlos-angulo` title is just "Juan Carlos Angulo"** — missing the professional descriptor; and meta description is in Spanish.

### High Priority Issues

8. **2 empty category pages indexed** — `/blog/general` and `/blog/tech-seo` (and their EN counterparts) have no published posts. They should either be noindexed or populated with content. Four total empty-category URLs are in the sitemap.

9. **Search pages in sitemap and missing meta descriptions** — `/search` and `/en/search` should be noindexed (utility pages that generate no organic value) and removed from the sitemap.

10. **Missing meta descriptions on 4 pages** — `/search`, `/en/search`, `/blog/general`, `/en/blog/general` all lack meta descriptions.

11. **`/en/blog/cs-fundamentals/experiencia-de-usuario` serves Spanish content on an EN route** — the article has no English translation but the EN URL is live, indexed, and serves Spanish content with a Spanish H1 and Spanish title tag.

### Medium Priority Issues

12. **H1/Title mismatches on article pages** — `/blog/cs-fundamentals/experiencia-de-usuario` (title: "Mejora la satisfacción del cliente" vs H1: "Clave para el éxito del cliente") and `/blog/seo/guia-eeat` (title: "Cómo Demostrar Autoridad" vs H1: "Guía para Dominar la Autoridad"). Best practice is close alignment.

13. **Over-inflated category page word counts from inline article content** — category pages (especially `/blog/cs-fundamentals`) render large portions of article body text, creating duplicate content risk with the canonical article pages. Use excerpt-only previews.

14. **Meta description too long** — `/blog/cs-fundamentals/sql-vs-nosql` meta description is ~162 characters, exceeding the 155-character guideline.

15. **FAQ heading has typo** — `/blog/seo/guia-eeat` contains H2 "Preguntas frecuentes sobre que es e-e-a-t seo" — missing accent on "qué"; this looks like an unformatted keyword injection.

16. **Homepage has too many H2s (13)** — dilutes the heading hierarchy; service names used as H2 would be better as H3 under a parent section H2.

17. **"See Also" structural H2 appears as an orphan section** — the topic cluster link injection adds a `## See Also` H2 at the bottom of articles. On placeholder EN pages, this is the *only* visible H2, making the heading hierarchy meaningless.

### Low Priority Issues

18. **Homepage title tag uses `&` symbol** — "Ing. de Software & SEO Técnico" — consider using `y` for the Spanish version to avoid HTML entity rendering issues.

19. **Author EN page word count heavily inflated** (~8,500 words) due to full article previews — consider using short excerpts.

20. **`/en/blog/seo` H3s include "Navegación" and "Últimos Posts"** — footer/navigation elements are leaking into the semantic heading hierarchy and may confuse crawlers.

21. **E-E-A-T guide is only ~2,100 words** — if intended as a pillar page for the SEO strategy cluster, it should target 3,000+ words to match pillar content thresholds defined in the project architecture.

22. **`blog/general` category lacks a clear purpose** — posts categorized as "General" dilute topical authority; consider reassigning posts like "Mejores cursos SEO" to the `seo` or `tech-seo` category.

---

## Quick Reference: Issue Count by Page

| Page | Critical | High | Medium |
|---|---|---|---|
| `/blog/general/mejores-cursos-seo-en-español` | 404 error | — | — |
| `/en/blog/general/mejores-cursos-seo-en-español` | 404 error | — | — |
| `/en/blog/seo/guia-eeat` | Thin/placeholder | — | — |
| `/en/blog/cs-fundamentals/sql-vs-nosql` | Thin/placeholder | — | — |
| `/blog/seo` (category) | Inherited article meta | — | — |
| `/en/blog` | Spanish H1 | — | — |
| `/en/authors/juan-carlos-angulo` | Title + meta in ES | — | — |
| `/en/blog/cs-fundamentals/experiencia-de-usuario` | Spanish content on EN | — | — |
| `/search` | — | Noindex + missing meta | — |
| `/en/search` | — | Noindex + missing meta | — |
| `/blog/general` | — | Empty + no meta | — |
| `/blog/tech-seo` | — | Empty category | — |
| `/en/blog/general` | — | Empty + no meta | — |
| `/en/blog/tech-seo` | — | ES meta on EN route | ES meta |
| `/en/blog/cs-fundamentals` | ES title+meta on EN | — | — |
| `/en/blog/seo` | ES meta on EN | — | — |
| `/blog/cs-fundamentals/experiencia-de-usuario` | — | — | H1/title mismatch |
| `/blog/seo/guia-eeat` | — | — | H1/title mismatch, typo |
| `/blog/cs-fundamentals/sql-vs-nosql` | — | — | Meta too long |
| `https://juan-tech.com` | — | — | Too many H2s |
| `/authors/juan-carlos-angulo` | — | — | Thin portfolio |
