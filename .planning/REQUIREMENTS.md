# Requirements — Milestone v1.6 (Auditoría integral & remediación SEO+código)

Derivado de: reporte SEO jul-2026 + crawl fresco (SEO skills) + auditoría de código local.
Detalle y evidencia: `.planning/research/audit-jul2026/` (01-technical, 02-schema, 03-performance, 04-geo, 05-code-rootcause, 06-code-bugs, SUMMARY).

Convención severidad ↔ label GitHub: `seo:critical/high/medium/low`, `code/bug`, bloque `seo/technical|schema|performance|content|geo|sitemap|infra`, tanda `audit-jul2026`.

## v1.6 Requirements

### SEO Técnico (routing / canonical / indexación)
- [ ] **TECH-01** (crítico): La ruta `/blog/[category]/[slug]` valida la categoría — si `params.category` ≠ categoría real del post, responde 301 a la canónica (o 404); canonical y `alternates.languages` se derivan de la categoría real en Payload, no de `params`. Elimina los duplicados y corrige la reciprocidad hreflang.
- [ ] **TECH-02** (alto): Las og:image de Cloudinary devuelven 200 en todos los posts (doble-codificar `,` y `/` en el overlay `l_text`).
- [ ] **TECH-03** (medio): `/authors/[slug]` no lanza 500 en cold-start (query envuelta en try/catch + cache) y emite ProfilePage/Person.
- [ ] **TECH-04** (medio): El `posts-sitemap.xml` incluye los 3 posts publicados+enlazados hoy ausentes (`cs-fundamentals/experiencia-de-usuario`, `cs-fundamentals/sql-vs-nosql`, `seo/guia-eeat`).
- [ ] **TECH-05** (medio): Los 5 posts `/blog/general/*` huérfanos reciben ≥1 enlace interno entrante (listado de categoría completo).
- [ ] **TECH-06** (medio): La home tiene exactamente 1 H1 (`ContactFormBlock` con `headingLevel` configurable, default h2; h1 solo en `/contact`).
- [ ] **TECH-07** (bajo): `poweredByHeader: false` en `next.config` (no filtrar stack).

### Datos estructurados
- [ ] **SCH-01** (medio): El JSON-LD por página se consolida en un `@graph` único con `@type` reconocibles (no más "Unknown"); sin duplicar `@id`.

### Visibilidad IA (GEO/AEO)
- [ ] **GEO-01** (alto): `/llms.txt` sirve markdown estructurado válido en producción (diagnosticar el fallo de query Payload que hoy devuelve el string del catch).
- [ ] **GEO-02** (medio): `/llms-full.txt` deja de servir el HTML del home — o se implementa como ruta real, o se elimina y se quita de robots/referencias.

### Performance
- [ ] **PERF-01** (alto): LCP de la home < 2500ms — reducir render delay: `next/dynamic` para bloques below-the-fold, recortar preloads de fuentes al peso del H1, aislar la animación cliente del hero.

### Bugs de código
- [ ] **BUG-01** (medio): `revalidatePost` invalida la URL real del post (`/blog/{categoría}/{slug}`), no `/blog/{slug}`.
- [ ] **BUG-02** (medio): `triggerCWVScan` mide PSI sobre la URL real del post (helper de URL compartido con la página).
- [ ] **BUG-03** (bajo): `revalidatePost` usa `previousDoc?._status` (optional chaining).
- [ ] **BUG-04** (medio): El endpoint `internal-links/apply` devuelve `success:false` cuando el reemplazo no ocurre (no falso positivo ni reescritura espuria).
- [ ] **BUG-05** (bajo): `generateMetadata` del post filtra `_status: published` (no fuga metadata de drafts).
- [ ] **BUG-06** (bajo): `generateStaticParams` del post/página usa el slug correcto por locale.

