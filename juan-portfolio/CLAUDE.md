# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

1. Before writing any code, describe your approach and wait for aproval.
2. If the requirements I give you are ambiguous, as clarifying questions before  writing any code.
3.  After you finish writing any code, list the edge cases and suggest test cases to cover them.
4. If a task requires changes to more than 3 files, stop and break it into smaller tasks firsts.
5. When there's a bug, start by writing a test that reproduces it. Then fix it until the test passes.
6. Every time I correct you, reflect on what you did wrong and come up with a plan to never make the same mistake again.

## Commands

```bash
# Development
pnpm dev                          # Start dev server with Turbopack (also runs fetch-redirects)
pnpm build                        # Production build (also runs fetch-redirects + postbuild sitemap)
pnpm start                        # Start production server
pnpm lint                         # Run Next.js linter
pnpm lint:fix                     # Run linter and auto-fix

# Type generation (run after changing Payload collection/field schemas)
pnpm generate:types               # Regenerate src/payload-types.ts
pnpm generate:importmap           # Regenerate Payload import map

# Testing
pnpm test:int                     # Run unit + integration tests (Vitest, jsdom)
pnpm test:e2e                     # Run end-to-end tests (Playwright, requires running dev server)
pnpm test                         # Run both int and e2e

# Run a single Vitest test file
pnpm test:int -- tests/unit/utilities/myUtil.test.ts

# Content automation (DinoRank + LLM)
pnpm create-post                              # Generate a post: keyword selection → DinoBrain → LLM frontmatter → sync
pnpm create-post -- --provider=openai         # Use OpenAI instead of Anthropic for frontmatter
pnpm create-post -- --provider=gemini         # Use Gemini for frontmatter
pnpm create-post -- --re-export               # Re-export a post from history without re-generating
pnpm create-post -- --keyword="big-o"         # Skip interactive selection and use this keyword directly
pnpm scrape:dinorank "keyword"                # Scrape KW Research metrics and write to keywords.md
pnpm scrape:dinorank "keyword" --country=mx   # Specify country (default: es)
pnpm scrape:dinorank "keyword" --debug        # Save screenshots and DOM dumps to /tmp/

# Content sync (requires .env with DATABASE_URI)
pnpm sync status                  # Show local vs. remote diff
pnpm sync push                    # Push all local Markdown changes to CMS
pnpm sync push -- --post=filename.md  # Push a single file
pnpm sync push -- --force         # Overwrite remote regardless of conflicts
pnpm sync pull                    # Pull CMS changes down to local Markdown
pnpm sync:keywords                # Sync content/keywords.md to KeywordMetrics collection
pnpm run sync:gsc                 # Sync Google Search Console data

# SEO / maintenance scripts (use npx tsx directly)
npx tsx src/scripts/search-keyword.ts "keyword"
npx tsx src/scripts/update-seo-metrics.ts
npx tsx src/scripts/build-internal-links.ts [--classify] [--cluster-only] [--locale en|es] [--dry-run]
npx tsx src/scripts/seo/update-cwv.ts
pnpm sync:keywords [--fetch-serp] [--verbose]
```

## Architecture

This project is a **monorepo where Next.js 15 (App Router) and Payload CMS 3 share the same codebase**. The Next.js frontend and the Payload admin/API are both served from the same `src/` tree, wrapped together by `withPayload` in `next.config.js`.

### Key Directories

