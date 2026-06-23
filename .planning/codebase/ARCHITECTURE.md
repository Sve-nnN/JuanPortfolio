<!-- refreshed: 2026-06-22 -->
# Architecture

**Analysis Date:** 2026-06-22

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          Next.js 15 App Router                        │
│                         (React 19, RSC by default)                    │
├──────────────────────────┬────────────────────────────────────────-─┤
│   Frontend route group    │   Payload route group  │  Plain API group │
│   `(frontend)/`           │   `(payload)/`          │  `app/api/`      │
│   public site + sitemaps  │   /admin + REST/GraphQL │  AI/SEO endpoints│
└───────────┬──────────────┴───────────┬─────────────┴────────┬────────┘
            │ middleware.ts             │ getPayload(config)    │
            │ (locale rewrite/redirect) │                       │
            ▼                           ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Payload CMS 3.61 (Local API)                    │
│  Collections · Globals · Blocks · Lexical RichText · Plugins · Hooks  │
│  `src/payload.config.ts`                                              │
└───────────────────────────────────┬───────────────────────────────-─┘
                                     │ mongooseAdapter
                                     ▼
┌──────────────────────────────┬──────────────────────────────────────┐
│   MongoDB (content store)     │   Vercel Blob (media) + Cloudinary    │
│   `DATABASE_URI`              │   (delivery/OG transforms)            │
└──────────────────────────────┴──────────────────────────────────────┘

   Side channel: content/posts/*.md  ──(tsx scripts)──▶  Payload Local API
                 (Obsidian vault, source-of-truth markdown sync pipeline)
```

The app is a bilingual (es default / en) Next.js 15 site backed by Payload CMS on MongoDB, deployed on Vercel. Content can be authored in the Payload admin OR in a local Obsidian markdown vault (`content/`) that is pushed into Payload via TypeScript sync scripts. A large suite of SEO/AI tooling (GSC, DinoRank, SerpAPI, internal-linking, schema generation) wraps the content layer.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Payload config | Wires collections, globals, plugins, db, localization, email, storage, MCP | `src/payload.config.ts` |
| Middleware | Locale routing: 301 strip `/es`, rewrite bare paths to `/es/*`, set `x-pathname` | `src/middleware.ts` |
| Frontend layout | Root HTML, fonts, providers, org/website JSON-LD, analytics, metadata base | `src/app/(frontend)/layout.tsx` |
| Post page | Single blog post render + schema + redirects + TOC | `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx` |
| Dynamic page | Generic Payload `pages` doc render via blocks | `src/app/(frontend)/[locale]/[slug]/page.tsx` |
| RenderBlocks | Maps `blockType` → lazy block component | `src/blocks/RenderBlocks.tsx` |
| Metadata builder | Title/description/canonical/hreflang/OG per doc | `src/utilities/generateMeta.ts` |
| Schema builder | BlogPosting/Breadcrumb/@graph JSON-LD per doc | `src/utilities/generateSchema.ts`, `src/utilities/schema/` |
| Sitemap helpers | Pure URL builders for child sitemaps + hreflang | `src/utilities/sitemap.ts` |
| Content sync | Markdown ↔ Payload reconciliation engine | `src/scripts/syncContent.ts`, `src/scripts/sync/` |
| SEO services | GSC/DinoRank/SerpAPI/indexing adapters + services | `src/scripts/seo/`, `src/scripts/services/` |

## Pattern Overview

**Overall:** Server-component-first Next.js App Router on top of Payload CMS Local API, with an out-of-band markdown content pipeline and a heavy SEO automation layer.

**Key Characteristics:**
- React Server Components by default; data fetched via `getPayload({ config })` directly inside server pages (no intermediate API layer for page rendering).
- Block-driven page composition: `pages`/globals store a `layout` array of blocks; `RenderBlocks` lazy-loads each block component via `next/dynamic`.
- Localization handled at two levels: Payload field localization (`localized: true`) and Next.js URL routing (`[locale]` segment + middleware).
- SEO is first-class: dedicated route handlers for sitemaps/robots/llms.txt, per-doc metadata + JSON-LD, and a large `src/scripts/seo` automation toolkit.

## Layers

**Routing / Middleware:**
- Purpose: Map URLs to locales; consolidate canonical URLs.
- Location: `src/middleware.ts`
- Behavior: skips `/api`, `/_next`, `/admin`, sitemaps, files; 301-redirects `/es` and `/es/*` to unprefixed; rewrites any other unprefixed path to `/es/<path>` internally; sets `x-pathname` header (read by layout to derive locale).

**Presentation (App Router):**
- Purpose: Render pages as RSC.
- Location: `src/app/(frontend)/[locale]/`
- Contains: route segments (`blog`, `case-studies`, `author(s)`, `search`, legal, `[slug]`), `page.tsx` (server) + optional `page.client.tsx`.
- Depends on: Payload Local API, blocks, heros, utilities.

**Domain / CMS:**
- Purpose: Define content model and business rules.
- Location: `src/collections/`, `src/globals/`, `src/blocks/*/config.ts`, `src/fields/`.
- Note: a partial DDD experiment exists under `src/domain/` and `src/domains/` (entity/repository/use-cases for caseStudy, author, user, media, posts) but the live model is the Payload collections.

**Persistence:**
- MongoDB via `@payloadcms/db-mongodb` (`mongooseAdapter`, `maxPoolSize: 5`).
- Media stored in Vercel Blob (`@payloadcms/storage-vercel-blob`), delivered/transformed via Cloudinary.

**Tooling / Scripts:**
- Location: `src/scripts/` (run with `tsx -r dotenv/config`). Content sync, SEO sync, keyword research, internal linking, post generation.

## Data Flow

### Page request (blog post)

1. Request hits `src/middleware.ts` → rewrites/redirects for locale, sets `x-pathname`.
2. App Router resolves `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx`.
3. `generateStaticParams()` pre-builds params for all published posts × `['en','es']`.
4. Page calls `getPayload({ config })` → `payload.find({ collection: 'posts', where: { slug }, locale })`.
5. If category segment is a raw Mongo ObjectID, `redirect()` to canonical category slug.
6. Builds breadcrumbs → `generateSchema()` → optionally appends FAQPage node from `extractFaqsFromLexical`.
7. Renders `PostHero`, `RichText` (Lexical), `TableOfContents`, `AuthorCard`, `RelatedPostsServer`, plus `<JsonLd>`.
8. `generateMetadata()` separately fetches the doc and returns `generateMeta()` output (title/desc/canonical/hreflang/OG).

### Dynamic page / globals

1. `src/app/(frontend)/[locale]/[slug]/page.tsx` resolves a Payload `pages` doc (or Home global for `/`).
2. Hero rendered by `RenderHero`, body by `RenderBlocks` (maps `block.blockType` → dynamic component).

### Content sync (markdown → CMS)

1. Author edits `content/posts/<category>/<slug>.md` (gray-matter frontmatter + body) in Obsidian.
2. `npm run sync` / `import:posts` runs `src/scripts/syncContent.ts` (`ContentSyncManager`).
3. State tracked in `content/content-sync.json` (per-file `id`, `slug`, `locale`, `lastLocalHash`, `lastRemoteUpdatedAt`) → detects local vs remote changes for conflict handling.
4. `sync/postParser.ts` parses/validates/builds post data; `sync/payloadRepository.ts` writes via Local API; `sync/localeDetector.ts` resolves locale (`idioma` frontmatter legacy field).

### SEO data sync

1. `npm run sync:gsc` (`src/scripts/seo/sync-gsc.ts`) pulls Search Console metrics into `GSCMetrics`/`PageMetrics`/`KeywordMetrics` collections via adapters in `src/scripts/seo/adapters/`.
2. Post save hooks (`syncKeywordsAfterPostSave`, `triggerCWVScan`, `updateInternalLinksCount`) keep derived metrics current.

**State Management:**
- Server: Payload documents in MongoDB; cached reads via `unstable_cache` / `getCachedGlobal`.
- Client: React context providers (`src/providers/`: Theme, Locale, Scroll, HeaderTheme) for UI state only.

## Rendering Model

- **Default:** React Server Components, statically generated where `generateStaticParams` is present (posts, pages, categories, authors).
- **ISR:** Blog listing uses `export const revalidate = 3600` (`src/app/(frontend)/[locale]/blog/page.tsx`). Sitemaps/llms.txt use `unstable_cache` with `revalidate: 3600` and tag-based invalidation.
- **On-demand revalidation:** collection `afterChange` hooks call `revalidatePath` (`src/utilities/revalidate.ts`, `src/collections/*/hooks/revalidate*.ts`).
- **Draft/Live preview:** `draftMode()` toggles unpublished reads; `LivePreviewListener` + Payload `livePreview` breakpoints; preview routes under `src/app/(frontend)/next/preview`.

## Key Abstractions

**Block:**
- Purpose: composable page section; config (`config.ts`) + React (`Component.tsx`).
- Examples: `src/blocks/*` (HeroHome, Content, FAQ, FeaturedWorks, ...).
- Pattern: registered in collection/global `layout` field; rendered by `src/blocks/RenderBlocks.tsx`.

**Schema generator:**
- Purpose: typed Schema.org JSON-LD via `schema-dts`.
- Examples: `src/utilities/schema/*`, composed by `generateSchema.ts`, emitted by `src/components/JsonLd.tsx`.

**Globals:**
- Purpose: singletons for site-wide config/content.
- Examples: `Header`, `Footer`, `Home`, `BlogListing`, `CaseStudiesListing`, `Styles`, `SiteSettings`, `LLM` (`src/globals/`, `src/Header/`, `src/Footer/`).

## Entry Points

**Frontend site:**
- Location: `src/app/(frontend)/` (root `layout.tsx`, `page.tsx`, `[locale]/`).
- Triggers: HTTP requests filtered by `src/middleware.ts`.

**Payload admin / API:**
- Location: `src/app/(payload)/admin/`, `src/app/(payload)/api/` (REST `[...slug]`, GraphQL, page-metrics scan).
- Config: `src/payload.config.ts`.

**SEO/AI route handlers:**
- `src/app/robots.ts`, `src/app/(frontend)/(sitemaps)/*`, `src/app/(frontend)/llms.txt/route.ts`, `src/app/api/seo/indexing`, `src/app/api/internal-links`, `src/app/api/dinorank/redactar`, `src/app/api/autocomplete`.

**CLI scripts:**
- `src/scripts/*` via npm scripts (`sync`, `sync:gsc`, `sync:keywords`, `audit:urls`, `create-post`, `scrape:dinorank`, `fix:links`, `export:keywords`).

## SEO Architecture

- **Sitemaps:** master index at `/sitemap.xml` (`(sitemaps)/sitemap.xml/route.ts` → `getChildSitemapUrls`), child sitemaps `pages-/posts-/categories-/authors-sitemap.xml`. Pure builders in `src/utilities/sitemap.ts` (`buildPagesSitemap`, `buildAlternateRefs`) emit es+en variants with hreflang `<xhtml:link>` annotations; cached via `unstable_cache`.
- **robots.txt:** `src/app/robots.ts` allows `/`, disallows `/admin` and `/api/`, advertises all five sitemaps.
- **JSON-LD:** `generateSchema.ts` builds an `@graph` (BlogPosting/Article + Breadcrumb + Organization publisher); FAQPage appended when ≥2 FAQs present in Lexical content; Organization + WebSite emitted in root layout; flattened by `src/components/JsonLd.tsx`. SEO plugin also exposes a per-doc custom `jsonLD` field.
- **Metadata / hreflang:** `generateMeta.ts` builds canonical + `alternates.languages` (`es`, `en`, `x-default`); root layout sets `metadataBase`, default OG, twitter, icons.
- **OG images:** Cloudinary-driven; explicit OG coerced to 1200×630 JPG (`getCloudinaryOgJpg`), else title overlaid on hero/fallback (`getCloudinaryOgWithTitle`) in `src/utilities/cloudinaryUrl.ts`.
- **llms.txt:** `src/app/(frontend)/llms.txt/route.ts` builds text from `LLM` global + 10 recent posts via `src/utilities/llmsTxt.ts`.
- **SEO plugin:** `@payloadcms/plugin-seo` on `pages`, `posts`, `case-studies` + globals; `generateTitle`/`generateURL` in `src/plugins/index.ts`.

## Architectural Constraints

- **Locale convention:** `es` is default and served WITHOUT prefix; `en` lives under `/en`. Any `/es` URL is 301'd to the unprefixed canonical (middleware). Code repeatedly hardcodes `['en','es']` and `localePrefix = locale === 'es' ? '' : '/en'`.
- **Locale source in layout:** root layout derives locale from `x-pathname` header (set by middleware), not from a route param.
- **Sitemap/llms routes import config directly** (`../../../../payload.config` or `@/payload.config`) rather than `@payload-config` in some handlers — keep both import styles working.
- **Global state:** UI-only React context providers; no shared mutable server singletons beyond Payload's cached client.
- **DB pool:** `maxPoolSize: 5` — heavy parallel scripts must throttle (uses `p-limit`).

## Anti-Patterns

### Raw Mongo ObjectID leaking into category URLs

**What happens:** posts whose first category slug is a 24-hex ObjectID render URLs like `/blog/<objectid>/<slug>`.
**Why it's wrong:** non-canonical, duplicate-content URLs; breaks breadcrumbs/sitemaps.
**Do this instead:** the post page detects `MONGO_ID_RE` and 301-redirects to the real category slug (`src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx`); ensure categories always have human slugs (`src/scripts/fix-categories.ts`).

### Duplicating doc fetch in page + generateMetadata

**What happens:** both the page body and `generateMetadata` call `payload.find` for the same post.
**Why it's wrong:** double DB round-trips per render.
**Do this instead:** wrap the query in React `cache()` (already used in `[slug]/page.tsx`) and share it.

### Legacy `meta_group` field name

**What happens:** metadata sometimes stored under `meta_group` instead of `meta`.
**Why it's wrong:** schema/meta builders must defensively check both.
**Do this instead:** normalize on `meta`; `generateMeta.ts`/`generateSchema.ts` already fall back to `meta_group`.

## Error Handling

**Strategy:** fail-soft on the public site; `notFound()` for missing docs; route handlers wrap Payload calls in try/catch and return safe fallbacks (llms.txt returns a stub string; sitemaps return empty sets).

**Patterns:**
- `notFound()` / `redirect()` from `next/navigation` for missing/non-canonical content.
- `.catch(() => null)` around global fetches in the layout to avoid crashing the shell.
- API routes return `NextResponse.json({ error }, { status })` with `payload.auth` gating.

## Cross-Cutting Concerns

**Logging:** `req.payload.logger` server-side; `console.*` in scripts/route handlers.
**Validation:** Payload field schema + collection hooks; sync pipeline has `validatePost` (`src/scripts/sync/postParser.ts`) and `src/scripts/validate-post.ts`.
**Authentication:** Payload auth (`Users` collection); API routes call `payload.auth({ headers })` and 401 when no user; access control in `src/access/`.
**i18n:** static UI strings in `src/i18n/translations.ts` (`t(locale, key)`); content localized per Payload field.
**Analytics/perf:** Vercel Analytics + Speed Insights, GA/GTM via `@next/third-parties`, Ahrefs analytics, Cloudinary preconnect, Speculation Rules prefetch (root layout).

---

*Architecture analysis: 2026-06-22*