## Manual / Juan (no código — issues informativos)
- [ ] **INFRA-01** (alto): www.juan-tech.com sirve TLS y redirige 301 al apex (DNS www proxied + Redirect Rule en Cloudflare). Reabrir/continuar issue #12.
- [ ] **PERF-02** (alto): Cloudflare Rocket Loader OFF (panel → Speed → Optimization).
- [ ] **PERF-03** (info): Revisar INP real en Vercel Speed Insights (ya instalado).
- [ ] **CNT-01** (medio): Poblar title/meta del post `javascript-seo` (ES) → BlogPosting con headline y H1 correcto.
- [ ] **CNT-02** (bajo): Traducir al inglés las 5 preguntas del FAQ del home que quedaron en español en `/en`.
- [ ] **CNT-03** (bajo): Reescribir `fullContent` del global `llm` con estructura markdown (secciones).
- [ ] **CNT-04** (bajo): Convertir los placeholders `www.ejemplo.com` del post seo-on-page en `<code>`/texto (no enlaces).

## Future Requirements (deferidos)
- **AEO-FAQ**: Inyectar FAQPage/HowTo por post (131 encabezados en forma de pregunta ya existen) — enhancement AEO, milestone propio.
- **BUG-07**: CWV floating promise en serverless → mover a `payload.jobs`/`waitUntil` (deuda reconocida).
- Deuda menor informativa: `internalLinksCount` hardcodeado, try vacío en indexing route, guard de `CRON_SECRET`.
- Diferidos de v1.5: VERIFY-01 (gate runtime), ASSET-01 (Blob→Cloudinary).

## Out of Scope
- Fabricar AggregateRating/Review sin reseñas reales.
- Rediseño visual de Header/Footer.
- Cambiar el proxy Cloudflare→Vercel salvo lo necesario para www/Rocket Loader.
- Rehacer keyword research.

## GitHub Issues (tanda audit-jul2026)

| REQ-ID | Issue | Tipo | Fixable por código |
|--------|-------|------|--------------------|
| TECH-01 | #85 | duplicados/hreflang (crítico) | sí |
| TECH-02 | #86 | og:image Cloudinary 400 | sí |
| TECH-03 | #87 | authors 500 + ProfilePage | sí |
| TECH-04 | #88 | 3 posts fuera del sitemap | sí |
| TECH-05 | #89 | 5 huérfanos general/* | sí |
| TECH-06 | #90 | 2 H1 home | sí |
| TECH-07 | #91 | x-powered-by | sí |
| SCH-01 | #92 | @graph sin @type | sí |
| GEO-01 | #93 | llms.txt roto prod | sí (requiere logs Vercel) |
| GEO-02 | #94 | llms-full.txt fantasma | sí |
| PERF-01 | #95 | LCP render delay | sí |
| BUG-01 | #96 | revalidatePost sin categoría | sí |
| BUG-02 | #97 | triggerCWVScan URL 404 | sí |
| BUG-03 | #98 | previousDoc._status | sí |
| BUG-04 | #99 | internal-links apply falso positivo | sí |
| BUG-05 | #100 | generateMetadata drafts | sí |
| BUG-06 | #101 | generateStaticParams locale | sí |
| PERF-02 | #102 | Rocket Loader | no (Cloudflare/Juan) |
| PERF-03 | #103 | INP dashboard | no (Vercel/Juan) |
| CNT-01 | #104 | javascript-seo title/meta | no (Payload/Juan) |
| CNT-02 | #105 | FAQ /en idioma | no (Payload/Juan) |
| CNT-03 | #106 | llms fullContent | no (Payload) +opcional código |
| CNT-04 | #107 | ejemplo.com links | no (Payload/Juan) |
| INFRA-01 | #12 (comentado) | www TLS | no (Cloudflare/Juan) |

## Traceability (REQ → fase)

| Fase | Requirements |
|------|--------------|
| 31 Routing canónico del blog | TECH-01, BUG-01, BUG-02, BUG-06 |
| 32 Sitemap & enlazado interno | TECH-04, TECH-05 |
| 33 Metadata, OG & schema | TECH-02, TECH-06, SCH-01, BUG-05 |
| 34 Resiliencia runtime | TECH-03, GEO-01, GEO-02 |
| 35 Bugs restantes & hardening | BUG-03, BUG-04, TECH-07 |
| 36 Performance LCP | PERF-01 |
| 37 Manual & verificación | PERF-02, PERF-03, CNT-01..04, INFRA-01 |

Cobertura: 100% de los REQ mapeados a una fase.
</content>
