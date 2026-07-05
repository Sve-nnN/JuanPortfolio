---
gsd_state_version: 1.0
milestone: v1.9
milestone_name: Estandarización del admin de Payload
status: in-progress
last_updated: "2026-07-05T23:00:00.000Z"
last_activity: 2026-07-05
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 2
  completed_plans: 2
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-26)

**Core value:** Páginas públicas rápidas y cacheables desde el edge; el SEO técnico no emite basura que degrade indexación. Para v1.5: el admin de Payload solo contiene código vivo y coherente.
**Current focus:** Milestone v1.9 — estandarización del admin de Payload: nav agrupada, migración de globals singleton (Home/BlogListing/CaseStudiesListing) a la colección `Pages`, colección Authors, limpieza de globals. Roadmap creado (fases 52-59), listo para planear Phase 52. v1.8 shipped 2026-07-05. v1.7 parkeada (39/41 hechas; 38/40/42/43 abiertas para Juan).

## Current Position

Phase: 54 (Migración del listado de blog a Pages) — next
Plan: —
Status: Phase 53 completada (5/5 en código; smoke create/duplicate diferido). PAGES-01/02 done.
Last activity: 2026-07-05 — Phase 53 (fundación Pages: beforeDuplicate slug/title) ejecutada y verificada

## Milestone v1.9 — Estructura de fases

Numeración CONTINÚA tras v1.8 (que terminó en Phase 51). Requirements PAGES-01..06, NAV-01..05, AUTHORS-01..03, CLEAN-01..02, QA-01..04 (`.planning/REQUIREMENTS.md`). Orden de build: nav (bajo riesgo, valor visible rápido) → fundación de Pages (crear/duplicar) → listados de blog/case studies (validan el patrón) → Authors (paralelo, tras nav) → Home (mayor riesgo, al final) → retiro de globals + limpieza → QA final.

| Phase | Goal | Requirements | Gate |
|-------|------|--------------|------|
| 52 | Nav agrupada del admin (Contenido/Sitio/SEO-Métricas/Marketing) | NAV-01..05 | Ninguno — solo `admin.group`, bajo riesgo |
| 53 | Fundación de la colección Pages (crear/duplicar página) | PAGES-01, PAGES-02 | Ninguno |
| 54 | Migración del listado de blog a Pages | PAGES-04 | QA de render/SEO (paridad visual + ISR + hreflang) |
| 55 | Migración del listado de case studies a Pages | PAGES-05 | QA de render/SEO (paridad visual + ISR + hreflang) |
| 56 | Colección Authors (relación con Posts, author page, sitemap) | AUTHORS-01..03 | Confirmar cómo se resuelven hoy los autores antes de introducir la colección |
| 57 | Migración de Home a Pages (`/`, mayor riesgo) | PAGES-03 | QA de render/SEO reforzado — mayor riesgo del milestone |
| 58 | Retiro de globals (home/bloglisting/casestudieslisting) + limpieza (Styles/LLM/Robots) | PAGES-06, CLEAN-01/02 | Ninguno |
| 59 | QA final y no-regresión (ISR/edge-cache, hreflang/canonical/lang, live preview, tsc+tests) | QA-01..04 | Cierre de milestone — no mergear a main sin este gate en verde |

**Constantes en todas las fases (52-59):** Definition of Done por superficie migrada (paridad visual, `x-vercel-cache: HIT`/ISR sin `no-store`, hreflang/canonical/`<html lang>` correctos, live preview funcional, global retirado sin rutas rotas/datos huérfanos); tsc baseline (0 nuevos en `src/`) y tests verdes. Home (Phase 57) es la superficie de mayor riesgo — migra al final, tras validar el patrón en blog (54) y case studies (55).

## Milestone v1.8 — Estructura de fases

Numeración DEFAULT (continúa tras v1.7, que va hasta Phase 43 — parkeada, no se toca). Requirements DS-01/02, CHROME-01..04, HOME-01..05, BLOG-01..03, POST-01..04, CASE-01, FORM-01/02, UIKIT-01 (`.planning/REQUIREMENTS.md`). Orden de build: fundación (tokens) → primitivas compartidas → superficies (chrome, home, blog, post, case, forms), para no re-tocar tokens/primitivas una vez consumidos.

