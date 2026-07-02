# v1.6 — Acciones manuales pendientes (Juan)

Los fixes de **código** ya están aplicados y verificados en la branch `fix/v1.6-audit-remediation` (issues cerrados). Estos items **no son de código** y quedan para vos. Cada uno tiene su issue abierto.

## Infra — Cloudflare (mayor impacto, cero código)

### #12 — www.juan-tech.com no sirve TLS
- DNS: crear registro `www` **proxied** (naranja) en Cloudflare.
- Rules → Redirect Rule 301: `www.juan-tech.com/*` → `https://juan-tech.com/$1`.
- Verificar: `curl -I https://www.juan-tech.com/` → 301 al apex.

### #102 — Rocket Loader degrada LCP/INP
- Cloudflare → Speed → Optimization → **Rocket Loader = Off**.
- Es la palanca de performance de mayor impacto (−300 a −800ms de LCP) y no toca código.
- Verificar: el HTML ya no inyecta `/cdn-cgi/scripts/.../rocket-loader.min.js`.

## Performance / medición

### #103 — INP sin dato de campo
- Abrir el dashboard de **Vercel Speed Insights** (ya instalado) y revisar el p75 de INP por ruta.
- Sirve para validar contra campo los fixes de #95/#102.

### #95 — LCP (parte opcional con QA visual)
- Los levers seguros ya están en el código. Lo que queda (aislar framer-motion del hero, recortar preloads de fuentes) necesita QA visual tuya. Hacer #102 primero y medir antes de tocar el hero.

## Contenido — Payload CMS

### #104 — Post `javascript-seo` (ES) sin title/meta
- Poblar `title` + `meta.title`/`meta.description` en ES (humanizado) → arregla H1 "Javascript Seo" y el BlogPosting sin headline.

### #105 — FAQ del home en `/en` con 5 preguntas en español
- Traducir al inglés esas 5 Q&A en el locale `en` del bloque FAQ del home.

### #106 — llms.txt `fullContent` sin estructura
- Reescribir el `fullContent` del global `llm` con subsecciones markdown (`## Servicios`, `## Sobre Juan`, `## Cómo contactar`).
- (El código ya emite markdown estructurado y degrada bien; esto mejora el cuerpo.)

### #107 — Placeholders `www.ejemplo.com` como enlaces reales
- En el post `seo-on-page-guia`, convertir los `www.ejemplo.com` en `<code>`/texto (no enlaces).

## Decisión de dato

### #88 — 3 posts noindex ausentes del sitemap
- Son `cs-fundamentals/experiencia-de-usuario`, `cs-fundamentals/sql-vs-nosql`, `seo/guia-eeat`. Emiten `noindex` (seteado en Payload, no en el markdown). El sitemap los excluye **correctamente**.
- Decidir: ¿deben indexarse? Si sí → quitar `noindex` en Payload (o re-syncar, ya que el frontmatter no lo trae). Si no → nada que hacer.

## Aplicar el fix de categorías huérfanas (#89)

- El **código** ya está corregido (resolver de categoría por título). Para **aplicar** a los 5 posts `/blog/general/*` huérfanos, re-correr `pnpm sync:content` con acceso a la DB → recuperan su categoría `tech-seo`, aparecen en el listado (enlace interno) y el sitemap/canonical usan `tech-seo`.

## Deploy

- Todo el trabajo de código está en la branch `fix/v1.6-audit-remediation`. **No se mergeó a main** (mergear dispara deploy de producción en Vercel; es tu decisión).
- Sugerido: abrir PR → revisar preview de Vercel (validación real de build + los 301 de categoría, og:image 200, llms.txt) → mergear.
- Tras el deploy: re-crawl para confirmar y cerrar #95 si el LCP bajó con #102.
</content>
