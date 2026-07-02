# Mapeo causa-raíz — Reporte SEO 2026-07-02

Diagnóstico código → causa raíz + fix propuesto. No se aplicó ningún cambio.
Rutas absolutas desde la raíz del repo `JuanPortfolio/`.

---

## 1. Dos H1 en la home

**Archivo:línea (causa raíz)**
- `src/blocks/HeroHome/Component.tsx:94` → `<m.h1>` (título del hero, "Ingeniería de Software aplicada al SEO Técnico / Juan Carlos Angulo").
- `src/blocks/ContactFormBlock/Component.tsx:83` → `<h1>` para `title` ("Hablemos de tu proyecto").

**Explicación**
La home se arma con bloques del global `home` (`src/app/(frontend)/[locale]/[slug]/page.tsx:87-108` → `HomePage` → `RenderBlocks`). El layout incluye el bloque `HeroHome` (emite su H1) **y** el bloque `ContactFormBlock`. Este último fue convertido a `<h1>` a propósito para la página `/contact`, que no tenía ningún H1 (ver comentario en `ContactFormBlock/Component.tsx:81-82`, "must be the page's single `<h1>` … META-02"). El problema es que el **mismo** bloque se reutiliza como sección de contacto dentro de la home, donde ya existe el H1 del hero. Resultado: 2 H1 en la home. En `/contact` el comportamiento actual es correcto (ahí sí debe ser el único H1).

**Fix concreto propuesto**
El heading del `ContactFormBlock` debe ser configurable por contexto en lugar de forzar `<h1>`. Opciones (de menor a mayor esfuerzo):
- (A) Añadir prop `as?: 'h1' | 'h2'` (default `'h2'`) al `ContactFormBlock` y renderizar con esa etiqueta; pasar `as="h1"` sólo desde la plantilla `/contact` y `as="h2"` (o sin pasar nada) cuando el bloque va dentro del layout de la home. Requiere ubicar dónde se instancia el bloque en `RenderBlocks`/config del bloque.
- (B) Si no se quiere tocar la firma del bloque: mantener el `<h1>` en `/contact` y en la home renderizar la sección de contacto con un bloque/variante distinta que use `<h2>`.
Recomendado: (A), un campo `headingLevel` en el schema del bloque Payload (`src/blocks/ContactFormBlock/config.ts`) con default `h2`, y setear `h1` únicamente en la instancia de `/contact`.

**Riesgo/impacto**
Bajo. Cambio de nivel semántico, sin impacto visual si se conservan las clases. Verificar que `/contact` siga teniendo exactamente un H1 tras el cambio (no romper META-02).

---

## 2. Contenido duplicado — mismo post bajo múltiples categorías

**Archivo:línea (causa raíz)**
- `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx:90-99` (query del post) y `:133-140` (canonical vía `generateMeta`).

**Explicación**
La ruta resuelve el post **sólo por `slug`**, ignorando por completo el segmento `category`:
```
where: { and: [ { slug: { equals: slug } }, ...(draft ? [] : [{ _status: 'published' }]) ] }
```
No hay validación de que `category` coincida con la categoría real del post. La única guarda es un `redirect` 301 cuando el segmento es un ObjectID de Mongo (`:111-120`), pero **cualquier slug de categoría válido** (o casi cualquier string que Next haya prerenderizado / sirva vía ISR) devuelve el mismo post con HTTP 200. Por eso `/blog/tech-seo/headless-cms-seo` y `/blog/development/headless-cms-seo` sirven contenido idéntico.

Y lo agrava el canonical: `generateMetadata` (`:214-236`) llama `generateMeta({ ..., path: '/blog/${category}/${slug}' })` usando la categoría **de la URL**, no la real del post. Cada URL duplicada se auto-canonicaliza a sí misma → ambas se declaran canónicas → Google/Ahrefs las ven como duplicados sin señal de consolidación.

Nota: `generateStaticParams` (`:38-73`) sólo emite la combinación con la **primera** categoría del post, así que las variantes bajo otra categoría no se prerenderizan; se sirven on-demand vía ISR (la ruta es dinámica, no hay `dynamicParams = false`).

