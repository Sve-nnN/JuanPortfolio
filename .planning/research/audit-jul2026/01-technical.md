# Auditoría técnica SEO — juan-tech.com (verificación en vivo)

Fecha: 2026-07-02. Sitio: Next.js 15 + Payload, bilingüe (es sin prefijo, en bajo `/en`).
Método: curl/openssl contra el sitio en producción. Cada hallazgo abajo está verificado con evidencia HTTP real, no copiado del reporte previo.

Resumen de puntaje técnico: **72/100**. Fundamentos sólidos (HTTPS, HSTS preload, CSP, hreflang recíproco en URLs canónicas, sitemap index bien formado), pero con un bug estructural grave (rutas de categoría no validadas → duplicación masiva) y las imágenes Open Graph rotas en todo el blog.

---

## Hallazgo 1 — "4 páginas con error HTTP de 94" → 500 intermitentes, no persistentes

**URLs exactas + evidencia**
- Barrido de las 152 URLs del sitemap (`xargs -P 12`, dos corridas completas): en la primera corrida devolvió `500 https://juan-tech.com/en/authors`; en la segunda corrida las 152 dieron 200.
- Reintento dirigido: 6 hits a `/en/authors`, `/authors`, `/en/authors/juan-carlos-angulo`, `/authors/juan-carlos-angulo` → **24/24 = 200**. No se reprodujo el 500 de forma estable.

**Causa raíz probable (Next/Payload)**
500 intermitente típico de cold-start / revalidación ISR en Vercel: la ruta de autores hace una consulta a Payload (Postgres/Mongo) y, en un arranque en frío o timeout de conexión del pool, el Server Component lanza y devuelve 500 antes de cachear. No es un error de código determinista: es un fallo transitorio de runtime/datos. Coincide con "4 de 94" (el crawler pegó justo en arranques en frío). Ligado al patrón del issue previo #12 y al cuello de botella de build de Vercel.

**Severidad:** Media (intermitente, pero Google puede registrar el 500 y descartar la página temporalmente).

**Fix propuesto**
- Envolver las queries de `/authors` y `/en/authors` en try/catch con fallback y `revalidate` explícito; evitar que un timeout de DB tumbe el render.
- Añadir warmup/health-check o `export const dynamic`/`revalidate` estable; considerar `unstable_cache` para la lista de autores (cambia poco).
- Monitoreo: alerta en Vercel sobre 5xx para cuantificar la frecuencia real.

---

## Hallazgo 2 — Contenido duplicado (13 grupos) → el segmento de categoría NO se valida

Este es el hallazgo más importante. **Confirmado que cualquier categoría en la URL de un post devuelve 200 con canonical auto-referencial.**

**URLs exactas + evidencia** (todas 200, canonical = la propia URL pedida)
```
/blog/tech-seo/headless-cms-seo         200  canonical=/blog/tech-seo/headless-cms-seo
/blog/development/headless-cms-seo      200  canonical=/blog/development/headless-cms-seo
/blog/seo/headless-cms-seo              200  canonical=/blog/seo/headless-cms-seo
/blog/general/headless-cms-seo          200  canonical=/blog/general/headless-cms-seo
/blog/nonexistent-cat/headless-cms-seo  200  canonical=/blog/nonexistent-cat/headless-cms-seo   <-- categoría inventada
/blog/tech-seo/this-post-does-not-exist 404  (slug inexistente sí da 404)
```
El slug se valida (404 si no existe), pero **la categoría no**: `/blog/CUALQUIER-COSA/<slug-real>` renderiza el post y se declara a sí misma como canónica. Esto genera infinitas variantes indexables del mismo contenido.

Pares confirmados que ya viven así en producción:
- `/blog/tech-seo/headless-cms-seo` ↔ `/blog/development/headless-cms-seo`
- `/blog/general/xml-sitemap-automation` ↔ `/blog/tech-seo/xml-sitemap-automation`

**Causa raíz probable (Next/Payload)**
En `app/(frontend)/blog/[category]/[slug]/page.tsx` (o equivalente): la query busca el post solo por `slug` e ignora `params.category`, y el `canonical`/`alternates` de `generateMetadata` se construyen a partir de `params` (la ruta pedida) en lugar de la categoría real del post en Payload. Por eso el canonical apunta a la variante equivocada en vez de consolidar.

**Severidad:** Alta (dilución de señales, presupuesto de rastreo desperdiciado, riesgo de canibalización).

