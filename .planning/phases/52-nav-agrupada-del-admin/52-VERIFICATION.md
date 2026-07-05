---
phase: 52-nav-agrupada-del-admin
verified: 2026-07-05T00:00:00Z
status: human_needed
score: 5/5 must-haves verified in code
overrides_applied: 0
human_verification:
  - test: "Correr `pnpm dev` y abrir http://localhost:3000/admin"
    expected: "El sidebar muestra exactamente 4 grupos: Contenido, Marketing, SEO/Métricas, Sitio (orden alfabético en español, esperado per CONTEXT). Ninguna sección queda suelta fuera de un grupo — revisar especialmente Redirects, Forms, Form Submissions, Search, Users, Styles, Site Settings."
    why_human: "El render del sidebar y la ausencia de secciones sueltas solo se confirman visualmente; grep verifica el `admin.group` en cada config pero no cómo Payload los pinta."
  - test: "Cambiar el idioma del admin a inglés"
    expected: "Los labels cambian a Content / Site / SEO & Metrics / Marketing"
    why_human: "El cambio de label localizado depende del runtime i18n del admin; no verificable por grep."
---

# Phase 52: Nav agrupada del admin — Verification Report

**Phase Goal:** El sidebar del admin de Payload agrupa todas las secciones existentes en 4 grupos coherentes (Contenido, Sitio, SEO/Métricas, Marketing), sin secciones sueltas y con labels bilingües es/en.
**Verified:** 2026-07-05
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Existen exactamente 4 grupos bilingües como única fuente de verdad | ✓ VERIFIED | `src/utilities/adminGroups.ts:11-16` define `ADMIN_GROUP` con CONTENIDO/SITIO/SEO/MARKETING, cada uno `{es,en}`, `as const satisfies Record<string,Record<string,string>>` |
| 2 | Cada colección y global registrado tiene un `admin.group` de una de las 4 constantes | ✓ VERIFIED | 14/14 colecciones + 9/9 globals mapeadas (tabla abajo); 0 secciones sin grupo |
| 3 | No quedan strings de grupo hardcodeados ni `group: 'SEO'` legacy | ✓ VERIFIED | `grep -rn "group: 'SEO'" src/` → NONE; `grep group:\s*\{` en configs → NONE; todos usan `ADMIN_GROUP.*` |
| 4 | Colecciones de plugins (Redirects, Forms, FormSubmissions, Search) reciben grupo vía overrides | ✓ VERIFIED | `src/plugins/index.ts`: Redirects→SEO (:42), Forms→MARKETING (:93), FormSubmissions→MARKETING (:117), Search→MARKETING (:126) |
| 5 | `tsc --noEmit` sin errores nuevos en `src/` | ✓ VERIFIED | 0 errores en `src/`; 114 errores pre-existentes, todos en `tests/` (KeywordData/SeoAdapter/mocks) — fuera de alcance |

**Score:** 5/5 truths verified in code. La única verificación restante es el render visual del sidebar (checkpoint humano del PLAN).

### Actual Group Mapping (construido desde el código)

**Contenido / Content** — `ADMIN_GROUP.CONTENIDO`
| Sección | Archivo:línea |
|---------|---------------|
| Pages | `src/collections/Pages/index.ts:60` |
| Posts | `src/collections/Posts/index.ts:48` |
| Categories | `src/collections/Categories.ts:114` |
| Media | `src/collections/Media.ts:27` |
| Home (global) | `src/globals/Home/config.ts:25` |
| BlogListing (global) | `src/globals/BlogListing/config.ts:13` |
| CaseStudiesListing (global) | `src/globals/CaseStudiesListing/config.ts:10` |

**Sitio / Site** — `ADMIN_GROUP.SITIO`
| Sección | Archivo:línea |
|---------|---------------|
| SiteSettings (global) | `src/globals/SiteSettings/index.ts:9` |
| Header (global) | `src/Header/config.ts:10` |
| Footer (global) | `src/Footer/config.ts:10` |
| Styles (global) | `src/globals/Styles/config.ts:8` |
| LLM (global) | `src/globals/LLM/config.ts:14` (era `group:'SEO'`, reemplazado) |
| Robots (global) | `src/globals/Robots/config.ts:40` (era `group:'SEO'`, reemplazado) |
| Users | `src/collections/Users/index.ts:81` |

**SEO/Métricas / SEO & Metrics** — `ADMIN_GROUP.SEO`
| Sección | Archivo:línea |
|---------|---------------|
| KeywordMetrics | `src/collections/KeywordMetrics.ts:14` |
| PageMetrics | `src/collections/PageMetrics.ts:14` |
| GSCMetrics | `src/collections/GSCMetrics.ts:14` |
| BrokenLinks | `src/collections/BrokenLinks.ts:13` |
| Redirects (plugin) | `src/plugins/index.ts:42` (override) |

