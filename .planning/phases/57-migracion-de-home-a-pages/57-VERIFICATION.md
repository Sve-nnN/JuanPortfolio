---
phase: 57-migracion-de-home-a-pages
verified: 2026-07-05T00:00:00Z
status: human_needed
score: 6/6 must-haves verified (code) — 4/4 SC pending DB-live RUN + deploy smoke
re_verification:
  previous_status: none
  previous_score: n/a
human_verification:
  - test: "RUN `pnpm migrate:home` against the live DB (DATABASE_URI). Idempotent, safe to re-run."
    expected: "Pages entry slug 'home' created/updated for es+en with content.layout copied from the home global; global left intact."
    why_human: "Requires live database connection; not executable in verification sandbox."
  - test: "Deploy smoke of `/` (es) and `/en` after migration."
    expected: "Pixel parity vs current home in both locales; `x-vercel-cache: HIT` with no `no-store`; correct hreflang/canonical/`<html lang>` per locale."
    why_human: "Runtime/visual/edge-cache headers only observable on a deployed environment."
  - test: "Live preview of the Pages 'home' entry from the Payload admin."
    expected: "Preview opens at `/` (es) or `/en` (en) and reflects unsaved draft changes."
    why_human: "End-to-end draftMode cookie + preview route behavior requires a running admin + browser."
---

# Phase 57: Migración de Home a Pages Verification Report

**Phase Goal:** El contenido de la Home se sirve desde una entrada editable de `Pages` en `/` (home ES), sin regresionar ruteo/ISR/edge-cache — la superficie de mayor riesgo, migrada al final.
**Verified:** 2026-07-05
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

The phase ships an **additive-with-fallback** cutover: the code reads the Pages `home` entry but falls back to the untouched `home` global when the Page is absent. A single deploy cannot break `/` because, pre-migration, `getCachedPageBySlug('home')` returns `null` (guarded by `.catch(() => null)`) and the render path uses the global layout — identical to current output. Only the migration RUN and deploy smoke remain, hence `human_needed`.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Component branch `slug==='home'` reads Pages via getCachedPageBySlug with fallback to global | ✓ VERIFIED | `page.tsx:97-113` — `getCachedPageBySlug('home',2,locale)().catch(()=>null)`; if `!page` → `payload.findGlobal({slug:'home',depth:2,draft,locale})` → `layout = homeGlobal.layout` |
| 2 | generateMetadata (home) reads Pages with global fallback, preserving hreflang/canonical/lang | ✓ VERIFIED | `page.tsx:185-188` — `const doc = page ?? (await payload.findGlobal({slug:'home',locale}))`; `generateMeta({doc,locale})` (source-agnostic, no `path` → canonical unchanged) |
| 3 | Render path (JsonLd isHome + HomePage + hero) and draftMode gating preserved | ✓ VERIFIED | `page.tsx:115-124` — `<JsonLd isHome blocks={layout}.../>`, `<PageClient/>`, `<PayloadRedirects disableNotFound url={url}/>`, `{draft && <LivePreviewListener/>}`, `<HomePage layout={layout} locale={locale}/>`. Hero is HeroHome inside layout (per plan) |
| 4 | HomePage refactored to `{layout, locale}`, legacy normalization + no-blocks guide preserved | ✓ VERIFIED | `HomePage.tsx:17` signature `{layout, locale}`; `:21-24` legacy localized-layout normalization intact; `:28-63` setup guide intact; `:68` `RenderBlocks blocks={layout}` |
| 5 | Pages content.layout accepts FAQ + TestimonialsCarousel (CalendlyEmbed already present) | ✓ VERIFIED | `Pages/index.ts:46-47` imports; `:162-163` `FAQ, TestimonialsCarousel,`; `:193` `CalendlyEmbed` (not duplicated) |
| 6 | Idempotent migrate script exists + wired, NOT run, global intact | ✓ VERIFIED | `migrate-home-to-page.ts` — upsert by slug, es+en, `overrideAccess:true`, `context:{disableRevalidate:true}`, global untouched; `package.json:19` `migrate:home`; `git status` on `src/globals/Home/` clean |

