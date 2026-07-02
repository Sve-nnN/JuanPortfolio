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

## Contenido — YA aplicado por Claude en el markdown source (falta re-sync)

> **IMPORTANTE:** el contenido live se sirve desde la DB de Payload. Estos fixes ya están en el markdown de la branch, pero **para que lleguen a prod hay que `pnpm sync:content` (push markdown→DB)**. Durante la sesión el working tree se revirtió una vez desde la DB (tiene la versión vieja corrupta) — la branch tiene la versión buena.

### #104 ✅ — Post `javascript-seo`
- El `.en.md` estaba **truncado** (cortaba a mitad de un code block): lo completé.
- **Creé la versión ES** (`javascript-seo.md`) que faltaba, humanizada, con title/meta/tldr. Arregla el H1 "Javascript Seo" y el BlogPosting sin headline.

### #107 ✅ — Placeholders `www.ejemplo.com`
- En `seo-on-page-guia.md`, pasé los `www.ejemplo.com/...` a `example.com` en backticks (code, no-link) para que el converter Lexical no los auto-linkee.

### #108 ✅ — Wikilinks/enlaces anidados corruptos (10 posts)
- Reparé los `[[Texto](url1)](url2)` doble/triple-envueltos → un solo link válido, en 10 posts.
- Endurecí el guard `sanitizeWikilinks` para que colapse el doble-wrap en el próximo sync push.
- Live todavía muestra wikilinks Obsidian crudos `[[slug|anchor]]` (DB vieja) → el `pnpm sync:content` los limpia (el guard + el markdown corregido).

## Contenido — solo editable en el admin de Payload (DB, no hay source markdown)

### #105 — FAQ del home en `/en` con 5 preguntas en español
- Traducir al inglés esas 5 Q&A en el locale `en` del bloque FAQ del home (global/página en Payload).

### #106 — llms.txt `fullContent` sin estructura
- Reescribir el `fullContent` del global `llm` con subsecciones markdown. (El código de `/llms.txt` ya emite markdown estructurado y degrada bien.)

## Medición de performance (Unlighthouse)

Corrí **Unlighthouse** (Chrome real, mobile) contra el home — números reales, peores que PSI:
`Performance 0.52 · FCP 4.1s · LCP 8.6s · TTI 8.6s · TBT 310ms · CLS 0.001 · SEO 1.00`
El LCP real (8.6s mobile) confirma que #102 (Rocket Loader OFF) es lo más urgente. Comando para reproducir:
`npx unlighthouse-ci --site https://juan-tech.com --urls /`

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
