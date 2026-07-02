# Producto 2: Next.js + Payload CMS Starter Kit

> **Prioridad:** 🔴 ALTA
> **Ingreso potencial:** $1,000 – $5,000 USD/mes
> **Esfuerzo inicial:** 25-30 horas
> **Mantenimiento:** Bajo (actualizar dependencias cada 3-6 meses)
> **Precio sugerido:** $49 – $299 USD (según tier)

---

## 1. Descripción del Producto

Un repositorio template de Next.js 15 + Payload CMS 3.0 preconfigurado con todo lo necesario para lanzar un blog técnico o sitio de contenido con SEO técnico de clase mundial. Es el stack exacto que usa juan-tech.com, empaquetado y documentado para que cualquier developer lo implemente en minutos.

### ¿Por qué funciona?

- **Payload CMS tiene 1,800 búsquedas/mes en US con KD 2** → alta demanda, poca competencia
- **No existe un starter kit bilingüe bien documentado** para Next.js + Payload CMS
- **El mercado de headless CMS crece 22% anual** — cada vez más devs migran de WordPress
- **Payload CMS 3.0 es nuevo** (2024-2025) — poca documentación comunitaria, los early movers capturan autoridad
- **juan-tech.com es la prueba viviente** de que el stack funciona: el blog es el case study del producto

### Ventaja competitiva

A diferencia de otros starters genéricos, este incluye **SEO técnico preconfigurado**: meta tags dinámicos, schema JSON-LD, sitemaps automatizados, robots.txt, redirecciones, Content-Security-Policy, optimización de imágenes, Core Web Vitals. Ningún otro starter en el mercado de Payload CMS ofrece esto.

---

## 2. Estructura del Producto (3 Tiers)

### Tier 1: "Starter Kit Básico" — $49 USD

#### Contenido del repositorio

```
juan-tech-starter/
├── README.md                     # Guía de instalación completa
├── package.json                  # Dependencias preconfiguradas
├── next.config.js                # Next.js 15 optimizado
├── tsconfig.json                 # TypeScript estricto
├── tailwind.config.js            # Tailwind CSS con tema personalizado
├── .env.example                  # Variables de entorno documentadas
├── docker-compose.yml            # MongoDB + App para desarrollo local
├── src/
│   ├── app/
│   │   ├── (frontend)/
│   │   │   ├── layout.tsx        # Layout raíz con metadata dinámica
│   │   │   ├── page.tsx          # Homepage
│   │   │   └── [slug]/page.tsx   # Páginas dinámicas
│   │   └── (payload)/
│   │       └── ...               # Payload CMS admin
│   ├── components/
│   │   ├── JsonLd.tsx            # Schema.org JSON-LD (Person, BlogPosting, FAQ)
│   │   ├── Meta.tsx              # Meta tags dinámicos (OG, Twitter, canonical)
│   │   ├── Header.tsx            # Navegación con breadcrumbs
│   │   └── Footer.tsx
│   ├── collections/
│   │   ├── Posts.ts              # Colección Posts con campos SEO
│   │   ├── Categories.ts         # Categorías con soporte bilingüe
│   │   └── Media.ts              # Media con optimización de imágenes
│   ├── fields/
│   │   └── seoFields.ts          # Campos SEO reutilizables (meta, schema, etc.)
│   ├── hooks/
│   │   └── revalidateOnChange.ts # ISR automático al publicar
│   ├── utilities/
│   │   ├── generateMeta.ts       # Generador de metadatos para Next.js
│   │   ├── generateSchema.ts     # Generador de JSON-LD
│   │   └── formatDate.ts         # Utilidades de formato
│   ├── middleware.ts             # Localización ES/EN preconfigurada
│   └── payload.config.ts         # Payload CMS configurado
├── scripts/
│   └── seed.ts                   # Script para poblar datos de ejemplo
└── docs/
    ├── DEPLOY.md                 # Guía de deploy (Vercel + MongoDB Atlas)
    ├── SEO.md                    # Documentación de todas las features SEO
    └── CUSTOMIZATION.md          # Cómo personalizar colores, fuentes, layout
```

#### Qué incluye

- **Bilingüe ES/EN preconfigurado** con middleware de localización
- **SEO técnico completo:**
  - Meta tags dinámicos (title, description, OG, Twitter Cards)
  - Schema.org JSON-LD automático: Person, BlogPosting, BreadcrumbList, FAQPage
  - Sitemap XML auto-generado con `next-sitemap`
  - Robots.txt con reglas óptimas
  - Canonical URLs automáticas
  - Content-Security-Policy headers
- **Rendimiento optimizado:**
  - Imágenes con next/image, AVIF/WebP automático
  - Tailwind CSS con purge
  - Bundle splitting optimizado
  - LCP < 2.5s out of the box
- **Payload CMS 3.0 configurado:**
  - Colecciones Posts y Categories con todos los campos necesarios
  - Plugin SEO, redirects, nested docs
  - Admin bar para preview
- **MongoDB con Docker** para desarrollo local
- **Guía de deploy en Vercel** paso a paso (30 min para tener el sitio live)

---

### Tier 2: "Starter Kit PRO" — $149 USD

Incluye todo lo del Tier 1, más:

