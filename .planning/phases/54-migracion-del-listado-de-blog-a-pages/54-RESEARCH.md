# Phase 54: Migración del listado de blog a Pages - Research

**Researched:** 2026-07-05
**Domain:** Payload 3.61.1 (MongoDB) + Next.js App Router — global→collection content migration + ISR
**Confidence:** HIGH (all findings verified by reading source; no external deps)

## Summary

The `/blog` listing renders blocks from the `blog-listing` **global** (`getCachedGlobal('blog-listing', 0, locale)`). The goal is to serve the same content from an editable `pages` collection entry (slug `'blog'`), preserving ISR (`revalidate = 3600`, `x-vercel-cache: HIT`, no `no-store`), correct per-locale hreflang/canonical/`<html lang>`, and enabling Payload live preview on the new entry. This is the FIRST of three identical migrations (54 blog, 55 case-studies, 57 home), so the pattern must be reusable.

The migration is low-risk and mechanically clean because the codebase **already establishes every piece of the pattern**: dedicated folder routes (`contact`, `privacy`, `terms`) already coexist with the `[slug]` collection route and shadow it in Next routing; `queryPageBySlug` already fetches a `pages` doc by slug with draft/live-preview support; `generateMeta` already produces per-locale hreflang/canonical; and `generateMetadata` in `[slug]/page.tsx` **already contains dead-code branches for `slug === 'blog-listing'`** signalling the intended direction. Two schema gaps exist: the `pages` `content.layout` blocks array is missing the `LatestBlogPosts` block (the global has it), and `content.layout` is `required: true` so the migrated doc must carry a non-empty layout.

**Primary recommendation:** Add `LatestBlogPosts` to `pages.content.layout` blocks, create a tag-cached `getCachedPageBySlug(slug, locale)` utility that mirrors `getCachedGlobal` (tag `pages_<slug>`), rewire `blog/page.tsx` to read the `pages` entry `slug: 'blog'` from `page.content.layout` instead of the global, extend `revalidatePage` to `revalidateTag('pages_blog')`, and migrate data via a one-off Local API script that writes both locales. Leave the global untouched (removed in Phase 58).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Blog listing content authoring | Payload CMS (pages collection) | — | Editable doc with drafts/live-preview replaces read-only global |
| `/blog` render + ISR | Next.js frontend server (RSC) | — | Route component fetches cached page doc, prerenders static ISR HTML |
| Cache invalidation on edit | Payload afterChange hook | Next.js `revalidateTag` | Hook fires on save, tag invalidates the `unstable_cache` entry |
| hreflang/canonical/lang | Next.js `generateMetadata` + `generateMeta` | — | Already locale-correct; only the data source (doc vs global) changes |
| Live preview | Payload admin + `generatePreviewPath` | Next.js `/next/preview` route | Pages collection already wires `livePreview.url` |

## Standard Stack

No new packages. This is an internal refactor using existing framework primitives.

| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| payload | 3.61.1 | Local API `find`/`create`/`update`, globals, collections | [VERIFIED: package.json] |
| @payloadcms/db-mongodb | 3.61.1 | Datastore — **MongoDB, no SQL migrations** | [VERIFIED: package.json] |
| @payloadcms/live-preview-react | 3.61.1 | `LivePreviewListener` on the page route | [VERIFIED: package.json] |
| next | App Router | ISR (`revalidate`), `unstable_cache`, `revalidateTag`/`revalidatePath` | [VERIFIED: source] |
| tsx | (devDep) | Runs one-off Local API scripts (`tsx -r dotenv/config …`) | [VERIFIED: package.json scripts] |

**Package Legitimacy Audit:** N/A — no packages installed this phase.

## Runtime State Inventory

