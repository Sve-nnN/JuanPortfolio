# SEO audit jun-2026 — acciones manuales pendientes

Estos issues no se resuelven editando el repo: dependen de DNS/edge, un deploy a producción, datos en el CMS (Payload) o activos de diseño. Quedan abiertos en GitHub hasta que los completes. Pasos exactos abajo.

## Infra / edge

### #12 — `www.juan-tech.com` rompe el handshake TLS (525) · CRÍTICO
El redirect www→apex de `next.config.js` nunca corre porque el TLS muere antes del HTTP.
1. Entrá al panel de Vercel del proyecto → **Settings → Domains**.
2. Agregá `www.juan-tech.com` como dominio (si no figura) y dejá que Vercel emita el certificado para ese SAN. Vercel debería ofrecer "Redirect to juan-tech.com".
3. Si el DNS lo maneja Cloudflare: en **DNS**, asegurate de que el registro de `www` esté **proxiado** (nube naranja) y que el modo SSL/TLS sea **Full (strict)**. El cert universal de Cloudflare debe cubrir `www`.
4. Verificá:
   ```bash
   curl -sI https://www.juan-tech.com | head -5    # debe dar 301 → https://juan-tech.com
   ```

### #16 — Paginación `/blog/page/N` canonicaliza a la home · ALTO
El fix ya está en el código (`blog/page/[pageNumber]/page.tsx`, commit c574a26) pero **no está desplegado**.
1. Mergeá `main` y forzá un deploy de producción en Vercel.
2. Verificá:
   ```bash
   curl -s https://juan-tech.com/blog/page/2 | grep -E 'canonical|rel="(prev|next)"'
   # canonical debe ser self-referencial a /blog/page/2, con rel prev/next
   ```

## CMS (Payload) — datos, no código

### #30 — Home EN con meta placeholder ('This is the home of my website') · MEDIO
1. Payload admin → documento **Home** → locale **EN**.
2. Meta title (~50-60 chars) y meta description (~150-160) a la calidad del ES.

### #31 — Posts EN sirven title/description en español (fallback) · MEDIO
1. Para cada post sin traducción de meta EN: poblar meta title/description EN (y OG text) en el locale EN.
2. Auditá todos los posts por meta EN faltante antes de cerrar.

### #51 — Placeholder 'TuMarca' en el headline del BlogPosting · BAJO
1. El sufijo `| TuMarca` viene del `meta.title` del post en el CMS. Editá el meta title para quitarlo.
2. Idealmente el headline del schema debe ser solo el título del artículo (sin sufijo de marca).

> Nota: si estos posts también existen como markdown en `content/posts/`, el meta EN puede setearse ahí (campos `metaTitle`/`metaDescription` en el `.en.md`) y sincronizarse. Confirmá de dónde toma producción la meta antes de decidir.

## GEO / entidad

### #47 — `Person.sameAs` solo LinkedIn+GitHub · MEDIO
Necesita URLs reales de tus perfiles. Cuando existan, agregalos en site-settings (Payload) → `socialProfiles`:
- YouTube, X/Twitter, Reddit (los de mayor correlación de citación en IA).
- Largo plazo: ítem en Wikidata + presencia en YouTube/Reddit alrededor del contenido tech-SEO.

## Contenido / diseño

### #44 — 57 posts con `heroImage: null` · MEDIO (parte de código YA resuelta)
- **Código:** `generateMeta.ts` ya genera un OG de fallback (`getFallbackBySlug` + overlay del título sobre Cloudinary), así que ningún post queda sin OG. Esa parte está cubierta.
- **Pendiente tuyo (diseño):** crear/asignar las 57 hero images reales (`/images/blog/<slug>.webp`) y setear `heroImage` por post. Lista de slugs faltantes:
  ```bash
  # Genera la lista actualizada de posts con heroImage null:
  grep -rl "heroImage: null" content/posts --include='*.md'
  ```

## Diferidos a PR dedicado (riesgo / esfuerzo alto)

### #20 — Render dinámico sitewide (sin ISR) · ALTO
El root layout (`src/app/(frontend)/layout.tsx`) llama `draftMode()` + `headers()` (`x-pathname`) para detectar locale, lo que marca **todas** las rutas como dinámicas. Sacar esto exige reestructurar el árbol de rutas (derivar locale del segmento `[locale]` y aislar `draftMode()` a un subárbol). Es un refactor con riesgo real de romper la detección de idioma y el preview en todo el sitio. Recomendación: PR aparte, con verificación de `x-vercel-cache: HIT` post-deploy y QA de locale/preview.

### #61 — 72 client components / chunks JS por página · BAJO
Auditoría grande, bajo impacto (framer-motion ya usa LazyMotion). Recomendación: pase dedicado moviendo a server component los `'use client'` sin estado/efectos/handlers, validando bundle con `next build`. No bloquea nada.
