# 01 — Arquitectura General del Starter Kit

---

## Árbol de Archivos Completo

Cada archivo está pensado, justificado y documentado. Esto es lo que recibe el comprador:

```
juan-tech-starter/
│
├── .env.example                     # Variables de entorno documentadas una por una
├── .gitignore                       # Ignora node_modules, .next, media, .env
├── .eslintrc.json                   # ESLint config (Next.js + TypeScript)
├── .prettierrc.json                 # Formateo consistente
├── .nvmrc                           # Node 20+
│
├── docker-compose.yml               # MongoDB 7 + App en contenedores
├── Dockerfile                       # Para deploy containerizado opcional
│
├── package.json                     # Dependencias fijadas a versiones estables
├── pnpm-lock.yaml                   # Lockfile para builds determinísticas
├── tsconfig.json                    # TypeScript strict mode
├── next.config.js                   # Next.js 15 config optimizada (ver detalle abajo)
├── tailwind.config.js               # Tailwind con tema personalizable
├── postcss.config.js                # PostCSS + autoprefixer
├── components.json                  # Shadcn/ui config
│
├── redirects.json                   # Archivo de redirecciones (fuente única de verdad)
│
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── robots.txt                   # Preconfigurado, listo para editar
│   └── og-image.webp                # Imagen Open Graph por defecto
│
├── src/
│   ├── app/
│   │   ├── (frontend)/
│   │   │   ├── layout.tsx           # Root layout: metadata, fonts, providers
│   │   │   ├── page.tsx             # Homepage dinámica
│   │   │   ├── not-found.tsx        # 404 page
│   │   │   │
│   │   │   ├── [lang]/              # Rutas localizadas (es, en)
│   │   │   │   ├── layout.tsx       # Layout con alternates hreflang
│   │   │   │   ├── page.tsx         # Homepage localizada
│   │   │   │   ├── blog/
│   │   │   │   │   ├── page.tsx     # Blog listing con paginación
│   │   │   │   │   ├── [category]/
│   │   │   │   │   │   └── page.tsx # Category listing
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx # Post individual
│   │   │   │   └── autores/
│   │   │   │       └── [slug]/
│   │   │   │           └── page.tsx # Author page
│   │   │   │
│   │   │   └── sitemap.ts           # sitemap.xml dinámico
│   │   │
│   │   └── (payload)/               # Payload CMS admin
│   │       ├── admin/
│   │       │   └── [[...segments]]/
│   │       │       └── page.tsx
│   │       └── api/
│   │           └── [[...segments]]/
│   │               └── route.ts
│   │
│   ├── components/
│   │   ├── JsonLd.tsx               # Schema.org JSON-LD (todos los tipos)
│   │   ├── Meta.tsx                 # Meta tags dinámicos
│   │   ├── Breadcrumbs.tsx          # BreadcrumbList con schema
│   │   ├── Header.tsx               # Header responsivo + navegación
│   │   ├── Footer.tsx               # Footer con links y schema Organization
│   │   ├── PostCard.tsx             # Card de blog con imagen, fecha, autor
│   │   ├── SearchBar.tsx            # Búsqueda (plugin search de Payload)
│   │   ├── TableOfContents.tsx      # TOC automático desde headings
│   │   ├── CodeBlock.tsx            # Syntax highlighting (prism)
│   │   └── Newsletter.tsx           # Formulario de newsletter (Resend)
│   │
│   ├── collections/
│   │   ├── Posts.ts                 # Colección Posts con todos los campos
│   │   ├── Categories.ts            # Colección Categories
│   │   ├── Authors.ts               # Colección Authors (vinculada a Users)
│   │   └── Media.ts                 # Colección Media con optimización
│   │
│   ├── fields/
│   │   ├── seoFields.ts             # Campos SEO reutilizables
│   │   ├── slugField.ts             # Campo slug con auto-generación
│   │   └── i18nFields.ts            # Campos localizados ES/EN
│   │
│   ├── hooks/
│   │   ├── revalidateOnChange.ts    # ISR: revalidar al publicar/editar
│   │   └── populateAuthor.ts        # Auto-popular datos de autor
│   │
│   ├── utilities/
│   │   ├── generateMeta.ts          # Generador de metadata para Next.js App Router
│   │   ├── generateSchema.ts        # Generador de JSON-LD dinámico
│   │   ├── formatDate.ts            # Formateo de fechas (ES/EN)
│   │   ├── cn.ts                    # Utilidad clsx + tailwind-merge
│   │   └── constants.ts             # Constantes (site name, URL, defaults)
│   │
│   ├── i18n/
│   │   ├── config.ts                # Configuración de idiomas
│   │   ├── es.json                   # Strings en español
│   │   └── en.json                   # Strings en inglés
│   │
│   ├── middleware.ts                 # Middleware de localización
│   └── payload.config.ts            # Payload CMS configuración central
│
├── scripts/
│   ├── seed.ts                      # Datos de ejemplo (3 posts, 2 categorías, 1 autor)
│   ├── fetch-redirects.ts           # Sincronizar redirects.json con Payload
│   └── sync-content.ts              # Markdown ↔ Payload CMS sync
│
└── docs/
    ├── README.md                    # Documentación principal
    ├── DEPLOY.md                    # Guía de deploy paso a paso
    ├── SEO.md                       # Documentación de features SEO
    ├── CUSTOMIZATION.md             # Cómo personalizar colores, fuentes, layout
    └── MIGRATION.md                 # Cómo migrar desde WordPress
```

