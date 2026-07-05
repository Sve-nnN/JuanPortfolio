---
phase: 55-migracion-del-listado-de-case-studies-a-pages
verified: 2026-07-05T00:00:00Z
status: human_needed
score: 11/11 code must-haves verified — 4 SC deferred to post-migration deploy/human
re_verification:
  previous_status: null
human_verification:
  - test: "Ejecutar `pnpm migrate:case-studies-listing` contra la DB objetivo (requiere DATABASE_URI en vivo). Es idempotente (upsert por slug 'case-studies')."
    expected: "Se crea/actualiza la entrada Pages slug 'case-studies' con title/description/layout para es y en; el global case-studies-listing queda intacto."
    why_human: "El executor no tiene acceso a la DB de producción; la migración de datos no puede correrse ni verificarse programáticamente aquí."
  - test: "SC1 — Paridad visual es+en en /case-studies tras correr la migración y deploy."
    expected: "Los bloques renderizados son idénticos pre/post migración (mismo contenido, ahora desde Pages)."
    why_human: "Comparación visual del render en navegador; no verificable por grep."
  - test: "SC2 — `curl -I` sobre /es/case-studies y /en/case-studies tras deploy."
    expected: "x-vercel-cache: HIT (ISR), sin no-store en la respuesta."
    why_human: "Requiere un deploy activo en Vercel; el cache-header solo existe en runtime edge."
  - test: "SC3 — hreflang, canonical y <html lang> por locale en /case-studies."
    expected: "hreflang es/en y canonical correctos; <html lang> coincide con el locale."
    why_human: "Inspección del HTML renderizado en runtime; generateMeta es source-agnostic pero el output se valida en deploy."
  - test: "SC4 — Live preview de Payload sobre la Page 'case-studies'."
    expected: "El draft es visible bajo la cookie de preview; el público permanece en ISR."
    why_human: "Flujo interactivo del admin de Payload con cookie de bypass; no verificable estáticamente."
---

# Phase 55: Migración del listado de case studies a Pages — Verification Report

**Phase Goal:** El listado de case studies (ex-global `CaseStudiesListing`) se sirve desde una entrada editable de `Pages`, replicando el patrón validado en Phase 54.
**Verified:** 2026-07-05
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Réplica exacta del patrón de Phase 54 aplicada a case studies. Cada artefacto necesario para servir `/case-studies` desde la colección `Pages` (en vez del global `case-studies-listing`) existe, es sustantivo y está cableado. La ejecución del SCRIPT de migración contra una DB viva más la paridad visual/deploy/SEO/preview (SC1–SC4) están correctamente diferidas a pasos humanos/deploy — el executor no tiene acceso a la DB de producción. Por eso `human_needed`, no `passed`.

### Observable Truths (code-level must-haves)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `/case-studies` lee Pages slug `case-studies` vía `getCachedPageBySlug` (NO `getCachedGlobal`) | ✓ VERIFIED | `case-studies/page.tsx:7` importa `getCachedPageBySlug`; usado en `:71,:86`. No hay `getCachedGlobal` en el archivo. |
| 2 | Renderiza `page.content.layout` blocks | ✓ VERIFIED | `case-studies/page.tsx:107` `layout = page?.content?.layout`; `:123` `<RenderBlocks blocks={layout} …>` |
| 3 | Rama `draftMode()` para live preview | ✓ VERIFIED | `case-studies/page.tsx:78` `draftMode()`; `:84-85` rama draft → `queryCaseStudiesPageDraft` (react cache, draft:true, overrideAccess:true, depth:2, `:49-66`); `LivePreviewListener` `:121,:135` |
| 4 | Fallback null-safe: /case-studies no da 500 si la entrada Pages ausente | ✓ VERIFIED | `.catch(() => null)` en `:71,:85,:86`; fallback UI `:132-145` cuando no hay layout blocks |
| 5 | ISR preservado — sin `no-store`/`force-dynamic` | ✓ VERIFIED | `case-studies/page.tsx:29` `export const revalidate = 3600`; grep `no-store`/`force-dynamic` → solo en comentario (`:28`), sin directiva |
| 6 | `LatestCaseStudies` en Pages content.layout | ✓ VERIFIED | `Pages/index.ts:33` import; `:167` dentro de `layout.blocks`; block config existe `src/blocks/LatestCaseStudies/config.ts` |
| 7 | `payload-types.ts` regenerado con el bloque | ✓ VERIFIED | `payload-types.ts:1224` `interface LatestCaseStudiesBlock`; `:4505` en la unión de layout de `Page`; `:4411` en union global |
| 8 | slug `case-studies` excluido de `[slug]` generateStaticParams | ✓ VERIFIED | `[slug]/page.tsx:52` `doc.slug !== 'home' && doc.slug !== 'blog' && doc.slug !== 'case-studies'` |
| 9 | Script de migración idempotente, ambos locales, disableRevalidate, global intacto | ✓ VERIFIED | `migrate-case-studies-listing-to-page.ts:27-32` find by slug; `:47-62` update-or-create (es); `:65-77` en update sobre el mismo doc; `context:{disableRevalidate:true}` `:54,:61,:70`; global intacto `:80` (sin delete) |
| 10 | `migrate:case-studies-listing` npm script existe | ✓ VERIFIED | `package.json:19` `"migrate:case-studies-listing": "tsx -r dotenv/config src/scripts/migrate-case-studies-listing-to-page.ts"` |
| 11 | Sin NUEVOS errores tsc en src/ | ✓ VERIFIED | `pnpm exec tsc --noEmit`: 114 errores totales, todos bajo `tests/`, 0 bajo `src/` |

