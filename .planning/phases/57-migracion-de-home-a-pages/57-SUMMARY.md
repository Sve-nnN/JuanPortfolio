---
phase: 57-migracion-de-home-a-pages
plan: 01
subsystem: frontend / cms-content
tags: [pages, home, isr, live-preview, migration, payload]
requires:
  - Pages collection + getCachedPageBySlug (Phases 54/55)
  - home global (src/globals/Home/config.ts) — kept intact
provides:
  - Home (`/` es, `/en` en) reads Pages `home` entry with fallback to the home global
  - FAQ + TestimonialsCarousel enabled in Pages content.layout
  - migrate:home idempotent script (RUN deferred to Juan)
affects:
  - src/app/(frontend)/[locale]/[slug]/page.tsx (home Page + generateMetadata branches)
  - src/app/(frontend)/[locale]/home/HomePage.tsx (signature { layout, locale })
  - Pages live preview + revalidation for slug home
tech-stack:
  added: []
  patterns:
    - "Additive-with-fallback cutover: read Pages entry, fall back to global when absent (single safe deploy)"
    - "Cookie-gated draft branch (uncached) + tag-cached public read (preserves ISR/HIT)"
key-files:
  created:
    - src/scripts/migrate-home-to-page.ts
  modified:
    - src/collections/Pages/index.ts
    - src/payload-types.ts
    - src/app/(frontend)/[locale]/[slug]/page.tsx
    - src/app/(frontend)/[locale]/home/HomePage.tsx
    - src/utilities/generatePreviewPath.ts
    - src/collections/Pages/hooks/revalidatePage.ts
    - package.json
decisions:
  - "HomePage refactored to { layout, locale } instead of a { layout } as Home shim — avoids a partial-object type lie and keeps legacy-localized-layout normalization in one place reused by both the Pages and global-fallback paths"
  - "generateMetadata passes no `path`, so the home canonical is unchanged post-cutover"
  - "Migration script hardcodes title (Inicio/Home) and copies no meta — the home global only has a `layout` field"
metrics:
  duration: ~20m
  completed: 2026-07-05
  tasks: 5
  files: 8
  commits: 4
requirements: [PAGES-03]
---

# Phase 57 Plan 01: Migración de Home a Pages Summary

Home (`/` es, `/en` en) now reads its content from the editable Pages `home` entry (`content.layout`) instead of the `home` global, with a fallback to the global when the Page is absent — so a single deploy is safe and `/` renders identically pre-migration until Juan runs `pnpm migrate:home`. Covers PAGES-03. Highest-risk surface of the milestone; the global was left intact for rollback (removed in Phase 58).

## Files changed by task

**Task 1 — Pages block gap (commit `2b1aa2d`)**
- `src/collections/Pages/index.ts`: imported `FAQ` + `TestimonialsCarousel`, added both to `content.layout.blocks`. CalendlyEmbed already present (not duplicated).
- `src/payload-types.ts`: regenerated; diff scoped to `FAQBlock` / `TestimonialsCarouselBlock` in the `pages.content.layout` union (+ their `_select` variants).

**Task 2 — Read cutover + HomePage refactor (commit `fb107d3`)**
- `src/app/(frontend)/[locale]/[slug]/page.tsx`: both `slug === 'home'` branches now read `getCachedPageBySlug('home', 2, locale)` with fallback to `payload.findGlobal({slug:'home'})`. Added cookie-gated `queryHomePageDraft` (react `cache()`, `draft:true`, `overrideAccess:true`, depth 2) for live preview. `generateMetadata` reads the Page with global fallback; `generateMeta` is source-agnostic (no `path`, canonical unchanged). Render (`JsonLd isHome` + `HomePage` + hero) and draftMode gating preserved exactly.
- `src/app/(frontend)/[locale]/home/HomePage.tsx`: signature changed from `{ homeGlobal, locale }` to `{ layout, locale }`; legacy-localized-layout normalization and the no-blocks setup guide preserved; `RenderBlocks` render unchanged.

**Task 3 — Live preview + revalidation (commit `2862ad7`)**
- `src/utilities/generatePreviewPath.ts`: `pages` + `home` previews at `/` (es) or `/en` (en), not `/home`.
- `src/collections/Pages/hooks/revalidatePage.ts`: home edits also `revalidatePath('/en')` in the afterChange, previousDoc, and delete branches (both locale roots). `pages_home` tag already invalidates the cached read for both locales.
- `generateStaticParams` confirmed (no change): the loop filter excludes `home`, and the manual push adds it once per locale — no duplication after migration.

**Task 4 — Migration script (commit `ab2f08b`)**
- `src/scripts/migrate-home-to-page.ts`: idempotent, mirrors `migrate-blog-listing-to-page.ts`. Reads the home global per locale (depth 0), upserts Pages slug `home`, writes es (create/update) + en (update on same doc), `overrideAccess: true`, `context: { disableRevalidate: true }`. Global left intact. Title hardcoded (Inicio/Home), no meta copied (global has only `layout`).
- `package.json`: wired `migrate:home`.

**Task 5 — Verification gate**
- No code changes (payload-types committed in Task 1). Gate results below.

## Verification results (gate)

- `pnpm exec tsc --noEmit`: **114 errors total, all under `tests/` (pre-existing baseline), 0 under `src/`.** No new src/ errors introduced. The migration script type-checks clean.
- `pnpm generate:types`: diff limited to `FAQBlock` + `TestimonialsCarouselBlock` (interfaces + `_select` variants + their addition to the `pages.content.layout` union). No unrelated types touched.
- Key-link greps pass: `getCachedPageBySlug('home'`, `findGlobal` fallback, `layout={layout}`, `home` case in generatePreviewPath, `'/en'` in revalidatePage, `disableRevalidate` in the script.

## Deviations from Plan

None — plan executed exactly as written. The Home global was confirmed to have only a `layout` field (no title/meta), which matched the plan's guidance to hardcode the title and omit meta in the migration script.

## Single-deploy-safe argument

The fallback to the `home` global is what makes one deploy safe: with the Pages `home` entry absent (migration not yet run), `/` and `/en` render identically to the current state via the global. When Juan runs `pnpm migrate:home`, the read cuts over to the Pages entry with no re-deploy (the `pages_home` tag + `revalidatePath('/','/en')` refresh the ISR HTML). The global stays intact as rollback until Phase 58.

## Deferred to Juan (DB-live / deploy — not verifiable here)

1. **RUN `pnpm migrate:home`** against the live DB (requires DATABASE_URI). Idempotent — safe to re-run.
2. **Deploy smoke of `/` (es) and `/en`:**
   - Pixel parity vs current home (both locales).
   - `x-vercel-cache: HIT` with no `no-store` on both routes.
   - hreflang / canonical / `<html lang>` correct per locale.
   - Live preview of the Pages `home` entry rendering at `/` (es) / `/en` (en).
3. **Phase 58:** remove the `home` global, the fallback path, and simplify the home special-case if it can read as a normal Page.

## Self-Check: PASSED

- Created file exists: `src/scripts/migrate-home-to-page.ts` — FOUND
- Commits exist: `2b1aa2d`, `fb107d3`, `2862ad7`, `ab2f08b` — FOUND