> This IS a migration phase. Explicit inventory below.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `blog-listing` global doc in MongoDB holds real localized content: `title` (es+en), `description` (es+en), `layout` blocks (es+en). This must be copied into a new `pages` doc `slug: 'blog'`. | **Data migration** (one-off Local API script) — copy both locales, do NOT hand re-enter |
| Live service config | None. No external service references the listing content. | None — verified: only `payload.config.ts` registers the global |
| OS-registered state | None. | None |
| Secrets/env vars | `PREVIEW_SECRET` already used by `generatePreviewPath`; unchanged. | None |
| Build artifacts | `src/payload-types.ts` — regenerated (`npm run generate:types`) after adding `LatestBlogPosts` to Pages blocks; the new block union member and `pages` shape must be current. | Run `generate:types` |
| Orphaned global | `blog-listing` global stays registered and populated through Phase 54–57. **Removed only in Phase 58.** | Leave intact — do NOT delete this phase |

**Canonical question — after every file is updated, what runtime state still holds the old source?** The `blog-listing` global document remains in MongoDB (intentionally, as fallback until Phase 58). Nothing else caches the listing outside Next's ISR, which the revalidate tag covers.

## Architecture Patterns

### Data flow (target state)

```
Editor saves pages doc (slug:'blog')
        │
        ▼
 afterChange: revalidatePage ──► revalidateTag('pages_blog')  [NEW branch]
        │                        revalidatePath('/blog')       [existing]
        ▼
 Next invalidates unstable_cache entry tagged 'pages_blog'
        │
        ▼
GET /es/blog  ─►  blog/page.tsx (revalidate=3600, ISR)
        │            └─ getCachedPageBySlug('blog', locale)  [NEW util]
        │                 └─ payload.find(pages, where slug='blog') — cached, tagged
        ▼
 page.content.layout ─► RenderBlocks ─► static ISR HTML (x-vercel-cache: HIT)

GET /es/blog/page/N   ─► reads posts collection directly (NOT the listing) — unaffected
GET /es/blog/[category] ─► CategoryHeader from categories collection — unaffected
```

### Pattern 1: Dedicated folder route shadows the `[slug]` collection route
**What:** A `pages` doc with `slug:'blog'` is NOT rendered by `[locale]/[slug]/page.tsx`; the `[locale]/blog/` folder route wins Next.js route precedence (static segment > dynamic).
**When to use:** Every listing migration (54/55/57).
**Evidence:** `contact`, `privacy`, `terms` folders already coexist with `[slug]` and the pages collection — established, de-risked precedent.
**Consequence:** `[slug]/generateStaticParams` will emit `{slug:'blog'}` (only `'home'` is filtered), but Next never renders `[slug]` for it because the folder shadows it. Harmless. Optionally add `'blog'` to the filter for cleanliness.

### Pattern 2: Tag-cached page fetch mirroring `getCachedGlobal`
**What:** New utility `getCachedPageBySlug` in `src/utilities/` wrapping `payload.find({collection:'pages', where:{slug}})` in `unstable_cache` with tag `pages_<slug>`.
**Why not reuse `queryPageBySlug`:** That one is `cache()` (per-request only, draft-aware) — correct for the dynamic `[slug]` route, but for the ISR listing we want a durable `unstable_cache` tag so the afterChange hook can invalidate it, exactly like the global does today. This is the safest 1:1 replacement of `getCachedGlobal('blog-listing')`.
```typescript
// src/utilities/getPages.ts  (NEW) — mirrors src/utilities/getGlobals.ts
export const getCachedPageBySlug = (slug: string, depth = 2, locale?: 'en' | 'es') =>
  unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise })
      const res = await payload.find({
        collection: 'pages', where: { slug: { equals: slug } },
        depth, locale, limit: 1, pagination: false, overrideAccess: false,
      })
      return res.docs?.[0] ?? null
    },
    ['page', slug, String(depth), locale || 'es'],
    { tags: [`pages_${slug}`] },
  )
```
Note: `overrideAccess: false` returns only published docs (respects `authenticatedOrPublished` read access) — the published `/blog` must NOT show drafts. Live preview / draft rendering keeps flowing through the admin's own preview route, not this cached path.