- **Content Sync Pipeline:** Scripts para sincronizar Markdown ↔ Payload CMS (lo que usa juan-tech.com)
- **Internal Linking Automático:** Script que analiza el contenido y sugiere enlaces internos basados en similitud semántica
- **Programmatic SEO Engine:** Sistema para generar páginas programáticas (ej. `/reference/merge-sort-python`) con templates predefinidos
- **Analytics Dashboard:** Integración con Vercel Analytics + Google Search Console API
- **Email Collection:** Sistema de newsletter con Resend integrado
- **Redirect Manager:** Script para gestionar redirecciones desde un JSON
- **1 hora de consultoría incluida** (sesión de setup guiada)

---

### Tier 3: "Starter Kit ENTERPRISE" — $299 USD

Incluye todo lo del Tier 2, más:

- **Multi-tenant ready:** Configuración para manejar múltiples sitios desde una instancia de Payload
- **CI/CD Pipeline:** GitHub Actions para deploy automático en Vercel
- **Testing Suite:** Tests e2e con Playwright + tests de integración con Vitest
- **Performance Budget Enforcement:** Lighthouse CI configurado para rechazar PRs que degraden performance
- **3 horas de consultoría incluida** (setup + estrategia de contenido + revisión técnica)

---

## 3. Pricing y Proyección de Ventas

| Tier | Precio | Ventas/mes (conservador) | Ventas/mes (optimista) |
|------|--------|--------------------------|-------------------------|
| Básico | $49 | 10-20 | 40-60 |
| PRO | $149 | 3-8 | 15-25 |
| ENTERPRISE | $299 | 1-3 | 5-10 |
| **Ingreso total** | | **$1,200-4,200** | **$5,700-14,000** |

---

## 4. Canales de Distribución

### Principal: GitHub
- Repositorio público con README optimizado para SEO
- GitHub Marketplace (si está disponible para este tipo de template)
- Estrellas y forks como prueba social

### Secundario: Gumroad
- Página de producto con screenshots, video demo y documentación
- Código de acceso al repositorio privado entregado tras compra

### Terciario: Payload CMS Community
- Publicar en el Discord de Payload CMS
- Listarse en payloadcms.com/templates (si Payload lanza marketplace)
- Escribir guest post en el blog oficial de Payload

### Cuarto: Contenido orgánico
- Artículo: "How to Build a Payload CMS Blog with Perfect SEO" → CTA al starter kit
- Artículo: "Next.js + Payload CMS: The Ultimate Stack for Technical SEO"
- YouTube tutorial gratuito mostrando el setup → CTA para descargar el kit completo

---

## 5. Marketing y Promoción

### Pre-lanzamiento (2 semanas antes)
- Publicar 2-3 artículos sobre Payload CMS y Next.js SEO en el blog
- Compartir screenshots del starter en Twitter/X y LinkedIn
- Publicar un hilo en r/nextjs y r/PayloadCMS sobre el stack

### Lanzamiento
- Publicar el repositorio en GitHub + producto en Gumroad
- Artículo flagship: "I Built a Next.js + Payload CMS Starter Kit with Perfect SEO — Here's How"
- Video YouTube: "Build a SEO-Optimized Blog with Next.js + Payload CMS in 30 Minutes"
- Publicar en Hacker News (Show HN)

### Post-lanzamiento (mantener momentum)
- Responder issues y PRs en GitHub → construir comunidad
- Actualizar el starter kit con nuevas features de Next.js y Payload
- Escribir artículos de "cómo migrar de WordPress a Payload CMS" → CTA al starter

---

## 6. Plan de Acción (Paso a Paso)

### Semana 1: Extracción y limpieza (10h)
1. Clonar juan-tech.com en un repo aparte
2. Remover contenido específico (artículos, imágenes personales)
3. Generalizar configuración (variables de entorno, nombres)
4. Escribir `.env.example` con documentación clara
5. Limpiar dependencias innecesarias

### Semana 2: Documentación (10h)
1. Escribir README.md con:
   - Requisitos previos (Node 20+, Docker, MongoDB)
   - Instalación paso a paso (5-10 min para tener el sitio local)
   - Explicación de cada feature SEO
   - Guía de personalización
2. Escribir DEPLOY.md (Vercel + MongoDB Atlas)
3. Escribir SEO.md (documentación detallada de cada feature)
4. Grabar video demo de 3-5 minutos

### Semana 3: Empaquetado y lanzamiento (10h)
1. Crear página de producto en Gumroad con descripción completa
2. Crear repositorio en GitHub (privado, acceso por compra)
3. Publicar artículo flagship en juan-tech.com
4. Lanzar en redes sociales, Reddit, Hacker News

---

## 7. Mantenimiento

- **Frecuencia:** Cada 3-6 meses
- **Tareas:**
  - Actualizar dependencias (Next.js, Payload CMS, Tailwind)
  - Verificar compatibilidad con nuevas versiones
  - Responder issues en GitHub (1-2h/semana)
  - Actualizar documentación si hay breaking changes
- **Tiempo estimado:** 3-5 horas por actualización

---

## 8. Métricas de Éxito

| Métrica | Mes 1 | Mes 3 | Mes 6 |
|---------|-------|-------|-------|
| Ventas totales | 5-15 | 30-60 | 80-150 |
| Ingreso acumulado | $300-1,500 | $2,000-6,000 | $6,000-20,000+ |
| GitHub stars | 50-100 | 200-500 | 500-1,000+ |
| Menciones externas | 2-3 | 10-15 | 25+ |
