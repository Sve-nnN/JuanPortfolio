# Auditoría de rendimiento / Core Web Vitals — juan-tech.com

Fecha: 2026-07-02
Alcance: home móvil + desktop (Next.js 15 en Vercel, bilingüe es/en)
Autor: agente Web Performance (Core Web Vitals)

## 0. Nota metodológica (importante)

No se pudo correr PageSpeed Insights fresco en esta sesión:

- El endpoint anónimo de la PSI API (`runPagespeed` sin API key) devolvió **HTTP 429 en los 18 intentos** (IP con rate limit agresivo para llamadas sin clave).
- No hay Chrome/Chromium instalado en esta máquina, así que tampoco se pudo correr Lighthouse CLI local.
- La CrUX API también exige API key.

En lugar de inventar números, esta auditoría combina:

1. Los valores de laboratorio que ya trae el reporte del team-lead (Lighthouse: Performance 79, LCP 4446 ms, INP no disponible, CLS 0, TTFB 8 ms).
2. **Análisis directo del HTML y de los recursos servidos en vivo** (descarga real de `https://juan-tech.com/`, medición de pesos de CSS/JS/imagen, cabeceras HTTP, y lectura del código fuente del hero y el layout).

Acción pendiente para Juan: para números de campo reales conviene correr PSI con una API key de Google (`&key=...`) o abrir el dashboard de **Vercel Speed Insights**, que ya está instalado en el sitio (ver sección INP).

## 1. Score de performance actual

| Estrategia | Performance (lab) | Fuente |
|---|---|---|
| Mobile | 79 | Reporte team-lead (Lighthouse) |
| Desktop | no medido esta sesión (típicamente 90+ por menos throttling de CPU/red) | — |

Datos de laboratorio de referencia (mobile): LCP 4446 ms (POBRE, meta ≤2500 ms), CLS 0 (BUENO), TTFB 8 ms (BUENO), INP no disponible.

## 2. Elemento LCP exacto y desglose

**Elemento LCP en móvil:** el `<h1>` del hero, texto "Ingeniería de Software aplicada al SEO Técnico".

- En el HTML servido aparece como `<h1 class="font-display font-extrabold ... text-6xl ..." style="opacity:1;transform:translateY(24px)">`. En móvil es `text-6xl` (enorme, multilínea), así que es el paint contentful más grande del primer viewport.
- Ya se pinta **visible en el SSR** (`opacity:1`), fix de la milestone CWV v1.1 (ver comentario en `src/blocks/HeroHome/Component.tsx:30`). Bien.
- Fuente: `font-display` → `var(--font-array)` (Array), confirmado en `tailwind.config.js:114`. Array se sirve local con `display: swap` y `preload: true` (`src/app/(frontend)/layout.tsx:38`).

**Elemento LCP en desktop:** el retrato AVIF (`juan-angulo-portrait.avif`, contenedor `lg:w-[35rem]`). En móvil la imagen queda por debajo del pliegue (el texto del hero ocupa el primer viewport), por eso en móvil el LCP es el H1.

**Desglose de timing (medido en vivo, no throttled):**

| Subparte LCP | Valor observado | Comentario |
|---|---|---|
| TTFB | 8 ms edge (Vercel HIT) / ~650 ms origin sin cache | No es el cuello de botella |
| Resource load delay | bajo | La imagen LCP tiene `preload` + `fetchPriority=high` |
| Resource load time (imagen) | ~330 ms para el AVIF de 25 KB | Imagen muy bien optimizada, no es el problema |
| **Element render delay** | **dominante (~el resto hasta 4446 ms)** | Aquí está el 90% del costo |

Conclusión: el LCP NO está limitado por servidor ni por peso de imagen. Está limitado por **render delay**: contención del hilo principal durante la ventana de LCP.

## 3. Por qué el LCP es 4.4 s pese a TTFB 8 ms

El TTFB de 8 ms es el edge de Cloudflare/Vercel; no tiene relación con el LCP. Las causas reales del render delay, en orden de impacto:

| # | Causa (recurso/elemento concreto) | Evidencia |
|---|---|---|
| 1 | **JavaScript pesado**: 27 chunks JS, ~325 KB comprimidos (~1 MB+ parseado) cargando en la home. En el lab móvil (CPU 4x + slow 4G) esto genera tareas largas que saturan el hilo principal justo en la ventana del LCP. | Medición: 27 `.js` en el HTML, 333.748 bytes comprimidos sumados |
| 2 | **Cloudflare Rocket Loader activo delante de Vercel**: se inyecta `/cdn-cgi/scripts/.../rocket-loader.min.js` y reescribe scripts. Rocket Loader difiere/reordena la ejecución de JS y es conocido por degradar LCP e INP. NO es config de Next/Vercel, es un ajuste del panel de Cloudflare. | `server: cloudflare` + `cf-ray` en cabeceras; script rocket-loader presente en el HTML |
| 3 | **5 fuentes woff2 en preload** (Array ×3 pesos + Geist Sans + Geist Mono) compiten por ancho de banda con el preload de la imagen LCP en slow 4G. | 5 `<link rel=preload as=font>` en el `<head>` |
| 4 | **Todo el hero es client component** (`'use client'` + framer-motion `LazyMotion` + `useScroll`/`useTransform`). Aunque el SSR pinta el H1, la hidratación de todo el hero y los listeners de scroll añaden trabajo de hilo principal; el H1 arrastra `transform:translateY(24px)` inline hasta que hidrata. | `src/blocks/HeroHome/Component.tsx:1,8,24-28,58` |
| 5 | **HTML no cacheado en Cloudflare** (`cf-cache-status: DYNAMIC`, `cache-control: max-age=0, must-revalidate`): cada request revalida contra origin. Con Vercel HIT sale barato, pero añade variabilidad. | Cabeceras HTTP |

