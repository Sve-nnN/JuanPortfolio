# Roadmap: JuanPortfolio — Milestone v1.0 (issue #20 ISR/CWV)

## Overview

Este roadmap convierte el sitio de renderizado dinámico a estático/ISR en 5 fases. Empieza por la fundación estructural (nuevo `[locale]/layout.tsx` y limpieza del root), luego migra la home ES a ese árbol, aísla `draftMode()` para proteger el live preview de Payload, activa ISR en las plantillas, y termina verificando que el SEO técnico y el routing no sufrieron regresiones.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Nuevo [locale]/layout.tsx** - Crear el layout con locale por param y limpiar el root layout de dynamic APIs
- [ ] **Phase 2: Migración de la Home ES** - Mover la home al nuevo árbol `[locale]` y eliminar `(frontend)/page.tsx`
- [ ] **Phase 3: Aislamiento de draftMode** - Sacar `draftMode()`/`headers()` del render publicado sin romper el live preview
- [ ] **Phase 4: Activación de ISR** - Declarar `revalidate` y confirmar que el build clasifica las rutas como estáticas/ISR
- [ ] **Phase 5: QA & Verificación** - Confirmar que SEO técnico, routing y sitemaps siguen intactos

## Phase Details

### Phase 1: Nuevo [locale]/layout.tsx
**Goal**: El árbol `[locale]` tiene su propio layout que recibe el locale por param (sin `headers()`), y el root layout queda libre de todas las dynamic APIs
**Depends on**: Nothing (first phase)
**Requirements**: ROUTE-01, LOCALE-01, LOCALE-02, LOCALE-03, PREVIEW-01
**Success Criteria** (what must be TRUE):
  1. Existe `src/app/(frontend)/[locale]/layout.tsx` que recibe `params.locale`, carga siteSettings y envuelve children en LocaleProvider + Header + Footer
  2. El root layout no contiene llamadas a `headers()` ni a `draftMode()`; `<html lang="es">` está fijo por defecto
  3. En la ruta `/en/*`, el componente cliente corrige `<html lang>` a `en` via `useEffect` (verificable en DevTools)
  4. Header y Footer renderizan textos en el idioma correcto al visitar rutas `/en/*` (tomando locale del param, no de headers)
  5. `next build` local no reporta ninguna llamada a dynamic APIs desde el root layout o el `[locale]/layout.tsx`
**Plans**: TBD
**UI hint**: yes

### Phase 2: Migración de la Home ES
**Goal**: La home española (`/`) se sirve desde el nuevo `[locale]/layout.tsx` con `locale=es`, y el archivo `(frontend)/page.tsx` queda eliminado
**Depends on**: Phase 1
**Requirements**: ROUTE-02, ROUTE-03
**Success Criteria** (what must be TRUE):
  1. Visitar `/` muestra la home con Header y Footer en español, sin redirect visible al usuario
  2. Existe `src/app/(frontend)/[locale]/page.tsx` que sirve la home ES con `locale=es` y hereda el chrome del nuevo layout
  3. El archivo `src/app/(frontend)/page.tsx` no existe en el repositorio
  4. El middleware reescribe internamente `/` → `/es` (sin 301 al usuario; confirmado en logs de Vercel o `next dev`)
**Plans**: TBD

### Phase 3: Aislamiento de draftMode
**Goal**: Las 4 plantillas de contenido no llaman `draftMode()` ni `headers()` en el path de render publicado; el live preview de Payload sigue mostrando borradores
**Depends on**: Phase 1
**Requirements**: PREVIEW-02, PREVIEW-03
**Success Criteria** (what must be TRUE):
  1. Ninguna de las 4 plantillas (`[locale]/[slug]`, `blog`, `blog/[category]/[slug]`, `case-studies/[slug]`) llama `draftMode()` o `headers()` en el render publicado (verificable por grep o build trace)
  2. Un editor autenticado en Payload admin puede ver el borrador en live preview sin errores ni pantalla en blanco
  3. `draftMode()` queda activo exclusivamente en un subárbol dinámico que solo se inicializa cuando la cookie de preview está presente
**Plans**: TBD

### Phase 4: Activación de ISR
**Goal**: Home y plantillas de contenido se marcan con `revalidate = 3600` y el build confirma que ninguna ruta queda clasificada como dinámica
**Depends on**: Phase 3
**Requirements**: CACHE-01, CACHE-02, CACHE-03
**Success Criteria** (what must be TRUE):
  1. Las 4 plantillas de contenido tienen `export const revalidate = 3600` (o valor configurado equivalente)
  2. `next build` muestra `○` (static) o `●` (ISR) para la home y todas las plantillas de contenido — cero `ƒ` (dynamic) en esas rutas
  3. En producción, una petición a `/` tras el primer acceso (warm-up) devuelve el header `x-vercel-cache: HIT`
  4. En producción, un post devuelve `cache-control` sin `no-store` ni `private`
**Plans**: TBD

### Phase 5: QA & Verificación
**Goal**: El SEO técnico, el routing bilingüe y los sitemaps siguen funcionando sin regresiones tras los cambios estructurales
**Depends on**: Phase 4
**Requirements**: QA-01, QA-02, QA-03
**Success Criteria** (what must be TRUE):
  1. Las URLs `/` y `/en/` contienen hreflang y canonical correctos en el HTML entregado (verificable con `curl` o DevTools)
  2. El switcher de idioma funciona en home, posts y case studies sin errores 404 ni loops de redirect
  3. `/sitemap.xml` responde HTTP 200 y los sitemaps XML listan las URLs correctas para ambos idiomas
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Nuevo [locale]/layout.tsx | 1/1 | ✅ Complete | 2026-06-23 |
| 2. Migración de la Home ES | 1/1 | ✅ Complete | 2026-06-23 |
| 3. Aislamiento de draftMode | 1/1 | ✅ Complete (preview: human post-deploy) | 2026-06-23 |
| 4. Activación de ISR | 1/1 | ✅ Complete (vercel-cache: human post-deploy) | 2026-06-23 |
| 5. QA & Verificación | 1/1 | ✅ Complete | 2026-06-23 |

**Milestone v1.0: code-complete y verificado localmente (next build + next start + curl).**
Pendiente de verificación humana post-deploy: `x-vercel-cache: HIT` real y live preview de Payload.