| Path | Purpose |
|---|---|
| `src/payload.config.ts` | Single source of truth for all Payload CMS configuration (collections, globals, plugins, localization, DB) |
| `src/payload-types.ts` | Auto-generated TypeScript types — never edit by hand, regenerate with `pnpm generate:types` |
| `src/collections/` | Payload collection definitions (Posts, Pages, Works, CaseStudies, Testimonials, KeywordMetrics, etc.) |
| `src/globals/` | Payload globals (Home, BlogListing, CaseStudiesListing, Header, Footer, Styles, SiteSettings, LLM) |
| `src/blocks/` | Page-builder blocks (config + React component per block). All registered in `RenderBlocks.tsx` via `next/dynamic` |
| `src/plugins/index.ts` | All Payload plugins (SEO, redirects, forms, search, nested-docs, MCP) |
| `src/app/(frontend)/` | Public-facing Next.js pages, uses `[locale]` dynamic segment |
| `src/app/(payload)/` | Payload admin and API routes |
| `src/middleware.ts` | Locale routing: rewrites `/path` → `/es/path`; `/en/path` passes through unchanged |
| `src/i18n/translations.ts` | Frontend string translations (`t(locale, key)`) — NOT Payload's own i18n |
| `src/scripts/` | CLI scripts: `syncContent.ts`, `syncKeywords.ts`, SEO tools, internal linking |
| `src/scripts/sync/` | Sync module layer: `localeDetector`, `postParser`, `stateManager`, `payloadRepository`, `types` |
| `src/domains/` | Domain-driven modules (content, user) with application/domain/infrastructure layers |
| `src/utilities/` | Shared utilities (meta generation, schema.org, Lexical crawler, CMS data fetchers) |
| `content/posts/` | Markdown source files — **source of truth for blog content** |
| `content/keywords.md` | SEO keyword tracking table, synced to KeywordMetrics collection |
| `tests/unit/` | Vitest unit tests |
| `tests/int/` | Vitest integration tests |
| `tests/e2e/` | Playwright end-to-end tests |

### Routing & Localization

- **Default locale**: `es` (Spanish). Routes without a prefix are internally rewritten to `/es/...` by the middleware.
- **English**: served under `/en/...` prefix.
- **Payload localization**: `localized: true` on individual fields in collection/global configs. **Never localize `slug` fields or block-level layout arrays** — only text, textarea, and richText fields.
- **Frontend strings**: use `t(locale, key)` from `src/i18n/translations.ts`.
- The `[locale]` segment in `src/app/(frontend)/[locale]/` captures the active locale for all localized frontend pages.

### Page Builder (Blocks)

Pages and globals are built by composing blocks. Each block lives in `src/blocks/<BlockName>/` with:
- `config.ts` — Payload field definition (the `blockType` key must match a key in `blockComponents`)
- `Component.tsx` — React server component

All blocks are lazy-loaded in `src/blocks/RenderBlocks.tsx`. To add a new block: create the folder, register in `RenderBlocks.tsx`, and add to the relevant collection/global config.

### Content Automation Scripts

Two scripts automate the end-to-end SEO content workflow. Both share the DinoRank account state persisted in `content/dinorank-state.json` and expose their helper functions as named exports for unit testing.

#### create-post (`src/scripts/create-post.ts`)

Orchestrates the full post-creation pipeline:

1. Reads `content/keywords.md` via `parseKeywords()` and filters for keywords with no existing post file.
2. Launches a Playwright browser and generates article content via DinoRank's DinoBrain tool using a `BrainState` state machine (`NEEDS_LOGIN`, `OVERLAY_VISIBLE`, `BRAIN_INPUT_EMPTY`, `BRAIN_INPUT_FILLED`, `NO_CREDITS_TABLE_VISIBLE`, `GENERATION_PROGRESS`, `GENERATION_FINISHED`).
3. Calls the configured LLM adapter (`AnthropicAdapter`, `OpenAiAdapter`, or `GeminiAdapter` from `src/scripts/create-post/llm-adapters.ts`) to generate SEO-optimized frontmatter YAML.
4. Assembles the final Markdown file via `assemblePost()` and writes it to `content/posts/<category>/<slug>.md`.
5. Runs `pnpm sync push` via `spawnSync` to upload to Payload CMS.

LLM provider is selected via `--provider=anthropic|openai|gemini` flag or the `LLM_PROVIDER` environment variable. Accounts are rotated automatically when `postsGenerated >= 5`.
pnpm sync:keywords [--fetch-serp] [--suggestions] [--discover] [--max-accounts=N]
...
#### scrape-dinorank (`src/scripts/scrape-dinorank.ts`)

Extracts keyword metrics (volume, competition, CPC) from DinoRank's Keyword Research tool via **pure HTTP API** (no Playwright). Uses `DinoRankApiClient` which handles cookies, session, polling, tracking, and logout.

**Flow per execution:**
1. Checks `content/dinorank-kw-cache.json` — returns cached data if less than 30 days old.
2. Picks an account from `content/dinorank-accounts-registry.json` (highest `kwCredits`, not excluded).
3. `DinoRankApiClient.login()`: `POST /ajax/login.php` → `GET /homed/` → `GET /keyword-research/`.
4. `DinoRankApiClient.search()`: polls `POST /ajax/kresearch.php` → `POST /ajax/kresearchTrackeo.php`.
5. `DinoRankApiClient.logout()`: `POST /ajax/cierra.php` always called in `finally`.
6. Updates `content/keywords.md` **atomically** after each keyword is processed.

