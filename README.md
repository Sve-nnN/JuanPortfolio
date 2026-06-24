# Juan Tech

Blog técnico bilingüe y portfolio de Juan Carlos Angulo, ingeniero de software y consultor SEO técnico. El sitio cubre SEO técnico, rendimiento web, Next.js, Payload CMS y fundamentos de ciencias de la computación, con contenido en español (publicación principal) e inglés.

Producción: [https://juan-tech.com](https://juan-tech.com)

---

## Qué es este proyecto

Una aplicación Next.js (App Router) con Payload CMS como backend de contenido. Tiene dos caras:

- **El sitio público** que ven los visitantes: home, blog, casos de estudio, páginas de autor y páginas legales, todo en español e inglés.
- **El panel de administración** de Payload en `/admin`, donde se gestionan posts, páginas, medios, autores y la configuración global.

El contenido de los posts vive como archivos Markdown en `content/posts/` y se sincroniza hacia Payload con un comando. Esa es la fuente de verdad del blog: se escribe en Markdown, se sincroniza, y el sitio renderiza desde la base de datos.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| CMS | Payload 3 |
| Base de datos | MongoDB (adaptador `@payloadcms/db-mongodb`) |
| Editor de contenido | Lexical (`@payloadcms/richtext-lexical`) |
| Medios | Cloudinary |
| Estilos | Tailwind CSS |
| Animación | Framer Motion (con LazyMotion) |
| Fuentes | Geist más fuentes locales (Array, Khand) |
| Analítica | Google Tag Manager (GA4 vía GTM), Vercel Analytics y Ahrefs |
| Hosting | Vercel |
| Gestor de paquetes | pnpm 9 |
| Node | 20 |

---

## Arranque rápido

Requisitos: Node 20, pnpm 9, una instancia de MongoDB y una cuenta de Cloudinary.

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear el archivo .env con las claves de la sección "Variables de entorno"

# 3. Generar los tipos de Payload (recomendado tras cambiar colecciones)
pnpm generate:types

# 4. Levantar en desarrollo
pnpm dev
```

El sitio queda en `http://localhost:3000` y el panel de administración en `http://localhost:3000/admin`.

---

## Estructura del proyecto

```
src/
  app/
    (frontend)/        Rutas públicas del sitio
      [locale]/        Páginas por idioma (blog, autor, casos de estudio, legales)
      (sitemaps)/      Rutas SSR que sirven los sitemaps XML
      layout.tsx       Layout raíz (fuentes, providers, analítica, schema global)
      robots.ts        robots.txt dinámico
    (payload)/         Panel de administración y API de Payload
  collections/         Colecciones de Payload (Posts, Pages, Users, Media, etc.)
  globals/             Globales (Home, SiteSettings, BlogListing, LLM, Styles)
  blocks/              Bloques de contenido reutilizables (Hero, FAQ, Code, Form, etc.)
  components/          Componentes de UI compartidos
  heros/               Cabeceras de plantilla (PostHero, ArchiveHero)
  Header/  Footer/     Chrome del sitio
  utilities/           Helpers (schema, sitemap, generación de metadatos, Cloudinary)
  scripts/             Scripts de mantenimiento (sync de contenido, SEO, keywords)
  middleware.ts        Ruteo de idioma (prefijo /en, español sin prefijo)
content/
  posts/               Posts en Markdown, fuente de verdad del blog
  content-sync.json    Estado del sync (hashes y fechas de última sincronización)
```

### Colecciones de Payload

`Posts`, `Pages`, `Users` (autores), `Media`, `Categories`, `CaseStudies`, `Works`, `Clientes`, `Testimonials` y `AdBanners`. Hay además colecciones de datos SEO: `GSCMetrics`, `KeywordMetrics`, `PageMetrics` y `BrokenLinks`.

### Globales

`Home`, `SiteSettings`, `BlogListing`, `CaseStudiesListing`, `LLM` (configuración de `llms.txt`) y `Styles`.

---

## Internacionalización

El sitio es bilingüe con una convención simple:

- **Español** es el idioma por defecto y se sirve **sin prefijo** (`/blog`, `/contact`).
- **Inglés** se sirve con el prefijo **`/en`** (`/en/blog`, `/en/contact`).

El `middleware.ts` se encarga del ruteo: reescribe internamente las rutas sin prefijo hacia el segmento `[locale]` con `es`, redirige `/es` a la versión canónica sin prefijo, y deja `/en` tal cual. Cada página emite sus etiquetas `hreflang` (`es`, `en`, `x-default`) y un canonical autorreferencial.

---

## Flujo de contenido

Los posts se escriben en Markdown dentro de `content/posts/`, organizados por categoría (`cs-fundamentals`, `development`, `seo`, `tech-seo`). La convención de archivos:

- `mi-post.md` es la versión en español.
- `mi-post.en.md` es la versión en inglés.

El frontmatter de cada archivo lleva el título, la keyword objetivo, `metaTitle`, `metaDescription`, autor, fechas, imagen destacada y los campos de cluster temático.

Para llevar esos archivos a Payload (y que aparezcan en el sitio):

```bash
# Sincroniza todos los posts hacia la base de datos
pnpm import:posts

# Si la nube ya cambió y se quiere forzar que gane el Markdown local
pnpm import:posts -- --force
```

El sync detecta conflictos cuando la versión remota cambió desde la última sincronización. La opción `--force` salta ese chequeo y sobrescribe con el contenido local. El script ignora de forma automática cualquier artefacto de prueba (slugs con patrón `test`, `tmp`, `sample` o `scratch`), así que esos nunca llegan a producción.

> Importante: el `build` no corre el sync. Después de cambiar Markdown hay que ejecutar `pnpm import:posts` y luego revalidar o redeployar para ver los cambios en producción.

---

## SEO y datos estructurados

El SEO técnico es parte central del proyecto, no un agregado. Lo que el sitio resuelve por código:

- **Sitemaps**: un índice maestro en `/sitemap.xml` que apunta a cuatro sitemaps hijos (`pages`, `posts`, `categories`, `authors`), servidos por rutas SSR con anotaciones `hreflang`.
- **robots.txt** dinámico desde `src/app/robots.ts`, con una sola fuente de verdad.
- **JSON-LD** con un grafo `@graph` por página: `Organization`, `WebSite`, `Person` (la entidad del autor, con NAP y `knowsAbout`), `BlogPosting`, `BreadcrumbList` y `FAQPage` cuando el post incluye un bloque de preguntas.
- **Metadatos por página** con `generateMetadata`, incluido Open Graph (imágenes 1200x630 JPG servidas por Cloudinary, con el título superpuesto y un respaldo por slug cuando no hay imagen destacada).
- **`llms.txt`** para contexto de motores de IA, configurable desde el global `LLM`.
- **Páginas de búsqueda** marcadas con `noindex` y fuera del sitemap.

---

## Variables de entorno

Se cargan desde `.env`. Las principales:

**Núcleo**

| Variable | Para qué |
|---|---|
| `DATABASE_URI` | Cadena de conexión de MongoDB |
| `PAYLOAD_SECRET` | Clave de cifrado de Payload |
| `NEXT_PUBLIC_SERVER_URL` | URL pública del sitio (canonicals, sitemaps, OG) |
| `CLOUDINARY_URL`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Medios e imágenes OG |
| `BLOB_READ_WRITE_TOKEN` | Almacenamiento de blobs en Vercel |

**Analítica y SEO**

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_GTM_ID` | Contenedor de Google Tag Manager (carga la analítica) |
| `NEXT_PUBLIC_GA_ID` | Measurement ID de GA4 (se configura dentro de GTM) |
| `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_PROPERTY_URL` | Google Search Console (cuenta de servicio) |
| `GOOGLE_PSI_API_KEY` | PageSpeed Insights para las métricas de Core Web Vitals |
| `SERPAPI_API_KEY` | Datos de SERP para el flujo de contenido |
| `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` | Datos de keywords |

**Correo, formularios y otros**

| Variable | Para qué |
|---|---|
| `RESEND_SECRET`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | Envío de correo |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Protección de formularios con Cloudflare Turnstile |
| `OPENAI_API_KEY`, `LLM_PROVIDER` | Tareas asistidas por IA en los scripts |

---

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con Turbopack |
| `pnpm build` | Build de producción (corre `redirects` antes) |
| `pnpm start` | Sirve el build de producción |
| `pnpm import:posts` | Sincroniza los posts en Markdown hacia Payload |
| `pnpm sync:keywords` | Sincroniza keywords hacia los posts |
| `pnpm sync:gsc` | Trae métricas de Google Search Console |
| `pnpm audit:urls` | Audita el inventario de URLs |
| `pnpm create-post` | Asistente para crear un post nuevo |
| `pnpm fix:links` | Repara enlaces internos |
| `pnpm generate:types` | Regenera los tipos de TypeScript de Payload |
| `pnpm lint` y `pnpm lint:fix` | Linter |
| `pnpm test` | Tests de integración (Vitest) y end to end (Playwright) |
| `pnpm test:int` | Solo tests de integración |
| `pnpm test:e2e` | Solo tests end to end |

---

## Analítica (GTM y GA4)

El sitio carga únicamente Google Tag Manager. GA4 se dispara desde GTM, no como script aparte, para no duplicar el seguimiento. Dentro del contenedor de GTM hay que configurar:

1. Un tag **Google Tag** (GA4) con el Measurement ID, disparado en todas las páginas.
2. Un tag **GA4 Event** que capture los eventos personalizados que el código empuja al `dataLayer` (por ejemplo `cta_click`, `language_switch`, `search`, `generate_lead`).

Los eventos se envían con el helper `trackEvent` (en `src/utilities/analytics.ts`) y también se pueden disparar desde cualquier elemento con atributos `data-analytics` y `data-ga-*`. La guía detallada está en `docs/analytics-gtm-setup.md`.

---

## Tests

- **Integración** con Vitest: `pnpm test:int`. Cubre utilidades de SEO (sitemaps, robots, schema, metadatos), parsing de contenido, lógica de sync y adaptadores.
- **End to end** con Playwright: `pnpm test:e2e`.

---

## Despliegue

El sitio se despliega en Vercel. El comando de build es `pnpm build`, que ejecuta el paso de redirecciones y luego `next build`. Las variables de entorno se configuran en el panel de Vercel.

Un detalle a tener en cuenta: el contenido de los posts vive en la base de datos de Payload. Un deploy actualiza el código, pero no sincroniza el Markdown. Para publicar cambios de contenido hay que correr `pnpm import:posts` contra la base de producción y luego revalidar.

---

## Autor

**Juan Carlos Angulo**, ingeniero de software y consultor SEO técnico con sede en Lima, Perú.
LinkedIn: [juancangulo](https://www.linkedin.com/in/juancangulo/) · GitHub: [Sve-nnN](https://github.com/Sve-nnN)
