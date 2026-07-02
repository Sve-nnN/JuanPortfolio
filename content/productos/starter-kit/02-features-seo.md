# 02 — Features SEO del Starter Kit

> Esta es la ventaja competitiva del producto. Ningún otro starter de Next.js + Payload CMS incluye SEO técnico a este nivel. Esta es la documentación que recibe el comprador.

---

## 1. Metadatos Dinámicos

### Qué hace
Cada página genera automáticamente title tags, meta descriptions, Open Graph y Twitter Cards desde los campos de Payload CMS.

### Implementación
```typescript
// src/utilities/generateMeta.ts
export function generateMeta(doc: PayloadPost): Metadata {
  return {
    title: doc.metaTitle || doc.title,
    description: doc.metaDescription,
    openGraph: {
      title: doc.metaTitle || doc.title,
      description: doc.metaDescription,
      url: `${SITE_URL}/${doc.slug}`,
      images: doc.heroImage ? [{ url: doc.heroImage.url }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.metaTitle || doc.title,
      description: doc.metaDescription,
      images: doc.heroImage ? [doc.heroImage.url] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/${doc.slug}`,
    },
    robots: doc.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
```

### Valor para el desarrollador
- No vuelve a escribir meta tags manualmente nunca más
- Google muestra rich snippets correctamente
- Las redes sociales muestran preview cards atractivas

---

## 2. Schema.org JSON-LD (7 tipos)

### Qué hace
Genera datos estructurados JSON-LD dinámicos para cada tipo de página.

### Tipos soportados

| Tipo | Dónde | Campos |
|------|-------|--------|
| Organization | Homepage | name, url, logo, sameAs, contactPoint |
| Person | Author pages | name, jobTitle, sameAs, knowsAbout, url |
| WebSite | Homepage | url, potentialAction (SearchAction) |
| BlogPosting | Posts | headline, author, datePublished, dateModified, image, mainEntityOfPage |
| BreadcrumbList | Todas | itemListElement con position e item |
| FAQPage | Páginas con FAQ | mainEntity con Question/Answer |
| ProfessionalService | Homepage | provider, areaServed, serviceType |

### Ejemplo de salida (BlogPosting)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://juan-tech.com/blog/tech-seo/technical-seo-guide",
      "headline": "Guía Completa de SEO Técnico",
      "author": {
        "@type": "Person",
        "name": "Juan Carlos Angulo",
        "url": "https://juan-tech.com/autores/juan-carlos-angulo"
      },
      "datePublished": "2026-03-01",
      "dateModified": "2026-03-15",
      "image": "https://cdn.juanes.xyz/images/tech-seo-hero.webp",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://juan-tech.com/blog/tech-seo/technical-seo-guide"
      }
    }
  ]
}
```

### Valor para el desarrollador
- Elegible para rich results en Google (mejor CTR)
- Google Knowledge Panel para la marca
- Validación automática con Schema.org

---

## 3. Sitemap XML Dinámico

### Qué hace
Genera un sitemap.xml actualizado automáticamente con todas las URLs indexables, incluyendo `<lastmod>`, `<changefreq>`, y versiones localizadas.

### Implementación
- Usa `next-sitemap` con configuración dinámica
- Excluye automáticamente páginas con `noindex: true`
- Incluye alternates hreflang para URLs bilingües
- Se regenera en cada build

### Ejemplo de salida
```xml
<url>
  <loc>https://juan-tech.com/blog/tech-seo/core-web-vitals-guide</loc>
  <lastmod>2026-03-20</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
  <xhtml:link rel="alternate" hreflang="es" href="https://juan-tech.com/blog/tech-seo/core-web-vitals-guide"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://juan-tech.com/en/blog/tech-seo/core-web-vitals-guide"/>
</url>
```

---

## 4. Robots.txt Óptimo

```txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: https://juan-tech.com/sitemap.xml

# Crawl-delay no es necesario con buen hosting
# Googlebot ignora esta directiva de todas formas
```

### Valor
- No bloquea CSS/JS/Imágenes (esencial para renderizado)
- Protege rutas de admin y API
- Declara sitemap automáticamente

---

## 5. Redirecciones Automatizadas

### Qué hace
Sistema de redirecciones desde un archivo JSON (`redirects.json`) que se sincroniza automáticamente con Payload CMS (plugin redirects) y Next.js (next.config.js).

### Flujo
1. Añades una redirección en `redirects.json`
2. Script `fetch-redirects.ts` la sincroniza con Payload CMS
3. Next.js la aplica en el servidor (301/302)
4. El plugin de Payload registra los hits de redirección

### Ejemplo `redirects.json`
```json
[
  { "source": "/old-url", "destination": "/new-url", "permanent": true },
  { "source": "/blog/2025/:slug", "destination": "/blog/:slug", "permanent": true }
]
```

---

## 6. Content Security Policy

Headers de seguridad preconfigurados:
- CSP con directivas para scripts, estilos, imágenes, fuentes
- HSTS con preload (max-age 2 años)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera/microphone/geolocation deshabilitados

---

## 7. Hreflang y Localización

### Qué hace
- Middleware detecta idioma del navegador y redirige a `/es` o `/en`
- Cada página tiene `link rel="alternate" hreflang` en el `<head>`
- URLs: `juan-tech.com/blog/post` (ES) y `juan-tech.com/en/blog/post` (EN)
- Sitemap incluye alternates hreflang

### Implementación
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const lang = request.cookies.get('lang')?.value
    || request.headers.get('accept-language')?.split(',')[0]?.split('-')[0]
    || 'es'

  if (!request.nextUrl.pathname.startsWith(`/${lang}`)) {
    return NextResponse.redirect(new URL(`/${lang}${request.nextUrl.pathname}`, request.url))
  }
}
```

---

## 8. Optimización de Imágenes

- `next/image` con `sizes` configurados por breakpoint
- Formatos AVIF y WebP automáticos (con fallback a JPEG/PNG)
- `placeholder="blur"` con blurhash generado
- `fetchpriority="high"` en hero images (LCP)
- `loading="lazy"` en imágenes below the fold
- Dimensiones explícitas para prevenir CLS

---

## 9. Core Web Vitals — Optimizaciones Out-of-the-Box

| Métrica | Target | Cómo se logra |
|---------|--------|---------------|
| LCP < 2.5s | Hero image | fetchpriority="high", AVIF, CDN, dimensiones explícitas |
| CLS < 0.1 | Layout stability | width/height en todas las imágenes, font-display: optional, skeleton loaders |
| INP < 200ms | Interactivity | Code splitting, dynamic imports para componentes pesados |

---

## 10. SEO Programático (Tier PRO)

Sistema para generar páginas a escala desde datos estructurados:

```typescript
// Ejemplo: generar páginas de referencia de algoritmos
export async function generateStaticParams() {
  const algorithms = await fetchAlgorithms()
  return algorithms.map(algo => ({
    slug: `${algo.name.toLowerCase().replace(/\s+/g, '-')}-in-${algo.language}`
  }))
}
```

Incluye templates predefinidos para:
- Páginas de comparación (X vs Y)
- Referencias de algoritmos por lenguaje
- Páginas de keywords (glosario)