**Score:** 11/11 code checks verificados · 0 gaps.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/app/(frontend)/[locale]/case-studies/page.tsx` | Lee Pages slug, layout, draft, fallback, ISR | ✓ VERIFIED | 149 líneas; espeja blog/page.tsx |
| `src/collections/Pages/index.ts` | LatestCaseStudies en layout | ✓ VERIFIED | import `:33`, entry `:167` |
| `src/payload-types.ts` | LatestCaseStudiesBlock en union Page | ✓ VERIFIED | `:1224`, `:4505` |
| `src/app/(frontend)/[locale]/[slug]/page.tsx` | Exclusión de slug | ✓ VERIFIED | `:52` |
| `src/scripts/migrate-case-studies-listing-to-page.ts` | Script idempotente | ✓ VERIFIED | 88 líneas |
| `package.json` | npm script | ✓ VERIFIED | `:19` |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| case-studies/page.tsx | getCachedPageBySlug | import + call | WIRED | `:7,:71,:86` |
| getCachedPageBySlug | cache tag | unstable_cache tag `pages_case-studies` | WIRED | `getPages.ts:31-36` `tags:['pages_'+slug]` |
| Pages/index.ts | LatestCaseStudies block config | import | WIRED | `:33` → `src/blocks/LatestCaseStudies/config.ts` |
| migration script | Pages collection | payload.update/create | WIRED | idempotente, disableRevalidate |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| PAGES-05 | 55-SUMMARY | Listado case studies desde Pages editable | ✓ SATISFIED (código) | Truths 1-11; SC1-4 diferidas a deploy/human |

### Anti-Patterns Found

Ninguno. El fallback `return null` en la rama draft es null-safe intencional (defensa contra 500), no un stub. No hay TODO/FIXME/XXX en los archivos tocados. El bloque `slug === 'case-studies-listing'` en `[slug]/page.tsx:185` es rama muerta documentada para retiro en Phase 58 (rollback vivo), no regresión.

### Human Verification Required

1. **Ejecutar `pnpm migrate:case-studies-listing`** (requiere DATABASE_URI vivo) — copia el global a la entrada Pages slug `case-studies` en ambos locales. Idempotente.
2. **Smoke deploy** `/es/case-studies` y `/en/case-studies` — paridad visual (SC1), `x-vercel-cache: HIT` sin no-store (SC2), hreflang/canonical/lang por locale (SC3), live preview del draft (SC4).

### Gaps Summary

Sin gaps de código. Los 4 Success Criteria del ROADMAP son verificaciones de runtime/deploy que requieren correr la migración contra la DB viva y un deploy activo en Vercel — no verificables estáticamente. Estado `human_needed`.

---

_Verified: 2026-07-05_
_Verifier: Claude (gsd-verifier)_