**Fix concreto propuesto**
Definir una única "categoría canónica" por post (la primera de `post.categories`, misma lógica que `posts-sitemap` en `src/app/(frontend)/(sitemaps)/posts-sitemap.xml/route.ts:50-66`) y:
1. En el page component: tras cargar el post, calcular `canonicalCategory`. Si `category !== canonicalCategory`, hacer `redirect(301, '${localePrefix}/blog/${canonicalCategory}/${slug}')` (extender el guard que hoy sólo cubre ObjectIDs en `:111-120`).
2. En `generateMetadata`: construir el canonical con `canonicalCategory` (no con el `category` de la URL), pasando ese path a `generateMeta`.
3. Alinear `generateStaticParams` para que sólo emita la categoría canónica (ya lo hace) y opcionalmente `export const dynamicParams = true` con el redirect anterior absorbiendo las variantes.

Recomendado el 301 (opción más limpia: elimina el duplicado en origen). Alternativa mínima: sólo canonical apuntando a la categoría real (mantiene 200 en ambas pero consolida señales).

**Riesgo/impacto**
Medio. Un 301 cambia URLs vivas: verificar que los enlaces internos y el `posts-sitemap` ya usen la categoría canónica (el sitemap sí, usa `categories[0]`). Riesgo de cadenas de redirección si algún enlace interno apunta a la categoría no canónica (revisar `RelatedPostsServer`, `PostsGrid`, `PostHero` `mainCategory.href`). Impacto SEO positivo (consolida duplicados).

---

## 3. Hreflang — 15 return-links faltantes (reciprocidad)

**Archivo:línea (causa raíz)**
- `src/utilities/generateMeta.ts:99-124` (alternates por-URL, sin normalizar a categoría canónica).
- Interacción con `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx:214-236` (pasa el `category` de la URL a `generateMeta`).