**Account management:**
- **Onboarding**: New accounts complete a 5-step onboarding via `completeOnboarding()` to activate 150 credits.
- **Trial**: Accounts have a 7-day trial period; `loadRegistry` filters out expired or broken accounts.
- **Cleanup**: Any account with login failure is automatically deleted from the registry.

**DinoRank API endpoints used:**

| Method | URL | Purpose |
|---|---|---|
| `GET` | `/login/` | Get initial session cookies (PHPSESSID, csrf_token) |
| `POST` | `/ajax/login.php` | Authenticate. Body: `nombreUsuario=&clave=&permanecer=si&elemento=&tiempo=<ts>` |
| `GET` | `/keyword-research/` | Initialize KW research session (required before search) |
| `POST` | `/ajax/kresearch.php` | Launch keyword search. Body: `keyword=&keyword_pais=&keyword_idioma=es&...` |
| `POST` | `/ajax/cierra.php` | **Logout** (always call on exit). Body: `t=<timestamp>` |
| `GET` | `/registro/?codPromo=dinoTrial25` | Get registration session (account creation only) |
| `POST` | `/ajax/registro1.php` | Create account. Body: `email=&clave=&elemento=&telefono=%2B34666000000` |
| `POST` | `/ajax/tracking/agregarKeyword.php` | Onboarding step 1 |
| `POST` | `/ajax/enviaOnboardingPasosDetalle.php` | Onboarding steps (paso=3, paso=5) |

**Cookie handling:** Use `headers.getSetCookie()` (Node 18.14+) — `headers.get('set-cookie').split(',')` breaks on date values in cookie attributes (e.g. `expires=Thu, 05-Mar-2026`).

**Error classes:**
- `DeviceConflictError(email)` — login response doesn't include `status":"activo"` and hints at session conflict; account excluded, session cleared, retry with next account.
- `NoCreditsError(email)` — `kresearch.php` response has no valid JSON; account excluded, new account created via API, registered in state + registry.

**Account registry:** `content/dinorank-accounts-registry.json`. Fields: `email`, `password`, `kwCredits`, `contentCredits`, `keywords[]`, `content[]`, `lastUsed`.

**Exported functions (used in unit tests):** `updateMarkdownTable()`, `isCacheValid()`, `loadCache()`, `saveCache()`, `scrapeOnce()`, `scrapeWithRetry()`, `DeviceConflictError`, `NoCreditsError`, `internals` (object with spyable references to `scrapeOnce`, `ensureAccount`, `clearSession`, `createDinoRankAccount`).

**Key constants:** `CACHE_VALIDITY_DAYS = 30`, max 10 retry attempts in `scrapeWithRetry`.

### Content Sync System

The sync system is split into a thin CLI orchestrator (`src/scripts/syncContent.ts`) and a dedicated module layer under `src/scripts/sync/`.

**Module responsibilities:**

| Module | Responsibility |
|---|---|
| `sync/localeDetector.ts` | `detectLocale(filePath, frontmatterLocale?)` — filename suffix wins (`.en.md` → `en`, `.es.md` → `es`), then frontmatter `idioma`, then `es` as default |
| `sync/postParser.ts` | `parsePostFile()`, `validatePost()`, `buildPostData()` — pure functions, no side effects |
| `sync/stateManager.ts` | `loadState()`, `saveState()`, `getAllMdFiles()`, `calculateHash()` — loads and migrates `content/content-sync.json` |
| `sync/payloadRepository.ts` | All Payload SDK calls behind a `PayloadRepository` class; single generic `resolveByField()` replaces per-collection resolver duplication |
| `sync/types.ts` | `FileState`, `SyncState`, `ParsedPost`, `PostFrontmatter`, `ResolvedIds`, `PayloadPostData` |

**Bilingual file naming convention:**

| Filename pattern | Locale |
|---|---|
| `article.md` | Spanish (default, backward compatible; also respects `idioma:` frontmatter) |
| `article.en.md` | English — filename suffix takes precedence over any frontmatter `idioma` value |
| `article.es.md` | Spanish (explicit) |