| Phase | Goal | Requirements | Gate |
|-------|------|--------------|------|
| 44 | Fundación design-system (`ui-ux-pro-max --design-system`, tokens OKLCH/spacing/radius/motion, baseline a11y) | DS-01, DS-02 | Permiso de ejecución del skill (`search.py`, deny rule auto-mode) resuelto antes de correr el script |
| 45 | Primitivas UI compartidas (`components/ui/*`) alineadas al sistema | UIKIT-01 | **QA visual obligatorio** (Juan) de las primitivas antes de mergear |
| 46 | Chrome global (Header/mobile menu/Footer/Logo/Breadcrumbs/DynamicBackground) | CHROME-01..04 | **QA visual obligatorio** (Juan) en 375/768/1024/1440 |
| 47 | Home (About/Results/FeaturedWorks/Clients/Blog/Testimonials/CTAs/ContactForm, HeroHome alineado) | HOME-01..05 | **QA visual obligatorio** (Juan) de la home end-to-end |
| 48 | Blog listing & archivo (header, grid, card, paginación, categorías) | BLOG-01..03 | **QA visual obligatorio** (Juan) del listado/archivo |
| 49 | Post/artículo (hero, contenido, TOC, sidebar, relacionados, FAQ, autor) | POST-01..04 | **QA visual obligatorio** (Juan) de un post completo |
| 50 | Case studies (header, grid, featured, latest) | CASE-01 | **QA visual obligatorio** (Juan) de case studies |
| 51 | Formularios & interactivos (Form/ContactForm/Turnstile/Calendly/Banner/Intro/Media/Section) | FORM-01/02 | **QA visual obligatorio** (Juan) de formularios (normal/error/loading) |

**Constantes en todas las fases (44-51):** QA visual obligatorio por superficie (Juan) antes de mergear; DoD del Pre-Delivery Checklist (a11y contraste/focus/touch-targets, cursor-pointer + hover sin shift, SVG sin emojis, responsive 375/768/1024/1440, motion transform/opacity + reduced-motion); sin regresión de v1.7 (hero SSR, animaciones CSS, preloads de fuentes, LCP/CLS) ni de identidad de marca dark-mode-default; tsc baseline (0 nuevos en `src/`) y tests verdes; refresh guiado por design-system, no rebrand. Fase 44 requiere resolver el permiso de ejecución de `ui-ux-pro-max` (deny rule auto-mode) antes de correr `--design-system`.

## Milestone v1.7 — Estructura de fases

Numeración DEFAULT (continúa tras v1.6, que terminó en Phase 37). Requirements PERF-04 a PERF-11 (`.planning/REQUIREMENTS.md`). Baseline: `.planning/research/audit-jul2026/03-performance.md` (Unlighthouse mobile post-v1.6: Perf 0.37 · LCP 7.4s · TBT 2180ms · CLS 0.001).

