# Codebase Structure

**Analysis Date:** 2026-06-22

## Directory Layout

```text
JuanPortfolio/
├── src/
│   ├── app/                      # Next.js App Router (3 route groups)
│   │   ├── (frontend)/           # Public bilingual site + sitemaps + llms.txt
│   │   ├── (payload)/            # Payload admin UI + REST/GraphQL API
│   │   ├── api/                  # Plain Next API routes (SEO/AI/autocomplete)
│   │   └── robots.ts             # robots.txt generator
│   ├── collections/              # Payload collections (content model)
│   ├── globals/                  # Payload globals (singletons)
│   ├── Header/ Footer/           # Header & Footer globals + components
│   ├── blocks/                   # Composable page blocks (config + Component)
│   ├── heros/                    # Hero variants + RenderHero
│   ├── components/               # Shared React components (UI, JsonLd, RichText)
│   ├── fields/                   # Reusable Payload field defs (slug, lexical)
│   ├── access/                   # Payload access-control fns
│   ├── hooks/                    # Cross-collection Payload hooks
│   ├── plugins/                  # Payload plugin wiring (SEO, redirects, search…)
│   ├── utilities/                # Server/client helpers (meta, schema, sitemap…)
│   │   └── schema/               # Schema.org JSON-LD generators (schema-dts)
│   ├── i18n/                     # Static UI translations
│   ├── providers/                # React context providers (Theme/Locale/Scroll)
│   ├── search/                   # Search plugin field overrides + beforeSync
│   ├── endpoints/seed/           # Seed data + images
│   ├── domain/ domains/          # Partial DDD experiment (not the live model)
│   ├── scripts/                  # tsx CLI tooling (sync, SEO, linking, gen)
│   ├── constants/ fonts/ types/  # Constants, local fonts, shared types
│   ├── payload.config.ts         # Payload root config
│   └── middleware.ts             # Locale routing middleware
├── content/                      # Obsidian markdown vault (source-of-truth)
│   ├── posts/<category>/*.md     # Published post markdown (gray-matter)
│   ├── drafts/ templates/ productos/ scripts/
│   └── *.json                    # Sync + keyword + dinorank state files
├── tests/ (e2e, int, unit)       # Playwright + Vitest
├── public/                       # Static assets (favicons, logo, overrides)
├── scripts/                      # Repo-level (non-app) scripts
├── .planning/                    # GSD planning + this codebase map
├── juan-portfolio/               # Nested legacy/secondary copy (ignore for app)
├── next-sitemap.config.cjs       # next-sitemap (postbuild) config
├── next.config.js / tsconfig.json / vitest.config.mts / playwright.config.ts
└── package.json                  # pnpm workspace, npm-run scripts
```

## Directory Purposes

**`src/app/(frontend)/`:**
- Purpose: public site, bilingual under `[locale]/`.
- Key files: `layout.tsx` (root shell), `[locale]/page.tsx` (home), `[locale]/[slug]/page.tsx` (dynamic pages), `[locale]/blog/[category]/[slug]/page.tsx` (post), `(sitemaps)/*` route handlers, `llms.txt/route.ts`, `next/preview/`.

**`src/app/(payload)/`:**
- Purpose: Payload admin + API. `admin/[[...segments]]/page.tsx`, `api/[...slug]/route.ts`, `api/graphql/route.ts`, `api/page-metrics/scan*`.

**`src/app/api/`:**
- Purpose: bespoke endpoints — `autocomplete`, `seo/indexing`, `internal-links` (+`apply`), `dinorank/redactar`. Auth via `payload.auth`.

**`src/collections/`:**
- Content model. `Pages`, `Posts` (with `hooks/`), `Media`, `Categories`, `Users`, `Works`, `CaseStudies`, `Clientes`, `Testimonials`, plus SEO metric collections `KeywordMetrics`, `PageMetrics`, `GSCMetrics`, `BrokenLinks`, `AdBanners`.

**`src/blocks/`:**
- One folder per block (`config.ts` = Payload schema, `Component.tsx` = React). Registered in `src/blocks/RenderBlocks.tsx` (lazy via `next/dynamic`).

**`src/globals/`:**
- Singletons: `Home`, `BlogListing`, `CaseStudiesListing`, `Styles`, `SiteSettings`, `LLM` (+ `Header`/`Footer` at `src/Header`, `src/Footer`).

**`src/utilities/`:**
- Pure helpers: `generateMeta.ts`, `generateSchema.ts`, `sitemap.ts`, `cloudinaryUrl.ts`, `llmsTxt.ts`, `revalidate.ts`, Lexical extractors (`extractHeadings`, `extractFaqs`, `extractText`), `getURL.ts`, `getGlobals.ts`. `schema/` holds Schema.org node generators.