**Fix propuesto**
1. En el page/loader: validar que `params.category` coincide con la categoría real del post; si no, `notFound()` (404) o `redirect(301)` a la ruta canónica.
2. En `generateMetadata`: derivar `canonical` y `alternates.languages` **de la categoría real del post en Payload**, nunca de `params`. Así toda variante apunta al mismo canónico y se consolida.
3. Regla de negocio: un post = una categoría canónica. Si se quiere multi-categoría, elegir una como canónica.

---

## Hallazgo 3 — Hreflang: 15 return-links faltantes → mismo bug de categoría + 3 posts fuera del sitemap

**Evidencia — en las URLs canónicas el hreflang SÍ es recíproco:**
```
/ (es):        es=/  en=/en  x-default=/
/en:           es=/  en=/en  x-default=/
post canónico: es=/blog/tech-seo/headless-cms-seo  en=/en/blog/tech-seo/headless-cms-seo  x-default=es
```
El problema aparece en las **variantes de categoría fantasma**, que heredan el bug del Hallazgo 2:
```
/blog/development/headless-cms-seo -> hreflang es=/blog/development/...  en=/en/blog/development/...
```
Es decir, cada variante arma su propio clúster es/en a partir de la ruta pedida. Esas URLs (`/blog/development/headless-cms-seo`, etc.) **no están en el sitemap** (el sitemap solo lista `/blog/tech-seo/headless-cms-seo`), así que el crawler ve un clúster hreflang que la versión del sitemap no reciproca → "return-link faltante".

**Además: 3 posts vivos y enlazados internamente que NO están en el sitemap** (comparación links internos ↔ sitemap):
```
200  /blog/cs-fundamentals/experiencia-de-usuario
200  /blog/cs-fundamentals/sql-vs-nosql
200  /blog/seo/guia-eeat
```
(los slugs no aparecen en ningún `-sitemap.xml`). Son reales — un slug inexistente da 404, estos dan 200. Contribuyen a inconsistencias hreflang/cobertura.

**Causa raíz probable (Next/Payload)**
- Mismo origen que el Hallazgo 2: `alternates.languages` en `generateMetadata` se construye desde `params` en lugar de la categoría real.
- Los 3 posts faltantes: la query del sitemap (`posts-sitemap.xml`) los excluye (probable `where` por `_status`/`publishedAt`/categoría) aunque estén publicados y enlazados. Revisar el filtro del endpoint de sitemap de posts en Payload.

**Severidad:** Media-Alta.

**Fix propuesto**
- Al arreglar el Hallazgo 2 (canonical/hreflang desde la categoría real), la reciprocidad se corrige sola porque toda variante apunta al par canónico.
- Alinear el `where` del `posts-sitemap.xml` con la condición real de "publicado y accesible" para incluir esos 3 posts (o despublicarlos si no deben ser accesibles — hoy son un leak de contenido indexable fuera del sitemap).

---

## Hallazgo 4 — Páginas huérfanas en sitemap → 5 posts `/blog/general/*` (reporte decía 4)

**URLs exactas + evidencia** (en sitemap, sin enlaces internos entrantes tras rastrear home, `/blog`, las 5 páginas de categoría, `/authors`, `/case-studies`):
```
/blog/general/core-web-vitals-guide
/blog/general/nextjs-seo-optimization
/blog/general/non-developers-guide
/blog/general/ssr-vs-csr-seo
/blog/general/tech-seo-guide
```
Verificado: la página `/blog/general` solo enlaza `tablas-hash`; ninguno de los 5 aparece ahí ni en otro hub.

**Causa raíz probable (Next/Payload)**
Posts categorizados como "general" en el sitemap pero no listados por la página de categoría `/blog/general` (posible desajuste entre la categoría usada para generar la URL del sitemap y la usada por el listado, o paginación/límite en el listado de categoría que los deja fuera). Sin ruta de enlace interno = huérfanos.

**Severidad:** Media (rastreables por sitemap, pero sin PageRank interno ni contexto).

**Fix propuesto**
- Asegurar que la página de categoría lista todos sus posts (revisar `limit`/paginación del listado).
- Añadir enlazado interno (posts relacionados, listados por categoría completos) para que cada post en sitemap tenga ≥1 enlace entrante.

---

## Hallazgo 5 — "1 enlace externo roto de 7" → placeholders `www.ejemplo.com` (falso positivo de 404, problema de calidad real)