### Pattern 3: Field-shape mapping global → page
The global is flat (`title`, `description`, `layout`); the page nests blocks under a `content` tab and adds a `hero` tab + required `title`.

| Global field | Page target | Note |
|--------------|-------------|------|
| `title` (localized) | `title` (localized, required) | direct copy |
| `description` (localized) | *(see below)* | Global's `description` is currently **not wired to meta** (`generateMeta` reads `doc.meta`, which the global lacks). On Pages it maps naturally to seoPlugin `meta.description` — a strict improvement. Recommend copying into `meta.description`. |
| `layout` (blocks) | `content.layout` (blocks, **required**) | direct copy of the blocks array per locale |
| — | `hero` | Leave empty/none; the listing's visible hero is the `ListingHero` **block** inside layout, not the page `hero` field. Keep `RenderHero` out of the `/blog` route (parity). |

### Anti-Patterns to Avoid
- **Rendering `page.hero` on `/blog`.** The listing hero is a layout block (`ListingHero`), not the collection `hero` tab. Rendering both would double the hero. `blog/page.tsx` must render ONLY `content.layout`, not `RenderHero`.
- **Switching `/blog` to `revalidatePath`-only invalidation.** Path-based revalidation across the dynamic `/[locale]/blog` segment is fragile; the tag approach matches today's global behavior exactly. Keep the tag.
- **Deleting the global this phase.** It is the rollback fallback until Phase 58.
- **Reusing `depth: 0`.** The global was fetched at depth 0, but blocks reference media/posts; the `[slug]` route uses `depth: 2`. Use `depth: 2` for the page fetch to populate block relations (ListingHero image, etc.).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Locale-aware writes in migration | Manual per-field locale objects | `payload.update({..., locale:'es'})` then `locale:'en'` | Payload localized fields are written one locale per call; two sequential updates is the documented pattern |
| Cache invalidation | Custom cache map | `unstable_cache` tag + `revalidateTag` | Already the project's global pattern |
| hreflang/canonical | New metadata code | Existing `generateMeta({doc, locale, path:'/blog'})` | Already correct per-locale; only pass the page doc instead of the global |
| Draft/preview fetch | New preview route | Existing `queryPageBySlug` + `LivePreviewListener` + `generatePreviewPath` | Pages collection already fully wired |

## Common Pitfalls

### Pitfall 1: `LatestBlogPosts` block missing from Pages
**What goes wrong:** If the current `blog-listing` global layout uses a `LatestBlogPosts` (`latestBlogPosts`) block, migrating the layout array into `pages.content.layout` will fail validation or drop the block — Pages' blocks whitelist does NOT include it.
**Root cause:** `pages.content.layout.blocks` includes `ListingHero`, `PostsGrid`, `BlogArchiveHeader`, `FeaturedBlogPosts` — but NOT `LatestBlogPosts`. The global's whitelist is `[ListingHero, PostsGrid, LatestBlogPosts, BlogArchiveHeader]`.
**How to avoid:** Add `import { LatestBlogPosts }` and insert into the `pages.content.layout` blocks array BEFORE the migration script runs. Then `npm run generate:types`. `RenderBlocks` already maps `latestBlogPosts`, so runtime rendering already works.
**Reusable insight for 55:** `CaseStudiesListing` global uses `[ListingHero, CaseStudiesGrid, LatestCaseStudies]`; Pages has `CaseStudiesGrid` + `FeaturedCaseStudies` but NOT `LatestCaseStudies`. Same gap — Phase 55 must add `LatestCaseStudies` to Pages.

### Pitfall 2: `content.layout` is `required: true`
**What goes wrong:** Creating the page doc without a non-empty layout throws a validation error.
**How to avoid:** Migration script must copy the global's layout array (non-empty) in the same create/update. Publish (`_status: 'published'`) so the public read (`overrideAccess:false`) returns it.