**Marketing / Marketing** — `ADMIN_GROUP.MARKETING`
| Sección | Archivo:línea |
|---------|---------------|
| Works | `src/collections/Works/index.ts:11` |
| CaseStudies | `src/collections/CaseStudies/index.ts:46` |
| Clientes | `src/collections/Clientes/index.ts:11` |
| Testimonials | `src/collections/Testimonials.ts:11` |
| AdBanners | `src/collections/AdBanners/index.ts:21` |
| Forms (plugin) | `src/plugins/index.ts:93` (formOverrides) |
| FormSubmissions (plugin) | `src/plugins/index.ts:117` (formSubmissionOverrides) |
| Search (plugin) | `src/plugins/index.ts:126` (searchOverrides) |

**Total:** 14 colecciones + 9 globals + 4 colecciones de plugin = 27 secciones, todas agrupadas. Cero sueltas.

### Comparación contra CONTEXT y ROADMAP

- Coincide 100% con el mapa de `52-CONTEXT.md` (incluyendo las decisiones discrecionales: Home/BlogListing/CaseStudiesListing→Contenido, Users→Sitio, LLM+Robots→Sitio, FormSubmissions→Marketing).
- Coincide con los 5 Success Criteria del ROADMAP. SC5 del ROADMAP lista "Forms y Search" bajo Marketing sin nombrar FormSubmissions; el código añade FormSubmissions a Marketing (aditivo, per CONTEXT) — no es un gap.
- Nota: los globals de contenido (Home/BlogListing/CaseStudiesListing) migrarán a Pages en fases 54/55/57; su ubicación en Contenido es intencional (CONTEXT).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/utilities/adminGroups.ts` | 4 constantes `{es,en}`, única fuente de verdad | ✓ VERIFIED | 17 líneas, exporta `ADMIN_GROUP`, sin imports (módulo hoja), tipado `satisfies` |
| `src/plugins/index.ts` | `admin.group` en 4 overrides + `formSubmissionOverrides` nuevo | ✓ VERIFIED | importa `ADMIN_GROUP` (:14); 4 overrides seteados; `formSubmissionOverrides` presente (:115-119) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| 23 configs (colecciones + globals + Header/Footer) | `src/utilities/adminGroups.ts` | `import { ADMIN_GROUP }` + `group: ADMIN_GROUP.*` | ✓ WIRED | 23/23 importan y referencian; sin imports faltantes |
| `src/plugins/index.ts` | `src/utilities/adminGroups.ts` | `admin: { group }` en cada override | ✓ WIRED | 4/4 overrides con la constante correcta |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Typecheck de src/ limpio | `pnpm exec tsc --noEmit` | 0 errores en `src/`, 114 en `tests/` (pre-existentes) | ✓ PASS |
| Sin group string legacy | `grep -rn "group: 'SEO'" src/` | NONE | ✓ PASS |
| Sin group objects inline | `grep -rnE "group:\s*\{" src/collections src/globals src/Header src/Footer` | NONE | ✓ PASS |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| NAV-01 | Contenido: Pages, Posts, Categories, Media (+globals contenido) | ✓ SATISFIED | 7 secciones → CONTENIDO |
| NAV-02 | Sitio: SiteSettings, Header, Footer, Styles, LLM, Robots (+Users) | ✓ SATISFIED | 7 secciones → SITIO |
| NAV-03 | SEO/Métricas: KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks, Redirects | ✓ SATISFIED | 4 colecciones + Redirects override |
| NAV-04 | Marketing: Works, CaseStudies, Clientes, Testimonials, AdBanners, Forms, Search (+FormSubmissions) | ✓ SATISFIED | 5 colecciones + 3 plugin overrides |
| NAV-05 | Sin secciones sueltas, labels bilingües, orden consistente | ✓ SATISFIED (code) / ⏳ visual | 27/27 agrupadas; labels `{es,en}`; render pendiente de confirmación humana |

### Anti-Patterns Found

Ninguno. Sin TODO/FIXME/XXX en los archivos tocados; sin stubs; sin strings de grupo hardcodeados.

### Human Verification Required

1. **Sidebar visual** — Correr `pnpm dev`, abrir `/admin`, confirmar exactamente 4 grupos (Contenido, Marketing, SEO/Métricas, Sitio) y que ninguna sección quede suelta (revisar Redirects, Forms, Form Submissions, Search, Users, Styles, Site Settings).
2. **Labels bilingües** — Cambiar el idioma del admin a inglés y confirmar Content / Site / SEO & Metrics / Marketing.

### Gaps Summary

No hay gaps de código. Los 5 success criteria del ROADMAP y los 5 requirements NAV-01..NAV-05 están satisfechos en el código: cada una de las 27 secciones (14 colecciones + 9 globals + 4 colecciones de plugin) tiene su `admin.group` apuntando a una de las 4 constantes bilingües de `adminGroups.ts`, sin secciones sueltas, sin strings legacy, y `tsc --noEmit` limpio en `src/`. La única verificación pendiente es visual: confirmar en `/admin` que el sidebar renderiza los 4 grupos sin secciones sueltas y que los labels cambian es/en. Por eso el status es `human_needed`, no `passed`.

---

_Verified: 2026-07-05_
_Verifier: Claude (gsd-verifier)_
