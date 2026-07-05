---
phase: 52-nav-agrupada-del-admin
plan: 52
subsystem: payload-admin
tags: [admin-ui, nav, i18n, payload]
requires: []
provides:
  - "src/utilities/adminGroups.ts (ADMIN_GROUP — única fuente de verdad de labels bilingües)"
  - "admin.group bilingüe { es, en } en todas las colecciones, globals y colecciones de plugins"
affects:
  - "sidebar del admin de Payload (agrupación visual en 4 grupos)"
tech-stack:
  added: []
  patterns:
    - "admin.group como objeto localizado { es, en } (payload 3.61.1)"
    - "constantes de grupo centralizadas importadas en cada config"
key-files:
  created:
    - src/utilities/adminGroups.ts
  modified:
    - src/collections/Pages/index.ts
    - src/collections/Posts/index.ts
    - src/collections/Categories.ts
    - src/collections/Media.ts
    - src/globals/Home/config.ts
    - src/globals/BlogListing/config.ts
    - src/globals/CaseStudiesListing/config.ts
    - src/globals/SiteSettings/index.ts
    - src/Header/config.ts
    - src/Footer/config.ts
    - src/globals/Styles/config.ts
    - src/globals/LLM/config.ts
    - src/globals/Robots/config.ts
    - src/collections/Users/index.ts
    - src/collections/KeywordMetrics.ts
    - src/collections/PageMetrics.ts
    - src/collections/GSCMetrics.ts
    - src/collections/BrokenLinks.ts
    - src/collections/Works/index.ts
    - src/collections/CaseStudies/index.ts
    - src/collections/Clientes/index.ts
    - src/collections/Testimonials.ts
    - src/collections/AdBanners/index.ts
    - src/plugins/index.ts
decisions:
  - "LLM y Robots pasan de group:'SEO' (string) a grupo Sitio (no a SEO/Métricas), per CONTEXT"
  - "Se crearon bloques admin top-level donde no existían (5 configs), no solo se añadió la key"
metrics:
  duration: "~25 min"
  completed: 2026-07-05
---

# Phase 52 Plan 52: Nav agrupada del admin Summary

Agrupación bilingüe (es/en) de todo el sidebar del admin de Payload en 4 grupos (Contenido / Marketing / SEO-Métricas / Sitio) vía `admin.group`, con una única fuente de verdad en `src/utilities/adminGroups.ts` importada en las ~24 configs y en los 4 overrides de plugin. Sin cambios de datos, schema ni rutas.

## Qué se hizo

- **Task 1:** Nuevo `src/utilities/adminGroups.ts` con `ADMIN_GROUP` (4 constantes `{ es, en }`: CONTENIDO, SITIO, SEO, MARKETING), tipado `as const satisfies Record<string, Record<string, string>>`. Módulo hoja sin imports.
- **Task 2 — Contenido (7):** Pages, Posts, Categories, Media + globals Home, BlogListing, CaseStudiesListing.
- **Task 3 — Sitio (7):** SiteSettings, Header, Footer, Styles, LLM, Robots, Users. LLM y Robots reemplazan el string `group: 'SEO'` por `ADMIN_GROUP.SITIO`.
- **Task 4 — SEO/Métricas (4):** KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks (reemplazo del string `'SEO'`).
- **Task 5 — Marketing (5):** Works, CaseStudies, Clientes, Testimonials, AdBanners.
- **Task 6 — Plugins:** redirectsPlugin `overrides.admin.group=SEO`; formBuilderPlugin `formOverrides.admin.group=MARKETING` + nuevo `formSubmissionOverrides.admin.group=MARKETING`; searchPlugin `searchOverrides.admin.group=MARKETING`.
- **Task 7 — Gate:** `pnpm generate:types` corre limpio sin cambios de schema (diff vacío en `payload-types.ts`). `tsc --noEmit` con 0 errores en `src/`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Faltaba bloque `admin:` top-level en 5 configs (el plan asumía que todos lo tenían)**
- **Found during:** Tasks 2 y 3.
- **Issue:** El plan afirmaba que los 7 configs de Contenido y Header/Footer ya tenían bloque `admin:` de nivel superior. En realidad los globals **Home, BlogListing, CaseStudiesListing** y los globals **Header, Footer** solo tenían `slug`/`access`/`fields` (los `admin:` que aparecían estaban dentro de campos, no a nivel top). El plan solo había listado explícitamente SiteSettings y Styles como "sin bloque admin".
- **Fix:** Se creó el bloque `admin: { group: ... }` top-level en esos 5 configs adicionales (además de SiteSettings y Styles), no solo se añadió la key.
- **Files modified:** Home/config.ts, BlogListing/config.ts, CaseStudiesListing/config.ts, Header/config.ts, Footer/config.ts.
- **Commits:** bb2cf95 (Contenido), 35c1010 (Sitio).

**2. [Rule 3 - Blocking] Import de `ADMIN_GROUP` faltante en Robots y Users**
- **Found during:** Task 7 (`generate:types` falló con `ReferenceError: ADMIN_GROUP is not defined` en Users).
- **Issue:** En Robots y Users se editó el bloque `admin.group` pero no se añadió la línea de import correspondiente.
- **Fix:** Se añadió `import { ADMIN_GROUP } from '@/utilities/adminGroups'` en ambos; `generate:types` vuelve a correr limpio.
- **Files modified:** src/globals/Robots/config.ts, src/collections/Users/index.ts.
- **Commit:** 503f65e.

## Verification

- `pnpm generate:types`: OK, sin cambios en `src/payload-types.ts` (esperado — `admin.group` no altera schema).
- `pnpm exec tsc --noEmit`: **0 errores en `src/`**. Quedan 114 errores pre-existentes, todos en `tests/` (tipos de `KeywordData`, `SeoAdapter`, mocks de crawler/sitemap), sin relación con esta fase ni con ningún archivo tocado. Out of scope per scope boundary. No se corrió `pnpm build` (innecesario; `src/` typecheck limpio).
- `grep -rn "group: 'SEO'" src/`: sin resultados (todos los strings viejos reemplazados).
- Distribución final: Contenido 7, Sitio 7, SEO/Métricas 4+Redirects, Marketing 5+Forms/FormSubmissions/Search.

## Needs human eyes (checkpoint /admin — no ejecutado en run autónomo)

El plan define un `checkpoint:human-verify` (blocking) que requiere abrir la UI. Pendiente de verificación visual de Juan:
1. `pnpm dev` → http://localhost:3000/admin.
2. Confirmar exactamente 4 grupos en el sidebar: **Contenido, Marketing, SEO/Métricas, Sitio** (orden alfabético en español, esperado per CONTEXT).
3. Confirmar que ninguna sección queda suelta — revisar especialmente Redirects, Forms, Form Submissions, Search, Users, Styles, Site Settings (las de plugin/las que no tenían grupo antes).
4. (Opcional) Cambiar el idioma del admin a inglés y verificar labels Content / Site / SEO & Metrics / Marketing.

## Self-Check: PASSED

- Archivos creados: `src/utilities/adminGroups.ts` FOUND.
- Commits: bb2cf95, 35c1010, 28e8898, ec41d79, 4a473b3, 503f65e — todos presentes en git log.
- `generate:types` sin diff de schema; `tsc` limpio en `src/`.