### Pitfall 3: Route precedence / generateStaticParams double-param
**What goes wrong:** Fear that `slug:'blog'` collides with the `/blog` folder or breaks `[slug]` static generation.
**Reality:** No collision — folder route shadows `[slug]`. `[slug]/generateStaticParams` emitting `blog` is inert. Optionally filter it out for tidiness.

### Pitfall 4: Localized blocks written to only one locale
**What goes wrong:** Script creates the doc with `locale:'es'` and forgets `en`, so `/en/blog` renders Spanish or empty blocks.
**How to avoid:** Read global for BOTH locales; write `title`/`description`/`layout` for `es` (create), then `payload.update` the same doc id with `locale:'en'`. Verify `/en/blog` parity.

### Pitfall 5: `no-store` / dynamic leak
**What goes wrong:** Introducing `draftMode()` or an uncached `payload.find` in the published path forces the route dynamic, losing `x-vercel-cache: HIT`.
**How to avoid:** The published `/blog` path must use only `getCachedPageBySlug` (no `draftMode()` on the public branch). Keep `export const revalidate = 3600` and `generateStaticParams` for `[{locale:'es'},{locale:'en'}]`. Verified: current blog routes contain NO `no-store`/`force-dynamic`.

## Exact Files To Touch

| File | Change |
|------|--------|
| `src/collections/Pages/index.ts` | Import + add `LatestBlogPosts` to `content.layout.blocks` (Phase 55 will add `LatestCaseStudies`). |
| `src/utilities/getPages.ts` (**NEW**) | `getCachedPageBySlug(slug, depth, locale)` — mirrors `getGlobals.ts`, tag `pages_<slug>`. |
| `src/app/(frontend)/[locale]/blog/page.tsx` | Replace `getCachedGlobal('blog-listing', 0, locale)` with `getCachedPageBySlug('blog', 2, locale)`; read `page.content.layout` (handle legacy-object guard already present); pass page doc to `generateMeta({doc, locale, path:'/blog'})`. Keep `revalidate`, `generateStaticParams`, JsonLd, schema. |
| `src/collections/Pages/hooks/revalidatePage.ts` | Add `revalidateTag('pages_' + doc.slug)` (covers new util for any slug, incl. `blog`). |
| `src/scripts/migrate-blog-listing-to-page.ts` (**NEW**) | One-off Local API migration (below). Add npm script `migrate:blog-listing`. |
| `src/payload-types.ts` | Regenerate via `npm run generate:types` after the Pages block change. |
| `src/app/(frontend)/[locale]/[slug]/page.tsx` | Optional cleanup: dead `slug === 'blog-listing'` branch in `generateMetadata` and add `'blog'` to `generateStaticParams` filter. Non-blocking. |