| Phase | Goal | Requirements | Gate |
|-------|------|--------------|------|
| 38 | Medición de campo — INP real por interacción (#103) | PERF-10 | Informa prioridad de 39-42 |
| 39 | Hero → server component + recorte de JS inicial | PERF-04, PERF-05, PERF-06 | **QA visual obligatorio** (animación/layout hero) antes de mergear |
| 40 | Validación de TBT/INP tras el recorte de JS | PERF-07 | Unlighthouse mobile + INP de campo |
| 41 | Recorte de preloads de fuentes | PERF-08 | **QA visual obligatorio** (sin FOUT perceptible) antes de mergear |
| 42 | Cache de HTML en el edge (Cloudflare) | PERF-09 | `cf-cache-status: HIT`, ISR y draft/preview intactos |
| 43 | Re-medición final y procedimiento repetible | PERF-11 | Unlighthouse mobile post-milestone vs baseline |

**Constantes en todas las fases:** QA visual obligatorio antes de mergear el refactor del hero (Phase 39) y el cambio de preloads de fuentes (Phase 41); no regresionar el H1/LCP-visible-en-SSR de v1.1; tsc baseline (0 nuevos en `src/`) y tests verdes; medir siempre en mobile con Unlighthouse (no PSI, que subestima).

## Milestone v1.6 — Ejecución

Branch: `fix/v1.6-audit-remediation`. 23 issues creados (#85-#107) + #12 comentado.

| Fase | Issues | Estado |
|------|--------|--------|
| 31 Routing canónico blog | #85 #96 #97 #101 #98 #100 | ✅ código + cerrados |
| 32 Sitemap & huérfanos | #89 (fixed), #88 (decisión Juan) | ✅ código; #88 abierto (dato) |
| 33 Metadata/OG/schema | #86 #90 #92 | ✅ código + cerrados |
| 34 Resiliencia runtime | #87 #93 #94 | ✅ código + cerrados |
| 35 Bugs restantes | #99 #91 | ✅ código + cerrados |
| 36 Performance LCP | #95 | ⚠️ levers seguros ya existían; resto = Juan (abierto) |
| 37 Manual & verificación | #102 #103 #104 #105 #106 #107 #12 #88 #95 | ⏳ pendiente Juan (JUAN-ACTIONS.md) |

**Issues cerrados (código, 12):** #85 #86 #87 #90 #91 #92 #93 #94 #96 #97 #98 #99 #100 #101.
**Abiertos para Juan (11):** #12 #88 #95 #102 #103 #104 #105 #106 #107 (+ manual/contenido).

**Próximo paso:** abrir PR de la branch → preview Vercel (build + verificación real) → mergear → re-crawl. Ver `.planning/research/audit-jul2026/JUAN-ACTIONS.md`.

## Milestone v1.5 — Estructura de fases (histórico)

## Milestone v1.5 — Estructura de fases

| Phase | Goal | Requirements | Gate |
|-------|------|--------------|------|
| 25 | Verificación runtime de integraciones (Ahrefs/DinoRank/Indexing/GSC) | VERIFY-01 | Gate humano: Juan valida en `pnpm dev` antes de borrar nada |
| 26 | Retirar plugin SEO fantasma preservando 4 módulos vivos | CLEAN-01 | tsc/vitest/admin verdes |
| 27 | Colapsar `domains/` + borrar backups/re-exports | CLEAN-02, CLEAN-03 | tsc/vitest/admin verdes |
| 28 | Limpieza de scripts one-off | SCRIPT-01 | package.json intacto, build verde |
| 29 | Accesos endurecidos + assets unificados | SEC-01, ASSET-01 | cron sigue, imágenes 200 |
| 30 | Consistencia admin (group/labels/nav) | CONSIST-01/02/03 | cosmético, tests verdes |

**Constante brownfield (todas las fases 26-30):** no introducir errores nuevos de tsc sobre el baseline (114), tests verdes (775+), admin arranca tras regenerar el importMap.

## Validaciones visuales pendientes (diferidas por Juan)

- Fase 22: semáforo Yoast en sidebar (checklist en 22-VERIFICATION.md)
- Fase 23: vista admin de cobertura (checklist en 23-VERIFICATION.md)

## Deferred Items

Items acknowledged y diferidos al cierre del milestone v1.5 (2026-06-26):

| Category | Item | Status |
|----------|------|--------|
| verification | VERIFY-01 — gate runtime integraciones (Ahrefs/DinoRank/Indexing/GSC) | human_needed (checklist en 25-RUNTIME-CHECKLIST.md) |
| requirement | ASSET-01 — migración storage Blob→Cloudinary | deferred a milestone propio (riesgo prod) |
| verification | Fases 03/04/10 (milestones viejos) — visual | human_needed (ya shipped) |
| verification | Fases 22/23 (v1.4) — visual admin | human_needed (diferido) |

## Performance Metrics

**Velocity (v1.4 reference):**

- Total plans completed: 4 fases / 7 plans (v1.4, fases 21-24)
- Average duration: —
- Total execution time: —

*Updated after each plan completion*

## Accumulated Context

### Decisions (v1.5)

- **VERIFY-01 como gate primero (Phase 25):** Confirmar en runtime qué integraciones (Ahrefs/DinoRank/Indexing/GSC) funcionan ANTES de borrar código dependiente. Es checklist humano; Juan valida con credenciales reales en `pnpm dev` y el veredicto se registra aquí antes de tocar nada.
- **CLEAN-01 conserva 4 módulos vivos (Phase 26):** Al borrar `src/plugins/seo/` se preservan y reubican `seoAnalyzer.ts`, `keywordCoverageAudit.ts`, `fields/seoFields.ts`, `types/keywordScore.ts` (destino propuesto `src/lib/seo/`). Consumidores que deben seguir vivos: `/api/seo/keyword-score`, `/api/seo/keyword-coverage`, `KeywordScorePanel`, `KeywordCoverageView`, script `audit-keywords`, `seoFields` en Users/Categories.
- **CLEAN-02 mueve solo AdBanner (Phase 27):** El único vivo de `src/domains/**` es `ad-banners/domain/AdBanner.ts` (importado en `payload.config.ts:21`). Se mueve a `src/collections/`, se repunta la config y se borra el resto de `domains/`.
- **SEC + ASSET juntos (Phase 29):** Son los dos cambios de comportamiento (no solo borrado); se agrupan porque ambos requieren verificación funcional (cron sigue escribiendo métricas; imágenes existentes siguen sirviéndose).
- **CONSIST al final (Phase 30):** Cosmético (group/labels/nav) tras la limpieza estructural.

### Decisions (v1.4, contexto previo)

- **Reusa `seoAnalyzer.ts`:** El scorer del semáforo extiende `seoAnalyzer.ts` (módulo vivo que la Phase 26 debe preservar al reubicarlo).
- **primaryKeyword localizado es/en en las 4 colecciones (24-01):** `localized: true` en Posts/Pages/Categories/Users; Mongo schemaless → sin migración.

### Blockers/Concerns

- **Baseline tsc 114 errores + 775+ tests:** Toda fase de limpieza (26-30) se mide contra este baseline: 0 errores nuevos, tests verdes, admin arranca con importMap regenerado.
- **Gate Phase 25 pendiente:** No iniciar el borrado (fases 26+) hasta que Juan firme el checklist de integraciones con credenciales reales (caveats conocidos: login DinoRank, OAuth GSC, API key Ahrefs/Indexing).
- **Overlap Cloudinary vs Vercel Blob:** Media usa Blob como storage real pero conviven botones Cloudinary; ASSET-01 (Phase 29) debe elegir una y borrar la otra sin romper imágenes existentes.

## Session Continuity

Last session: 2026-07-05T22:07:11.440Z
Stopped at: Roadmap v1.9 creado (fases 52-59, cobertura 20/20).
Resume file: None

## Operator Next Steps

- Revisar/aprobar el roadmap v1.9 y luego planear Phase 52 con /gsd:plan-phase 52
