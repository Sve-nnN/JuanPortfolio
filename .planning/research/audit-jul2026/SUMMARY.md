# Auditoría integral v1.6 — Resumen consolidado (2026-07-02)

Fuentes: 6 agentes (crawl SEO vivo technical/schema/performance/geo + code-rootcause + code-bughunt).
Correcciones importantes al reporte base jul-2026 marcadas con ⚠.

## Correcciones al reporte base
- ⚠ "sitemap solo 4 URLs" → FALSO. Es un `<sitemapindex>` con 4 hijos = 152 `<loc>` reales.
- ⚠ "1 img rota" → en realidad las **og:image de casi todos los posts dan 400** (coma sin doble-encode en overlay Cloudinary).
- ⚠ "4 errores HTTP" → 500 **intermitentes** por cold-start/ISR en `/authors` (no determinista).
- ⚠ "ningún schema IA detectado" → FALSO. Home tiene FAQPage+Person+ProfessionalService; posts tienen BlogPosting con author/dates. El crawler no los vio por el wrapper `@graph` sin `@type`.
- ⚠ "1 enlace externo roto" → LinkedIn 999 (falso positivo) + placeholders `www.ejemplo.com` publicados como links.
- ⚠ "4 huérfanas" → son **5** posts `/blog/general/*`.
- ⚠ "/ ↔ /#contact duplicado" → falso positivo (fragmento).

## Hallazgos verificados (por severidad)

### Crítico / Alto — código
| ID | Hallazgo | Causa raíz | Fix | Quién |
|----|----------|-----------|-----|-------|
| CAT | Categoría de post no validada → duplicados + hreflang no recíproco | `blog/[category]/[slug]/page.tsx` resuelve por slug ignorando categoría; canonical/alternates desde `params` | 301/404 si categoría ≠ real; canonical+hreflang desde categoría real del post | código |
| OG | og:image Cloudinary 400 en todo el blog | Coma en overlay `l_text` codificada 1 vez (debe ser doble: `,`→`%252C`) | Doble-codificar `,` y `/` en el builder OG | código |
| AUTH500 | `/authors/[slug]` 500 intermitente + sin ProfilePage/Person | Query Payload sin guard/cache en cold-start | try/catch + `unstable_cache`; emitir ProfilePage | código |
| LLMS | `/llms.txt` roto en prod (devuelve string del catch) + `/llms-full.txt` fantasma (sirve HTML home) | Query Payload falla en runtime Vercel; no existe ruta llms-full | Diagnosticar query; robustecer builder; quitar/implementar llms-full | código |

### Medio — código / SEO
| ID | Hallazgo | Causa raíz | Fix |
|----|----------|-----------|-----|
| H1 | 2 H1 en la home | `ContactFormBlock` fuerza `<h1>` reusado en home | Prop `headingLevel` default h2; h1 solo en /contact |
| SMAP | 3 posts publicados+enlazados ausentes del sitemap | `where` de posts-sitemap los excluye | Alinear `where` a "publicado y accesible" |
| ORPH | 5 posts `/blog/general/*` huérfanos | Listado de categoría no los muestra | Listar todos + enlazado interno |
| SCHEMA | Schemas leídos "Unknown" | Wrapper `@graph` sin `@type` raíz | Consolidar en un `@graph` único por página |
| BUG01 | revalidatePost usa `/blog/{slug}` sin categoría → ISR no invalida | Path sin segmento categoría | Construir `/blog/{cat}/{slug}` desde doc |
| BUG02 | triggerCWVScan mide PSI sobre URL 404 | Mismo path sin categoría | Helper compartido de URL de post |
| BUG04 | internal-links apply reporta éxito sin aplicar | No valida que el replace ocurrió | Verificar reemplazo; success:false si no |

### Bajo — código
| ID | Hallazgo | Fix |
|----|----------|-----|
| BUG03 | `previousDoc._status` sin optional chaining (crash condicional en create) | `previousDoc?._status` |
| BUG05 | generateMetadata del post no filtra `_status: published` (leak metadata draft) | Añadir filtro published |
| BUG06 | generateStaticParams usa slug del locale default para ambos idiomas | Consultar por locale |
| POWER | `x-powered-by: Next.js, Payload` filtra stack | `poweredByHeader: false` |
| EJEMPLO | Placeholders `www.ejemplo.com` como links reales en post seo-on-page | Convertir a `<code>`/texto (contenido) |

### Performance
| ID | Hallazgo | Fix | Quién |
|----|----------|-----|-------|
| LCP | LCP 4446ms = render delay (no servidor/imagen) | next/dynamic below-the-fold, recortar preloads fuentes, hero server component | código |
| ROCKET | Cloudflare Rocket Loader degrada LCP/INP | Panel Cloudflare → Rocket Loader OFF | Juan (Cloudflare) |
| INP | INP sin dato de campo | Abrir Vercel Speed Insights (ya instalado) | Juan (dashboard) |

### Infra — no código (Juan)
| ID | Hallazgo | Fix |
|----|----------|-----|
| WWW | www.juan-tech.com no completa TLS (issue #12 vivo) | DNS www proxied + Redirect Rule 301 → apex en Cloudflare |

### Contenido (Payload CMS — Juan / semiautomatizable)
- javascript-seo (ES) sin title/meta → BlogPosting sin headline, H1 = slug title-cased.
- FAQ del home en /en con 5 preguntas en español (mezcla de idioma).
- llms.txt `fullContent` del global `llm` sin estructura markdown.

## Deuda menor (informativa, no issue)
- `api/seo/indexing/route.ts:59` try vacío (feature incompleta).
- `payload.config.ts:226` `Bearer ${CRON_SECRET}` sin guard si undefined (mitigado: jobs vacío).
- `seoAnalyzer.ts:378` `internalLinksCount: 0` hardcodeado (TODO).
- BUG07 CWV floating promise en serverless (deuda reconocida; usar waitUntil/jobs).

## Baseline verificado
- tsc `--noEmit`: **112 errores, 100% en tests/** (0 en src/). Bajo baseline 114.
- Vitest: **776/776 verdes** (rerun limpio; 5 flakes ETIMEDOUT ambientales).
</content>
</invoke>
