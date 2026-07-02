# 01 — Índice Completo del Ebook

> Este es el índice que iría en la página de producto de Gumroad y en las primeras páginas del ebook. Permite al comprador saber exactamente qué va a aprender.

---

## SEO Técnico para Desarrolladores
### Guía Completa de Optimización Técnica para Ingenieros de Software

**Autor:** Juan Carlos Angulo
**Páginas estimadas:** 180-220
**Formato:** PDF + EPUB

---

## PRÓLOGO — Por qué escribí este libro (2 páginas)

Mi historia: software engineer frustrado con los libros de SEO escritos para marketers. Cómo aprendí SEO técnico por mi cuenta y por qué decidí documentarlo para otros developers.

---

## PARTE 1: FUNDAMENTOS (40 páginas)

### Capítulo 1: Por qué el SEO técnico es cosa de developers
- La brecha entre SEOs y developers (y por qué es una oportunidad)
- Cómo Google rastrea, indexa y rankea — explicado para ingenieros
- El ciclo de vida de una página web en Google
- Las 3 etapas: Discovery → Indexing → Ranking
- Por qué el SEO técnico es el cimiento de todo lo demás
- **Caso real:** Cómo una mala configuración de robots.txt eliminó un sitio del índice

### Capítulo 2: Arquitectura web que Google entiende
- URLs limpias y jerarquía de contenido — reglas de diseño
- Estructura de directorios vs. estructura lógica
- Arquitectura plana vs. arquitectura profunda: cuándo usar cada una
- Breadcrumbs: más que navegación, son señales semánticas
- **Código:** Implementación de breadcrumbs con schema en Next.js
- **Caso real:** Cómo reorganizar 200 URLs sin perder tráfico

### Capítulo 3: Renderizado web y SEO
- CSR, SSR, SSG, ISR — qué significa cada uno para Googlebot
- El problema del JavaScript rendering: mitos y realidades
- Cómo Google renderiza JavaScript en 2026
- Estrategia de renderizado híbrido: qué renderizar y cómo
- **Código:** Configuración de Next.js App Router para cada estrategia
- **Caso real:** Hidratación y su impacto en SEO: antes y después
- Presupuesto de JavaScript: cómo medirlo y optimizarlo

---

## PARTE 2: AUDITORÍA TÉCNICA (55 páginas)

### Capítulo 4: Metodología de auditoría técnica
- El framework de auditoría de 5 fases
- Fase 1: Crawl — herramientas y configuración
- Fase 2: Index — análisis de cobertura en GSC
- Fase 3: Render — cómo Google ve tu página
- Fase 4: Rank — señales y factores
- Fase 5: Monitor — seguimiento continuo
- **Herramientas:** Google Search Console, Screaming Frog, Sitebulb, Lighthouse
- **Caso real:** Auditoría completa de un ecommerce mediano

### Capítulo 5: Core Web Vitals — La guía definitiva para developers
- **LCP (Largest Contentful Paint):**
  - Qué lo afecta: imágenes, fuentes, render-blocking resources
  - Estrategia de optimización de imágenes (AVIF, WebP, CDN, sizing)
  - `fetchpriority="high"` y precarga de recursos críticos
  - **Código:** Componente HeroImage optimizado para LCP en Next.js
- **CLS (Cumulative Layout Shift):**
  - Qué causa layout shifts: imágenes sin dimensiones, fuentes, ads, embeds
  - Estrategia explícita de dimensiones
  - `font-display` y `aspect-ratio`
  - **Código:** Componentes que previenen CLS
- **INP (Interaction to Next Paint):**
  - Long tasks, code splitting, web workers
  - **Código:** Dynamic imports y lazy loading en Next.js
- **TTFB:** Backend, database queries, CDN
- **Caso real:** De Lighthouse 45 a 95 en 2 semanas

### Capítulo 6: Schema.org y Datos Estructurados para Ingenieros
- JSON-LD vs Microdata vs RDFa — por qué JSON-LD es el estándar
- Tipos esenciales explicados con ejemplos:
  - Organization / Person: tu identidad en el Knowledge Graph
  - Article / BlogPosting / TechArticle: contenido indexable
  - BreadcrumbList: navegación semántica
  - FAQPage: dominar los rich results de preguntas
  - Product y Review (para ecommerce)