**Explicación**
`generateMeta` genera los `alternates.languages` (es/en/x-default) a partir del `path` recibido, que para posts es el segmento de categoría **de la URL crawleada**. Como el mismo post es accesible bajo varias categorías (hallazgo #2), cada variante emite su propio clúster hreflang apuntando a su propia categoría. Mientras tanto, el `posts-sitemap` (`posts-sitemap.xml/route.ts:60-72`) declara el par hreflang usando la **categoría canónica** (`categories[0]`). Cuando Ahrefs cruza el hreflang del sitemap con el del `<head>` de una URL descubierta por enlaces internos bajo otra categoría, la URL "de retorno" no coincide → reporta return-link faltante. Los 15 faltantes son, con alta probabilidad, los pares es/en de esos posts duplicados (más posibles pares de categorías cuyo `<head>` real difiere del sitemap).

Punto secundario: los `alternates` en sí son recíprocos por-URL (es↔en apuntan entre sí), así que el problema no es la lógica es/en, sino que **existen múltiples identidades hreflang para el mismo contenido** por la falta de categoría canónica única. La mención del reporte a "#fragmento/variantes" apunta a esa multiplicidad de URLs.

**Fix concreto propuesto**
Se resuelve junto con el #2: normalizar SIEMPRE a la categoría canónica antes de generar canonical + hreflang.
- En `generateMetadata` del post, calcular `canonicalCategory` y pasar `path: '/blog/${canonicalCategory}/${slug}'` a `generateMeta`, de modo que `esUrl`/`enUrl` (`generateMeta.ts:114-115`) y `languages` (`:119-123`) usen la misma categoría que el sitemap.
- Con el 301 del #2, las variantes dejan de servir 200 y desaparecen del grafo de crawl, eliminando los clústeres divergentes.

**Riesgo/impacto**
Bajo si se hace en conjunto con #2. Verificar que el `x-default` (hoy `esUrl`, `generateMeta.ts:122`) siga apuntando a la versión española canónica. Sin cambios de esquema.

---

## 4. Sitemap declara sólo 4 URLs pese a ~94 páginas

**Archivo:línea (causa raíz)**
- `src/app/(frontend)/(sitemaps)/sitemap.xml/route.ts:12-14` + `src/utilities/sitemap.ts:17-27` (`SITEMAP_CHILDREN`).

**Explicación**
`/sitemap.xml` **no es un `<urlset>`**: es un `<sitemapindex>` que referencia 4 sitemaps hijos (`pages`, `posts`, `categories`, `authors`). Las "4 URLs" que ve el auditor son exactamente esas 4 entradas `<sitemap>` del índice. Es la arquitectura correcta (índice → hijos), pero explica el conteo de 4 si el crawler:
1. No desciende a los sitemaps hijos, **o**
2. Los hijos devuelven error en producción. Los hijos bootean Payload dentro del handler (`getPayload` + `payload.find`, p. ej. `pages-sitemap.xml/route.ts:11-46`). Si en Vercel un hijo excede el cap de prerender/timeout o falla el arranque de Payload, cae al `catch` y devuelve `[]` (sitemap vacío) o HTTP 500 (`:56-59`). Con hijos vacíos/500, sólo queda el índice con sus 4 referencias.

Además, `robots.txt` (`src/app/robots.ts:14-20`) anuncia **el índice Y los 4 hijos** como 5 sitemaps al mismo nivel. Un crawler que trate el índice como sitemap normal cuenta 4 "URLs" (las referencias) y no las expande.

**Fix concreto propuesto**
1. Confirmar en producción el status/tamaño real de cada hijo (`curl -s -o /dev/null -w "%{http_code} %{size_download}\n" https://juan-tech.com/posts-sitemap.xml`, idem pages/categories/authors). Si alguno da 500 o `<urlset>` vacío → ahí está la pérdida real de URLs.
2. Si es timeout de boot de Payload en Vercel: mover la generación a build/ISR con `unstable_cache` ya presente (ya está) pero garantizar `export const revalidate`/runtime nodejs y, si hace falta, precomputar en un cron/`revalidateTag`. También servir el índice y no duplicar los hijos en `robots.txt` (dejar sólo `/sitemap.xml` para evitar el doble anuncio que confunde a algunos crawlers) — evaluar según preferencia.
3. Verificar que ningún artefacto estático en `/public` sobrescriba las rutas (no hay hoy: `public/` sólo tiene favicon/OG), pero es la regresión histórica (issue #13) a vigilar.

**Riesgo/impacto**
Medio. Si el problema es boot de Payload en Vercel, el fix toca runtime/caché de rutas críticas de indexación; probar en preview. Quitar los hijos de `robots.txt` es reversible y de bajo riesgo.

---

## 5. 4 páginas internas con error HTTP

**Archivo:línea (candidatos — requiere la lista de URLs del crawl para cerrar)**
- `src/app/(frontend)/(sitemaps)/*-sitemap.xml/route.ts` (`return new Response('Error generating sitemap', { status: 500 })`): si un hijo falla, esas rutas devuelven 500 y podrían contarse como "páginas con error". Ver `posts-sitemap.xml/route.ts:97-100`, `categories-…:73-76`, `authors-…:72-75`, `pages-…:56-59`.
- `src/app/(frontend)/[locale]/author/[slug]/page.tsx`: ruta **singular** `/author/[slug]` que consulta `users` por slug; si un user no tiene `slug` o el locale no resuelve, puede caer en `notFound`/500. Además duplica a `/authors/[slug]` (ver #6).
- Case studies: `/case-studies` está en `STATIC_PAGE_PATHS` (`src/utilities/sitemap.ts:35-43`) y por tanto en `pages-sitemap`, pero los **detalles** `case-studies/[slug]` no están en ningún sitemap; si alguna URL de case study se coló por enlace interno y su `generateStaticParams` no la cubre, puede 404.

**Explicación**
Sin la lista exacta de las 4 URLs del reporte no se puede fijar la línea culpable, pero los patrones de fallo del código son: (a) handlers de sitemap que devuelven 500 al fallar Payload; (b) la ruta de autor singular sin datos; (c) desalineación sitemap↔`generateStaticParams`.

**Fix concreto propuesto**
Obtener del crawl las 4 URLs con su status. Luego, según patrón:
- 500 en sitemaps → cubierto por #4.
- `/author/*` → eliminar/redirigir la ruta singular (ver #6).
- 404 en detalle sin params → añadir `dynamicParams` correcto o incluir la colección en el sitemap.

**Riesgo/impacto**
Bajo por diagnóstico; el fix depende del subtipo. Requiere dato del crawl (bloqueante para precisión).

---

## 6. 4 páginas huérfanas (sin enlaces internos entrantes)

**Archivo:línea (causa raíz principal)**
- `src/app/(frontend)/[locale]/author/[slug]/page.tsx` — ruta **singular** `/author/[slug]`.

**Explicación**
Existen dos árboles de autor: `/authors/[slug]` (plural) y `/author/[slug]` (singular). Todos los enlaces internos apuntan al **plural**: el listado `src/app/(frontend)/[locale]/authors/page.tsx:135` (`href={.../authors/${a.slug || a.id}}`), el schema (`generateSchema.ts:80-84`, comentario issue #25 que canonicaliza al plural), y el `authors-sitemap` (`authors-sitemap.xml/route.ts:39-40`, emite `/authors/`). El singular `/author/[slug]` no recibe ningún enlace interno (grep sólo lo encuentra en un comentario) → páginas huérfanas y además contenido duplicado del plural.

Otros candidatos huérfanos: `/search` (utilitaria, ya `robots: index:false` en `search/page.tsx:147`, aceptable), y posibles variantes `/en/...` de páginas legales sin enlace directo en nav.

**Fix concreto propuesto**
- Eliminar el directorio `src/app/(frontend)/[locale]/author/` (singular) y añadir un redirect 301 `/author/:slug → /authors/:slug` (vía `next.config` redirects o `PayloadRedirects`), consolidando en el plural.
- Confirmar con el crawl las 4 URLs exactas; si incluyen legales `/en/...`, añadir enlaces en el footer.

**Riesgo/impacto**
Bajo-medio. Eliminar la ruta singular es seguro si no hay backlinks externos a `/author/`; el 301 cubre ese caso. Verificar que ninguna metadata/canonical apunte al singular (el schema ya usa plural).

---

## 7. llms.txt sin estructura

**Archivo:línea (causa raíz)**
- `src/utilities/llmsTxt.ts:56-113` (builder) + `src/app/(frontend)/llms.txt/route.ts` (fuente de datos).

**Explicación**
El builder **sí** produce markdown estructurado (`# título`, `## Information`, `## Key Resources`, `## Entity Knowledge Graph` con `### por post`). El problema es que el bloque dominante `## Information` es un volcado **verbatim** de `llmConfig.fullContent` (`llmsTxt.ts:67-72`) — un campo de texto libre del global `llm` en Payload. Si en el CMS ese campo es prosa corrida sin subtítulos, el output se ve como un muro de texto pese al andamiaje. O sea: la falta de estructura viene del **dato del CMS**, no del builder. Secundariamente, el builder no genera secciones para páginas/servicios/contacto: sólo Information + Resources + posts.

**Fix concreto propuesto**
Dos frentes:
1. Contenido (CMS): reescribir el `fullContent` del global `llm` con subsecciones markdown reales (## Servicios, ## Sobre Juan, ## Cómo contactar), humanizado.
2. Código (opcional, robustez): que el builder deje de depender de un único blob y arme secciones desde datos estructurados — p. ej. añadir `## Pages` desde `STATIC_PAGE_PATHS`, `## Services` desde un campo repeater, y limitar `## Information` a un resumen corto. Añadir headers de sección aunque `fullContent` venga vacío.

**Riesgo/impacto**
Muy bajo. `/llms.txt` no afecta indexación tradicional; mejora GEO/AEO. El fix de contenido es reversible.

---

## 8. Recursos rotos (1 img + 1 JS)

**Archivo:línea (candidatos — requiere URL del recurso del crawl)**
- Imagen: `src/utilities/mergeOpenGraph.ts:6-10` → OG por defecto `${SITE_URL}/website-template-OG.webp`. El asset existe en `public/` pero es un **placeholder de plantilla** (`.webp`); algunos scrapers no renderizan webp para OG (compárese con issue #33 que ya fuerza JPG para OG de posts vía `getCloudinaryOgJpg`). Otro candidato: URLs OG generadas con overlay (`getCloudinaryOgWithTitle` en `generateMeta.ts:94`) cuyo `getFallbackBySlug` base 404e si el asset Cloudinary no existe — revisar `src/constants/fallbackImages.ts`.
- JS: scripts de terceros en `src/app/(frontend)/layout.tsx` — Ahrefs `analytics.js` (`:136`) y GTM (`:132-134`). Un "JS roto" en el crawl suele ser un `src` que devuelve 404/timeout; con Next los chunks hasheados no suelen 404ear, así que el candidato más probable es un tercero bloqueado o un `data-key` inválido.

**Explicación**
No se puede fijar el recurso exacto sin la URL que reporta el crawl. Los candidatos de código son el OG por defecto en webp y los scripts de terceros.

**Fix concreto propuesto**
1. Traer del crawl la URL exacta del img y del JS con su status.
2. Si el img es `/website-template-OG.webp`: reemplazar por un OG de marca en JPG 1200×630 y actualizar `mergeOpenGraph.ts:8`.
3. Si el img es un fallback Cloudinary: validar los mapeos de `src/constants/fallbackImages.ts`.
4. Si el JS es un tercero: confirmar disponibilidad/keys (Ahrefs, GTM).

**Riesgo/impacto**
Bajo. Requiere dato del crawl para precisión (bloqueante).

---

## 9. Schemas "Unknown" (@type no reconocido)

**Archivo:línea (causa raíz)**
- `src/components/JsonLd.tsx:243-249` (wrapper de salida) — cada `<script type="application/ld+json">` emite `{ "@context": "https://schema.org", "@graph": [ ... ] }` **sin `@type` en el nodo raíz**.

**Explicación**
Todos los nodos internos (`Organization`, `WebSite`, `Person`, `ProfessionalService`, `BlogPosting`, `BreadcrumbList`, `CollectionPage`, `FAQPage`) sí llevan `@type` correcto (verificado en `src/utilities/schema/*.ts` y `generateSchema.ts`). Lo que no tiene `@type` es el **contenedor `@graph`** que envuelve cada bloque. Varios auditores (incluido el reporte de schema de Ahrefs/Screaming Frog) listan la entidad de nivel superior del bloque JSON-LD; al ser un contenedor `@graph` puro sin `@type`, lo reportan como "Unknown". Se agrava porque hay **múltiples** bloques `<script>` por página: el layout emite 2 (Organization y WebSite, `layout.tsx:77-78`) y cada page emite 1 más, cada uno con su propio wrapper sin `@type`.

Sub-causa a validar: si en alguna página `siteSettings` es `null` (`layout.tsx:34-38` hace `.catch(() => null)`), no se emiten Organization/WebSite; y si una page pasa `schema` custom (`page.meta.jsonLD`, `[slug]/page.tsx:134`) mal formado sin `@type`, el nodo aplanado sale sin tipo. Pero la causa dominante y sistemática es el contenedor `@graph` sin `@type`.

**Fix concreto propuesto**
- (Preferido) Consolidar en **un solo** `<script>` por página con un `@graph` único que contenga todos los nodos (Organization + WebSite + los de la page), de modo que el auditor recorra los `@type` internos en lugar de tratar cada wrapper como entidad. Hoy el layout y la page emiten scripts separados.
- Como mínimo, verificar que cada nodo pusheado por `pushSchema` (`JsonLd.tsx:210-231`) tenga `@type`; descartar/loggear nodos sin `@type` antes de emitir (defensa ante `page.meta.jsonLD` custom mal formado).
- No es un error bloqueante de validación (el JSON-LD es válido), pero eliminar el "Unknown" mejora el reporte y evita falsos positivos.

**Riesgo/impacto**
Bajo-medio. Consolidar en un `@graph` único toca el orden de emisión (layout vs page); asegurar que no se dupliquen `@id` (Organization ya se referencia por `@id` desde varios nodos). Probar con el Rich Results Test / validador schema-org tras el cambio.

---

## Resumen de dependencias entre fixes
- **#2, #3** comparten causa raíz (falta de categoría canónica única por post) → resolver juntos.
- **#4, #5** comparten el modo de fallo de los handlers de sitemap (500 al fallar Payload en Vercel).
- **#6** (ruta `/author/` singular) puede además explicar parte de **#5**.
- **#5, #8** están **bloqueados por dato**: necesitan la lista de URLs/recursos exactos del crawl para fijar línea; el resto está cerrado en código.