**URLs exactas + evidencia**
Enlaces externos en el cuerpo de los posts:
```
https://github.com/sve-nnn        200
https://github.com/Sve-nnN        200  (GitHub es case-insensitive; ambos resuelven)
https://www.linkedin.com/in/juancangulo/   999  (LinkedIn bloquea bots -> FALSO POSITIVO)
https://www.googletagmanager.com/gtm.js?id=GTM-M6FQ2KSL   200
http://www.ejemplo.com/optimizar-seo-on-page   200  (dominio parkeado)
http://www.ejemplo.com/p?art=123               200
http://www.ejemplo.com/optimizarSEOonpage / /seo-on-page/optimizacion-url
```
No se reprodujo un 404 duro en enlaces externos. El "roto" del crawler es casi seguro el `999` de LinkedIn (falso positivo por bloqueo de bots) o uno de los `www.ejemplo.com`.

**Hallazgo real asociado:** hay URLs de ejemplo (`www.ejemplo.com/...`) publicadas como enlaces reales dentro del post de SEO on-page. Son placeholders de tutorial, no deberían ser `<a href>` en vivo (apuntan a un dominio parkeado ajeno).

**Causa raíz probable (Payload)**
Contenido del post `seo-on-page-guia` con ejemplos ilustrativos convertidos en enlaces reales en el richtext.

**Severidad:** Baja.

**Fix propuesto**
- Convertir los `www.ejemplo.com` en `<code>` o texto plano (no enlaces), o usar `example.com` con `rel="nofollow"`.
- Ignorar el `999` de LinkedIn en el crawler (whitelistear el dominio).

---

## Hallazgo 6 — "2 recursos rotos (1 img + 1 JS)" → IMG: og:image de Cloudinary rota en TODO el blog (400). JS: no reproducible

### 6a. Imágenes Open Graph rotas — HTTP 400 en la mayoría de posts (mucho más que "1")

**Evidencia**
- `og:image` de un post (`arboles-binarios`) → **400**. La imagen base sin overlay de texto (`.../f_avif,q_auto/v1770675694/portfolio/fallback-image-14.avif`) → **200**.
- Aislé la causa con pruebas controladas sobre la misma transformación:
```
texto sin coma "Titulo simple"           -> 200
coma codificada simple  (%2C)            -> 400   <-- ROTO
coma codificada doble   (%252C)          -> 200   <-- correcto
dos puntos simple (%3A)                  -> 200
```

**Causa raíz (definitiva)**
El generador de `og:image` construye una capa de texto de Cloudinary `l_text:Array-Bold.woff2_70_...:<TÍTULO>` y **codifica el título una sola vez**. En las capas de texto de Cloudinary, la coma es separador de parámetros de transformación y debe ir **doble-codificada** (`,` → `%252C`). Como casi todos los títulos SEO/CS llevan comas ("Árboles binarios: tipos, BST, AVL, balanceo y recorridos", "Algoritmos de ordenamiento: tipos, Big O y cuál elegir"...), la URL resultante es una transformación inválida → 400. Los pocos títulos sin coma funcionan. Los dos puntos no rompen (van bien con codificación simple).

Esto rompe la **preview social (OG/Twitter) de prácticamente todos los posts del blog**, y es el "img roto" que el crawler detectó (probablemente contó solo 1 por dedupe de dominio/patrón).

**Severidad:** Alta (CTR social y señales de compartición degradadas en todo el blog).

**Fix propuesto**
- En el builder de la URL de Cloudinary (helper de OG image), **doble-codificar los caracteres especiales del texto del overlay**: como mínimo `,` → `%252C` y `/` → `%252F`. Idealmente usar el SDK de Cloudinary (`cloudinary.url` con `overlay: { text }`), que escapa correctamente.
- Verificación rápida tras el fix: `og:image` de `arboles-binarios` debe dar 200.

### 6b. JS roto — no reproducible

Todos los chunks `/_next/static/*.js` de la home dieron 200. El "1 JS roto" es casi seguro un chunk hasheado obsoleto capturado por el crawler tras un redeploy de Vercel (el hash cambia y la versión vieja da 404). No hay acción de código; se resuelve al re-rastrear post-deploy.

**Severidad:** Baja (transitorio de deploy).

---

## Chequeos adicionales solicitados

### robots.txt — OK
```
User-Agent: *  Allow: /  Disallow: /admin  Disallow: /api/
Sitemap: https://juan-tech.com/sitemap.xml (+ pages/posts/categories/authors)
```
Correcto. `/admin` y `/api/` bloqueados. Nota menor: `robots.txt` declara 5 sitemaps pero `sitemap.xml` (el index) solo referencia 4 hijos (no incluye `pages-sitemap.xml` como hijo del index, aunque sí lo lista robots.txt). No es crítico: ambos caminos exponen los mismos hijos.