- Cómo Google valida el schema — herramientas y debugging
- **Código:** Sistema de schema dinámico en Next.js (un componente, múltiples tipos)
- **Código:** Validación automática de schema en CI/CD
- **Caso real:** Cómo FAQ schema aumentó el CTR en 37%

---

## PARTE 3: ESTRATEGIA DE CONTENIDO TÉCNICO (45 páginas)

### Capítulo 7: Topic Clusters — Arquitectura de autoridad
- El modelo Pillar-Satellite explicado con diagramas
- Cómo diseñar un cluster de contenido desde cero
- Mapeo de keywords a arquitectura de URLs
- **Código:** Script de internal linking automático (similitud semántica)
- Canibalización de keywords: cómo detectarla y resolverla
- **Caso real:** Cómo 1 pillar page + 7 satellites capturaron 50 keywords

### Capítulo 8: SEO On-Page para developers
- Title tags y meta descriptions: reglas de longitud, keywords, CTR
- **Código:** Generador dinámico de meta tags en Next.js
- Heading hierarchy (H1-H6): semántica, no decoración
- **Código:** Componente TableOfContents automático desde headings
- Imágenes: alt text, AVIF/WebP, lazy loading, dimensiones
- **Código:** Componente Image con SEO props
- Open Graph y Twitter Cards
- **Código:** Función generateMetadata() para App Router

### Capítulo 9: SEO Internacional
- Hreflang: qué es, cómo funciona, errores comunes
- Estrategia de dominios: ccTLD vs subdirectorio vs subdominio
- **Código:** Middleware de localización en Next.js (ES/EN)
- **Código:** Sitemap con alternates hreflang
- Canonical y hreflang: cómo no romperlos juntos
- **Caso real:** Configuración bilingüe de juan-tech.com

---

## PARTE 4: PERFORMANCE Y AUTOMATIZACIÓN (35 páginas)

### Capítulo 10: Automatización de SEO en CI/CD
- Lighthouse CI: medición de performance en cada PR
- **Código:** GitHub Action que corre Lighthouse y bloquea merges si el score baja
- Tests de SEO automatizados: meta tags, schema, sitemap, robots.txt
- **Código:** Playwright tests para validación SEO
- Monitoreo de Core Web Vitals en producción (integración GSC)

### Capítulo 11: Migraciones — Cómo cambiar de stack sin perder tráfico
- Checklist pre-migración (20 puntos)
- Mapeo de URLs viejas a nuevas
- **Código:** Script de generación de redirects desde CSV
- Estrategia de lanzamiento: staging → producción
- Monitoreo post-migración: qué métricas vigilar
- **Caso real:** Migración de WordPress a Payload CMS (juan-tech.com)

### Capítulo 12: El futuro: GEO y AI Overviews
- Qué es Generative Engine Optimization (GEO)
- Cómo los LLMs seleccionan fuentes para sus respuestas
- La estructura "Atomic Answer" para ser citado por IA
- E-E-A-T en la era de AI: qué cambia y qué permanece
- Tendencias 2026-2027: hacia dónde va el SEO técnico

---

## APÉNDICES (15 páginas)

### Apéndice A: Checklist de Lanzamiento SEO (1 página)
- 30-point checklist imprimible para lanzar cualquier sitio

### Apéndice B: Configuración de Referencia de next.config.js
- Archivo completo comentado línea por línea
- CSP headers, image optimization, redirects, rewrites

### Apéndice C: Plantillas de Schema JSON-LD (copiar y pegar)
- 10 plantillas listas para usar: Article, FAQ, Breadcrumb, Organization, Person, Product, Event, Recipe, HowTo, LocalBusiness

### Apéndice D: Glosario SEO Técnico ES↔EN
- 80+ términos

### Apéndice E: Recursos y Herramientas
- Lista curada de herramientas gratuitas y de pago