Nota: el CSS es minúsculo (3 archivos, ~17 KB gzip total), así que el render-blocking de CSS NO es el problema. El problema es el JS y Rocket Loader.

## 4. INP: por qué "no disponible" y cómo medirlo

**Por qué no aparece:** INP es una métrica de campo (CrUX), no de laboratorio. Lighthouse/PSI no pueden medir INP en modo lab porque requiere interacciones reales de usuarios. El origen `juan-tech.com` **no tiene suficiente tráfico de Chrome real** para entrar en el dataset de CrUX (CrUX necesita un mínimo de muestras para publicar el p75 de 28 días). Por eso PSI muestra INP "no disponible" en la sección de datos de campo.

**Cómo medirlo ya (sin esperar a CrUX):**

- **Vercel Speed Insights ya está instalado** (`<SpeedInsights/>` en `src/app/(frontend)/layout.tsx:122`). Da INP/LCP/CLS de RUM real. Acción para Juan: abrir el dashboard de Speed Insights en Vercel y revisar el p75 de INP por ruta.
- `@vercel/analytics` también está montado (línea 123).
- Opcional: añadir la librería `web-vitals` con attribution y enviar a GA4 (vía el dataLayer que ya existe) para desglosar qué interacción dispara el INP alto.

**Para llegar a pasar en CrUX:** hace falta más tráfico real + mantener INP ≤200 ms. Los fixes de las secciones 3 y 5 (menos JS, quitar Rocket Loader) mejoran directamente el INP.

## 5. Top oportunidades (ahorro estimado)

| # | Oportunidad | Valor medido | Causa | Fix propuesto | Impacto estimado |
|---|---|---|---|---|---|
| 1 | Desactivar Cloudflare Rocket Loader | rocket-loader.min.js inyectado en cada carga | Ajuste ON en panel Cloudflare delante de Vercel | Panel Cloudflare → Speed → Optimization → **Rocket Loader = Off**. Verificar que scripts Next no queden reescritos. | LCP -300 a -800 ms, mejora directa de INP/TBT |
| 2 | Reducir/diferir JS de la home | 27 chunks, ~325 KB gzip | Bloques below-the-fold y framer-motion entran en el bundle inicial | `next/dynamic` (ssr:false o lazy) para bloques por debajo del pliegue (Testimonials, FeaturedBlog, Contact, etc.); aislar framer-motion. | LCP -500 a -1500 ms, baja TBT |
| 3 | Recortar preloads de fuentes | 5 woff2 en preload | Array ×3 + Geist Sans + Geist Mono todos con preload | Preload solo el peso del H1 (Array Bold/Extrabold). Poner `preload:false` en Geist Sans/Mono si no son above-the-fold, igual que ya se hizo con Khand. | LCP -100 a -300 ms (libera banda para la imagen) |
| 4 | Convertir el hero a server component | Hero entero es `'use client'` | `useScroll`/`useTransform`/`LazyMotion` fuerzan client en todo el bloque | Extraer solo la animación a un wrapper cliente pequeño; dejar H1, subtítulo y CTAs como server. El H1 (LCP) deja de depender de la hidratación del hero. | LCP -200 a -500 ms, mejora INP |
| 5 | Cachear el HTML en el edge | `cf-cache-status: DYNAMIC` | Cloudflare no cachea el documento | Cache Rule en Cloudflare para cachear el HTML de rutas públicas (respetando el ISR de Next), o servir directo desde Vercel sin proxy CF si no aporta. | TTFB/consistencia; -50 a -200 ms en p75 |

## 6. JS sin usar / legacy / render-blocking (issue #69)

- **Volumen:** 27 chunks JS, ~325 KB comprimidos en la home. Es el principal costo de render y de TBT/INP.
- **Legacy:** hay `polyfills-*.js` en la carga (Next lo sirve para navegadores viejos). Si el target de navegadores es moderno, se puede reducir vía `browserslist` para bajar el polyfill.
- **framer-motion:** biblioteca pesada. Ya se usa `LazyMotion` con `domAnimation` (bien), pero `useScroll`/`useTransform` en el hero arrastran más runtime al bundle inicial. Considerar animar con CSS puro (transform/opacity) el entrance del hero y reservar framer-motion solo para interacciones que lo necesiten.
- **Rocket Loader** (sección 3/5) actúa como capa "legacy" que reescribe y difiere scripts: quitarlo simplifica el critical path.
- **GTM** se precarga como script (`gtm.js` en preload). Ahrefs analytics ya está en `lazyOnload` (bien, `layout.tsx:135`). Revisar que GTM no dispare tags pesados en el critical path.

## 7. Estado por métrica (resumen)

| Métrica | Estado | Nota |
|---|---|---|
| LCP | FALLA (4446 ms, meta ≤2500) | Render delay por JS + Rocket Loader; imagen y CSS ya están bien |
| INP | Sin dato de campo | Medir con Vercel Speed Insights (ya instalado) |
| CLS | PASA (0) | Sin regresiones; dimensiones de imagen reservadas |
| TTFB | PASA (8 ms edge) | No es la causa del LCP alto |

## 8. Prioridad de ejecución sugerida

1. Rocket Loader OFF en Cloudflare (rápido, alto impacto, cero código).
2. `next/dynamic` para bloques below-the-fold (mayor recorte de JS).
3. Recortar preloads de fuentes.
4. Hero: aislar la animación cliente del H1.
5. Abrir Vercel Speed Insights para tener INP real y validar los fixes contra campo.