### "sitemap.xml dice solo 4 URLs" — FALSO POSITIVO
`sitemap.xml` es un **sitemap index**, no un urlset. Sus 4 entradas son sitemaps hijos (`pages`, `posts`, `categories`, `authors`), no páginas. Sumando los hijos hay **152 `<loc>`** reales (≈76 es + 76 en). El crawler contó las 4 entradas del index como si fueran páginas. No hay que hacer nada salvo asegurarse de que el crawler siga los sitemaps hijos.

### Canonical — OK en URLs canónicas, ROTO en variantes de categoría (ver Hallazgo 2)
`/` → `https://juan-tech.com` (sin barra, consistente). Posts canónicos auto-referencian bien. El problema es solo el auto-canonical de las variantes de categoría no validadas.

### Redirect www → apex — ROTO (TLS, coincide con issue #12)
```
https://www.juan-tech.com/  ->  TLS handshake FAILURE
  openssl: "tlsv1 alert internal error" (SSL alert 80)
  Verify return code: 0 (ok)  <-- el cert valida, pero el edge aborta el handshake
```
`www` **no completa el TLS**, así que no hay ni redirect. El apex está detrás de Cloudflare (`server: cloudflare`), pero `www` no tiene un edge/cert servible → cualquier enlace o tipeo a `www.juan-tech.com` cae. Es el issue #12 (TLS 525 en www) todavía vivo.

**Fix:** crear el registro DNS de `www` en Cloudflare (proxied) y una Redirect Rule 301 `www.juan-tech.com/*` → `https://juan-tech.com/$1`, con el hostname en el cert (Cloudflare universal SSL cubre apex+www si `www` está proxied). Verificar: `curl -I https://www.juan-tech.com/` debe dar 301 al apex.

### Redirects generales — OK
- `http://juan-tech.com` → `https://juan-tech.com/` (301). Correcto.
- `/blog/` → `/blog` (308, sin barra final). Consistente.

### Cabeceras de seguridad — MUY BIEN (raro y bueno)
```
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: default-src 'self'; ... object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
```
Único pero menor: `x-powered-by: Next.js, Payload` filtra el stack (quitar con `poweredByHeader: false` en `next.config`). CSP usa `'unsafe-inline'`/`'unsafe-eval'` en `script-src` (necesario por GTM, aceptable).

### JS rendering — SSR OK
El HTML de home y posts llega con contenido, canonical, hreflang y og en el `<head>` server-rendered (no requiere JS para indexar). Bien para SEO.

---

## Tabla de prioridades

| # | Hallazgo | Severidad | Fix |
|---|----------|-----------|-----|
| 2 | Categoría no validada → duplicados con self-canonical | **Crítica** | 404/301 si `params.category` ≠ categoría real; canonical/hreflang desde Payload, no `params` |
| 6a | og:image Cloudinary 400 en todo el blog (coma sin doble-encode) | **Alta** | Doble-codificar `,`/`/` en el overlay `l_text` o usar el SDK |
| — | www no sirve TLS (issue #12) | **Alta** | DNS `www` proxied + Redirect Rule 301 → apex |
| 3 | Hreflang no recíproco (deriva del #2) + 3 posts fuera del sitemap | Media-Alta | Se corrige con #2; alinear `where` del posts-sitemap |
| 4 | 5 posts `/blog/general/*` huérfanos | Media | Listar todos en la categoría + enlazado interno |
| 1 | 500 intermitentes en `/en/authors` (ISR/cold-start) | Media | try/catch + cache en queries de autores |
| 5 | Placeholders `www.ejemplo.com` como enlaces reales | Baja | Convertir a `<code>`/texto |
| — | `x-powered-by` filtra stack | Baja | `poweredByHeader: false` |
| 6b | 1 JS "roto" | Baja | Transitorio de deploy, sin acción |

### Correcciones al reporte previo del 2026-07-02
- "sitemap con solo 4 URLs": falso, es un index con 152 URLs reales.
- "duplicado `/` ↔ `/#contact`": falso positivo (fragmento del mismo doc).
- "1 img rota": en realidad son las og:image de casi todos los posts (400 por coma).
- "4 huérfanas": son 5.
- "1 enlace externo roto": no reproducido como 404 duro; probable `999` de LinkedIn (falso positivo) o placeholder `ejemplo.com`.
- "4 errores HTTP": intermitentes (cold-start 500), no persistentes.