---

## Componentes Clave Explicados

### 1. `next.config.js` — Configuración de Next.js

El archivo más importante del proyecto. Incluye:

- **`images.remotePatterns`**: Configurado para Vercel Blob, Cloudinary, GitHub, Gravatar
- **`images.formats`**: AVIF y WebP automáticos
- **`headers`**: Content-Security-Policy, CORS para API, cache para estáticos
- **`redirects`**: Sistema de redirecciones desde `redirects.json` + reglas predefinidas
- **`experimental.optimizeCss`**: CSS optimization experimental

### 2. `src/utilities/generateMeta.ts` — Motor de Metadatos

Genera dinámicamente:
- `title` y `metaDescription` desde los campos de Payload CMS
- `openGraph`: title, description, images, url, type
- `twitter`: card, title, description, images
- `alternates`: canonical URL
- `robots`: index/noindex, follow/nofollow

### 3. `src/utilities/generateSchema.ts` — Motor de JSON-LD

Soporta automáticamente:
- **Organization** (homepage): nombre, url, logo, sameAs
- **Person** (author pages): nombre, jobTitle, sameAs, knowsAbout
- **WebSite** (homepage): url, potentialAction (SearchAction)
- **BlogPosting** (posts): headline, author, datePublished, dateModified, mainEntityOfPage
- **BreadcrumbList** (todas las páginas): itemListElement con position
- **FAQPage** (cuando hay FAQs): mainEntity con Question/Answer
- **ProfessionalService** (homepage): provider, areaServed, serviceType

### 4. `src/middleware.ts` — Localización

- Detecta idioma del navegador (Accept-Language header)
- Redirige `/` → `/es` o `/en` según preferencia
- Preserva el idioma en la URL
- Configura `link rel="alternate" hreflang` en cada página
- Middleware de Vercel Edge (baja latencia)

### 5. `src/collections/Posts.ts` — Modelo de Contenido

Campos incluidos:
- `title` (Text, required)
- `slug` (Text, unique, auto-generado)
- `author` (Relationship → Users)
- `category` (Relationship → Categories)
- `publishedAt` (Date)
- `heroImage` (Upload → Media)
- `content` (Rich Text — Lexical editor)
- `metaTitle` (Text, max 60 chars)
- `metaDescription` (Textarea, max 160 chars)
- `keyword` (Text — primary target keyword)
- `semanticKeywords` (Array of Text — LSI keywords)
- `tldr` (Textarea — AI summary / snippet bait)
- `idioma` (Select: es / en)
- `noindex` (Checkbox — para contenido thin/placeholder)
- `schemaType` (Select: Article / BlogPosting / TechArticle)

### 6. `scripts/sync-content.ts` — Pipeline de Contenido

Permite escribir posts en Markdown local y sincronizarlos con Payload CMS. Soporta:
- Push: Markdown → Payload CMS
- Pull: Payload CMS → Markdown
- Frontmatter completo con validación
- Asignación automática de autor y categoría