**`src/scripts/`:**
- CLI tooling run via `tsx`. Subfolders: `sync/` (markdown↔CMS), `seo/` (+ `adapters/`), `services/`, `internal-linking/` (+ `semantic/`), `engine/`, `dinorank/`, `utils/`, `create-post/`, `config/`.

**`content/`:**
- Obsidian vault. `posts/<category>/*.md` are source-of-truth; `content-sync.json` tracks sync state; many `*.json` hold keyword/dinorank/gaps state.

## Key File Locations

**Entry Points:**
- `src/middleware.ts`: locale routing.
- `src/app/(frontend)/layout.tsx`: root HTML/providers/metadata/schema.
- `src/payload.config.ts`: CMS config.

**Configuration:**
- `next.config.js`, `tsconfig.json` (`@/*` → `src/*`, `@payload-config`), `next-sitemap.config.cjs`, `tailwind.config.*`, `vitest.config.mts`, `playwright.config.ts`, `.env` (present; secrets — not read).

**Core Logic:**
- Rendering: `src/app/(frontend)/[locale]/**/page.tsx`, `src/blocks/RenderBlocks.tsx`, `src/heros/RenderHero.tsx`.
- SEO: `src/utilities/generateMeta.ts`, `src/utilities/generateSchema.ts`, `src/utilities/sitemap.ts`, `src/app/robots.ts`.
- Content pipeline: `src/scripts/syncContent.ts` + `src/scripts/sync/*`.

**Testing:**
- `tests/int/`, `tests/e2e/`, `tests/unit/`.

## Naming Conventions

**Files:**
- Server pages: `page.tsx`; client islands: `page.client.tsx`.
- Blocks: folder `PascalCase/` with `config.ts` + `Component.tsx`.
- Collections: `PascalCase/index.ts` (or `PascalCase.ts` for simple ones) with `hooks/` subfolder.
- Utilities: `camelCase.ts`; schema generators `generateXxxSchema.ts`.
- Scripts: `kebab-case.ts` (e.g. `sync-gsc.ts`, `fix-internal-links.ts`).
- Each route segment ships a `README.md` documenting it.

**Directories:**
- Route groups in parentheses: `(frontend)`, `(payload)`, `(sitemaps)`.
- Dynamic segments in brackets: `[locale]`, `[slug]`, `[category]`, `[[...segments]]`.
- Content posts grouped by category: `content/posts/<category>/`.

**Imports / aliases:**
- `@/*` → `src/*`; `@payload-config` → `src/payload.config.ts` (some handlers import the config via relative path instead).

## Where to Add New Code

**New page block:**
- Create `src/blocks/<Name>/config.ts` + `src/blocks/<Name>/Component.tsx`.
- Register the component in `src/blocks/RenderBlocks.tsx` and add the block to the relevant collection/global `layout` field.

**New content collection:**
- Add `src/collections/<Name>/index.ts`, register it in `src/payload.config.ts` `collections` (and `mcpPlugin` if it should be MCP-exposed). Run `npm run generate:types`.

**New frontend route:**
- Add under `src/app/(frontend)/[locale]/<segment>/page.tsx` (respect locale convention: es unprefixed, en under `/en`). Add a `README.md`. If indexable, register the path in `STATIC_PAGE_PATHS` in `src/utilities/sitemap.ts`.

**New SEO/AI endpoint:**
- Add `src/app/api/<name>/route.ts`; gate with `payload.auth`.

**New script/tool:**
- Add `src/scripts/<name>.ts` (or a subfolder); wire an npm script using `tsx -r dotenv/config`.

**New schema type:**
- Add `src/utilities/schema/generate<Name>Schema.ts`, export from `src/utilities/schema/index.ts`.

**Shared helpers:**
- Pure server/client utilities → `src/utilities/`; UI components → `src/components/`.

## Special Directories

**`.next/`:** build output. Generated, not committed.

**`content/`:** committed Obsidian vault; source-of-truth markdown + sync/keyword state JSON. Committed (mind the DIRTY working-tree caveat — stage only your own files).

**`juan-portfolio/`:** nested secondary/legacy copy with its own `.next`, `logs`, reports. Not the active app root; ignore for app changes.

**`src/app/(payload)/admin/importMap.js`:** generated by `payload generate:importmap`. Regenerate, do not hand-edit.

**`tmp-test-sync/`, `tmp-unit-test-content/`, `logs/`:** scratch/test artifacts.

---

*Structure analysis: 2026-06-22*