Files sharing the same base slug push to the same Payload document under different locales. The state file (`content/content-sync.json`) migrates legacy `idioma` fields to `locale` transparently on first load.

**Key design decisions:**
- Locale detection order: filename suffix → frontmatter `idioma` → site default `es`
- `buildPostData()` is a pure function; it receives pre-resolved relationship IDs and returns the Payload data payload
- State is written after every successful push to prevent data loss on partial runs

### Topic Cluster System

The internal linking system enforces a hub-and-spoke topic cluster model. Pillar pages are comprehensive, broad-keyword articles (3,000+ words) that link out to their satellites. Satellite pages are focused, long-tail articles that link back to their pillar.

**Frontmatter fields added to every post:**

```yaml
contentRole: pillar      # 'pillar' | 'satellite' | 'standalone'
pillarSlug: guia-seo     # slug of the parent pillar (satellites only)
```

**FrontmatterTagger inference rules** (applied only when `contentRole` is absent):
1. Existing `clusterType: Pillar` in frontmatter → `pillar` (legacy migration)
2. Body word count >= 3,000 → `pillar`
3. Title matches `/guía|guide|complete|definitiva|ultimate|manual/i` → `pillar`
4. Otherwise → `satellite`

**Module responsibilities:**

| Module | Responsibility |
|---|---|
| `internal-linking/topicCluster.ts` | `buildClusterMap()`, `getMissingClusterLinks()`, `getClusterSummaries()` — pure functions with injectable `readFile` for testability |
| `internal-linking/FrontmatterTagger.ts` | `tagFile()`, `tagDirectory()` — writes `contentRole` to frontmatter in-place, does not overwrite existing values |

**Structural link rules enforced by `LinkInjector.applyClusterLinks()`:**
- Every satellite must contain a link to its pillar's URL.
- Every pillar must contain a link to each of its satellites' URLs.
- When no natural keyword mention is found in the body, a `## See Also` section is appended.

**Locale isolation:** `ContentScanner.isDifferentLocale()` prevents `es` posts from linking to `en` posts and vice-versa. Locale resolution for `KeywordExtractor` follows the same filename-first order as the sync system.

**CLI usage:**

```bash
# Tag unclassified posts with contentRole (preview first)
npx tsx src/scripts/build-internal-links.ts --classify --dry-run
npx tsx src/scripts/build-internal-links.ts --classify

# Enforce structural cluster links only (no keyword scan)
npx tsx src/scripts/build-internal-links.ts --cluster-only

# Full run scoped to one locale
npx tsx src/scripts/build-internal-links.ts --locale es

# Full run with dry-run preview
npx tsx src/scripts/build-internal-links.ts --dry-run
```

**Workflow for a new cluster:**
1. Write or identify the pillar article; set `contentRole: pillar` in frontmatter.
2. For each satellite, set `contentRole: satellite` and `pillarSlug: <pillar-slug>`.
3. Run `build-internal-links.ts --dry-run` to review the cluster health report.
4. Run without `--dry-run` to apply structural and keyword links.

### Payload Plugins (registered in `src/plugins/index.ts`)

- `@payloadcms/plugin-seo` — SEO tab on Posts, Pages, CaseStudies, and listing globals
- `@payloadcms/plugin-redirects` — DB-backed redirects, fetched at build time via `src/scripts/fetch-redirects.ts`
- `@payloadcms/plugin-search` — Full-text search over Posts
- `@payloadcms/plugin-nested-docs` — Hierarchical categories
- `@payloadcms/plugin-mcp` — MCP server exposing collections to AI tools
- `@payloadcms/storage-vercel-blob` — Production media storage (enabled when `BLOB_READ_WRITE_TOKEN` is set)

### Environment Variables

Required in `.env`:
- `DATABASE_URI` — MongoDB connection string
- `PAYLOAD_SECRET` — CMS auth secret
- `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_PROPERTY_URL` — Google Search Console service account
- `NEXT_PUBLIC_GSC_PROPERTY_URL` — Base URL for GSC page mapping
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (optional; local dev uses local storage)
- `RESEND_SECRET`, `EMAIL_FROM`, `EMAIL_FROM_NAME` — Transactional email

### TypeScript Conventions

- Strict mode is enabled — no `any`. Use type assertions only when unavoidable.
- Path alias `@/*` maps to `src/*`.
- After any schema change in a collection or global, run `pnpm generate:types` before writing frontend code that consumes the changed types.