**Score:** 6/6 code truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/(frontend)/[locale]/[slug]/page.tsx` | 2 home branches, Pages+global fallback | ✓ VERIFIED | Component L94-125, metadata L181-189, draft branch `queryHomePageDraft` L225-242 |
| `src/app/(frontend)/[locale]/home/HomePage.tsx` | `{layout,locale}` signature | ✓ VERIFIED | L17; normalization L21-24 |
| `src/collections/Pages/index.ts` | FAQ + TestimonialsCarousel | ✓ VERIFIED | L46-47, L162-163 |
| `src/utilities/generatePreviewPath.ts` | pages+home → `/` or `/en` | ✓ VERIFIED | L27-30 special case before encodedParams |
| `src/collections/Pages/hooks/revalidatePage.ts` | home invalidates `/` and `/en` | ✓ VERIFIED | L16-18, L22 (`pages_home` tag), L32, L44 |
| `src/scripts/migrate-home-to-page.ts` | idempotent, both locales, disableRevalidate | ✓ VERIFIED | L23-82 |
| `src/payload-types.ts` | additive FAQBlock/TestimonialsCarouselBlock | ✓ VERIFIED | L274-275 in pages.content.layout union; interfaces L1152/L1183; no removals (diff `-` lines are repositioning only, symbols still present) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `[slug]/page.tsx` | `getPages.getCachedPageBySlug` | import + call in home branch | ✓ WIRED | import L21; call L99, L185 |
| `[slug]/page.tsx` | `payload.findGlobal({slug:'home'})` | fallback when Page null | ✓ WIRED | L106-111 (component), L186 (metadata) |
| `Pages/index.ts` | FAQ/TestimonialsCarousel configs | import + blocks array | ✓ WIRED | L46-47 imports, L162-163 array |
| `page.tsx` → `HomePage` | `layout={layout}` prop | direct layout pass | ✓ WIRED | L122 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| home render | `layout` | Pages `content.layout` OR global `home.layout` (fallback) | Yes — both paths yield real block arrays; pre-migration always via global | ✓ FLOWING |

Single-deploy safety confirmed at data level: with the Pages entry absent, `page?.content?.layout` is `undefined`, `!page` is true, and `layout` is reassigned from `homeGlobal.layout` before render. No empty/hardcoded fallback reaches the user.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| No new src/ type errors | `pnpm exec tsc --noEmit` | 114 total, 0 under `src/` (all `tests/` baseline) | ✓ PASS |
| Migration script not executed | inspection — no DB writes performed | script exists only | ✓ PASS |

### Probe Execution

No project probes declared for this phase. N/A.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PAGES-03 | 57-01 | Home served from editable Pages entry at `/` without regressing ISR/edge-cache/routing | ✓ SATISFIED (code) / ? human (runtime SC1-4) | Code paths verified; pixel/cache-header/preview parity deferred to deploy smoke |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TBD/FIXME/XXX in phase files; no stub renders; `.catch(()=>null)` is intentional fallback guard, not a stub | ℹ️ Info | None |

The `let layout = page?.content?.layout` followed by conditional reassignment is a deliberate fallback, not an unwired empty default — the reassignment from the global runs before any render.

### Human Verification Required

1. **RUN `pnpm migrate:home`** against the live DB (requires DATABASE_URI). Idempotent; safe to re-run. Global stays intact.
2. **Deploy smoke of `/` and `/en`:** pixel parity both locales; `x-vercel-cache: HIT` with no `no-store`; correct hreflang/canonical/`<html lang>` per locale.
3. **Live preview** of the Pages `home` entry renders at `/` (es) / `/en` (en) with draft changes.

### Gaps Summary

No code gaps. `/` cannot break on a single deploy: the public read is guarded (`getCachedPageBySlug(...).catch(()=>null)`) and falls back to the untouched `home` global, producing an identical render pre-migration; `generateMetadata` uses the same `page ?? findGlobal` fallback so SEO tags are unchanged. The global (`src/globals/Home/config.ts`) is untouched (clean git status), payload-types changes are purely additive (FAQBlock/TestimonialsCarouselBlock added to the pages union, no removals), and HomePage retains its legacy-localized-layout normalization. Only the DB-live migration RUN and the deployed smoke checks remain — routed to human.

---

_Verified: 2026-07-05_
_Verifier: Claude (gsd-verifier)_