**Not touched (verified they don't read the listing global):** `blog/page/[pageNumber]/page.tsx` (reads `posts` directly, own `<h1>`), `blog/[category]/page.tsx` (uses `CategoryHeader` from `categories`). Only `/blog` itself switches source — no "all-together" coupling. This is a helpful simplification.

## Recommended Data-Migration Approach (reusable 54/55/57)

**Chosen: one-off Local API script** (safest — idempotent, preserves both locales, no manual re-entry, leaves global intact). MongoDB has no SQL migration files here, and existing scripts (`verify-authors.ts`, `syncKeywords.ts`) establish the `getPayload({config})` + dotenv bootstrap convention.

Script outline (`src/scripts/migrate-blog-listing-to-page.ts`):
```typescript
import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'; import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  const payload = await getPayload({ config })
  const SLUG = 'blog'
  // 1. Read source global per locale
  const es = await payload.findGlobal({ slug: 'blog-listing', locale: 'es', depth: 0 })
  const en = await payload.findGlobal({ slug: 'blog-listing', locale: 'en', depth: 0 })

  // 2. Idempotency: upsert by slug
  const existing = await payload.find({
    collection: 'pages', where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true,
  })

  const esData = {
    title: es.title ?? 'Blog', slug: SLUG, _status: 'published',
    content: { layout: es.layout ?? [] },
    meta: { description: es.description ?? undefined },
  }

  const doc = existing.docs[0]
    ? await payload.update({ collection: 'pages', id: existing.docs[0].id, locale: 'es',
        data: esData, overrideAccess: true, context: { disableRevalidate: true } })
    : await payload.create({ collection: 'pages', locale: 'es',
        data: esData, overrideAccess: true, context: { disableRevalidate: true } })

  // 3. Write the English locale onto the SAME doc
  await payload.update({ collection: 'pages', id: doc.id, locale: 'en', overrideAccess: true,
    context: { disableRevalidate: true },
    data: { title: en.title ?? 'Engineering Blog', content: { layout: en.layout ?? [] },
            meta: { description: en.description ?? undefined } } })

  payload.logger.info(`Migrated blog-listing → pages/${doc.id} (slug '${SLUG}')`)
  process.exit(0)
}
main()
```
- `context: { disableRevalidate: true }` prevents the afterChange hook firing mid-migration (hook guards on `context.disableRevalidate`).
- Idempotent: re-running upserts the same `slug:'blog'` doc.
- Global left untouched → instant rollback (revert `blog/page.tsx`) until Phase 58.
- **Verification step:** after run, curl `/es/blog` and `/en/blog`, diff rendered blocks vs. pre-migration.

**Alternatives considered:**
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local API script | Payload migration (`payload migrate`) | MongoDB adapter here has no migrations dir/workflow; heavier, no benefit |
| Local API script | Manual re-entry in admin | Error-prone, loses exact block data, two locales doubles risk |
| Local API script | Seed file | Seeds are for fresh envs; this is a prod data copy — script is targeted |

## ISR / Caching Verification

- `blog/page.tsx`: `export const revalidate = 3600` + `generateStaticParams` (es/en) → static ISR. Preserved.
- Replacement fetch `getCachedPageBySlug` uses `unstable_cache` (same primitive as `getCachedGlobal`) → still cacheable, no `no-store`. Preserved.
- Invalidation: `revalidatePage` afterChange already runs on Pages saves; add `revalidateTag('pages_' + doc.slug)`. On editing the blog page → tag `pages_blog` invalidates the cached read; existing `revalidatePath('/blog')` remains as belt-and-suspenders.
- Paginated `/blog/page/*` (`revalidate=600`) and category (`revalidate=3600`) don't read the listing → no revalidation coupling needed.
- **Confirmed no `no-store`/`force-dynamic`** anywhere under `blog/`.

## hreflang / canonical / lang

- `generateMeta` computes `alternates.canonical` + `languages{es,en,x-default}` from `path` (`/blog`) and `locale` — **independent of whether the doc is a global or a page**. Passing the page doc with `path:'/blog'` yields identical output. No regression.
- `<html lang>` is set by `[locale]/layout.tsx` from the route param, untouched by this change.
- Bonus: page docs carry seoPlugin `meta` (title/description/og), so `/blog` gains a real editable meta description it lacked as a global.

## Live Preview

- Pages collection already defines `admin.livePreview.url` and `admin.preview` via `generatePreviewPath({collection:'pages', slug})`.
- `generatePreviewPath` maps `pages` → prefix `''`, producing preview path `${localePrefix}/${slug}` = `/blog` (es) or `/en/blog` (en). **Correct out of the box** — the folder route serves it.
- Caveat: the published `/blog` route (via `getCachedPageBySlug`, no `draftMode`) won't render drafts. Live preview works through the admin iframe hitting `/next/preview` → draft cookie → the route must render draft content in preview. **Open question below** — confirm whether `blog/page.tsx` needs a `draftMode()`-gated draft branch (like `[slug]/page.tsx` has) for live preview to reflect unsaved autosave, or whether preview relies on the `[slug]` route. Recommendation: add a `draftMode()`-gated draft branch to `blog/page.tsx` that uses `queryPageBySlug` (draft-aware) + `LivePreviewListener`, matching `[slug]/page.tsx`, while the public branch stays cached. This keeps ISR on public and live preview on draft.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Current `blog-listing` global layout may include a `latestBlogPosts` block | Pitfall 1 | If absent, adding the block to Pages is still harmless (enables authoring) — low risk |
| A2 | `overrideAccess:false` on the cached fetch returns only published docs, hiding drafts on public `/blog` | Pattern 2 | If misconfigured, drafts could leak — verify with a draft doc |
| A3 | Live preview for `/blog` may need a draft-gated branch in `blog/page.tsx` | Live Preview | If Payload routes preview through `[slug]`, no change needed — confirm in discuss/plan |

## Open Questions

1. **Live preview draft branch** — Does `/blog` live preview require a `draftMode()` branch in `blog/page.tsx` (mirroring `[slug]/page.tsx`), or does the admin preview iframe resolve through a different route? Recommendation: add the draft branch to be safe; it doesn't affect the public ISR path.
2. **`description` → `meta.description` mapping** — Confirm the desired target for the global's `description` field. Recommended `meta.description` (seoPlugin); the discuss step should lock this.
3. **`[slug]` static param cleanup** — Add `'blog'` to the filter and remove the dead `slug==='blog-listing'` metadata branch now, or defer to Phase 58? Cosmetic; recommend defer to 58 to keep this phase's diff minimal.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| MongoDB (`DATABASE_URI`) | migration script, Local API | assumed via `.env` | — | none — required to run migration |
| tsx | run one-off script | ✓ | devDep | none |
| `PREVIEW_SECRET` | live preview | ✓ (already used) | — | — |

**Blocking:** Migration script needs a live DB connection (the same `.env` the app uses). No fallback — it's a data copy.

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `blog-listing` global (read-only, no drafts/preview/meta) | `pages` collection entry (drafts, autosave live preview, seoPlugin meta, versions) | Editors get preview + versioning + real meta description |

## Sources

### Primary (HIGH confidence)
- `src/globals/BlogListing/config.ts`, `hooks/revalidateBlogListing.ts` — source global + hook
- `src/app/(frontend)/[locale]/blog/page.tsx`, `blog/page/[pageNumber]/page.tsx`, `blog/[category]/page.tsx` — routes
- `src/app/(frontend)/[locale]/[slug]/page.tsx` — Pages fetch pattern (`queryPageBySlug`), dead `blog-listing` metadata branch
- `src/collections/Pages/index.ts` — Pages blocks whitelist, livePreview, versions/drafts
- `src/collections/Pages/hooks/revalidatePage.ts` — current revalidation (`revalidatePath`/`revalidateTag`)
- `src/utilities/getGlobals.ts` (`getCachedGlobal`), `generatePreviewPath.ts`, `generateMeta.ts`
- `src/blocks/RenderBlocks.tsx` — block map (confirms `latestBlogPosts` renders), `src/globals/CaseStudiesListing/config.ts` (Phase 55 parallel), `package.json`, `src/middleware.ts`, `src/scripts/verify-authors.ts` (script bootstrap convention)

## Metadata

**Confidence breakdown:**
- Mechanism/pattern: HIGH — all pieces read from source, precedent established (contact/privacy/terms)
- Data migration: HIGH — MongoDB confirmed, script convention confirmed, idempotent design
- ISR/caching: HIGH — no `no-store` verified, tag pattern matches existing global
- Live preview: MEDIUM — draft branch need is an open question (A3/Q1)

**Research date:** 2026-07-05
**Valid until:** ~2026-08-05 (stable internal codebase)
