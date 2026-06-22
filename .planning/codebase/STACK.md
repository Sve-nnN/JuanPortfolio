# Technology Stack

**Analysis Date:** 2026-06-22

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (`src/**/*.ts`, `src/**/*.tsx`), strict mode enabled (`tsconfig.json`)
- TSX/React 19 - UI components and Next.js App Router routes (`src/app/`, `src/components/`, `src/blocks/`)

**Secondary:**
- SCSS/Sass 1.93.2 - Component and global styles alongside Tailwind (`src/**/*.scss`)
- JavaScript (CJS/MJS) - Config files only (`next-sitemap.config.cjs`, `src/cssVariables.js`)
- Python - Standalone content tooling outside the app (`content/extract_keywords.py`, `content/fix_links.py`, `content/process_links.py`) — not part of the build

## Runtime

**Environment:**
- Node.js `^20` (declared in `package.json` engines; CI runs Node 20.x)
- Next.js runtime targeting ES2022 (`tsconfig.json` target/lib)

**Package Manager:**
- Declared: `pnpm@9.15.4` (`packageManager` field); CI uses pnpm v10 (`.github/workflows/build-validation.yml`)
- Actual install on Vercel/dev: `npm install --legacy-peer-deps` (`vercel.json`); several scripts call `npm run ...`
- Lockfile: `pnpm-lock.yaml` present (~545k). Mixed npm/pnpm usage is a known caveat
- `pnpm.onlyBuiltDependencies`: `sharp`, `esbuild`, `unrs-resolver`
- Peer dependency overrides for React 19 and `@modelcontextprotocol/sdk@1.25.3`

## Frameworks

**Core:**
- Next.js 15.2.8 - App Router, React Server Components, Turbopack dev (`--turbo`), wrapped with `withPayload` (`next.config.ts`)
- React 19.2.0 / React DOM 19.2.0 - UI layer
- Payload CMS 3.61.1 - Headless CMS, admin panel, and API; integrated via `@payloadcms/next` (`src/payload.config.ts`)

**Testing:**
- Vitest 4.0.3 - Integration/unit tests (`vitest.config.mts`), with `@vitejs/plugin-react` and `vite-tsconfig-paths`
- Playwright 1.56.1 - E2E tests (`playwright.config.ts`)
- Testing Library (`@testing-library/react` 16.3.0, `@testing-library/jest-dom` 6.9.1), jsdom 27.0.1
- Coverage via `@vitest/coverage-v8` 4.0.3

**Build/Dev:**
- TypeScript 5.9.3, ESLint 9.38.0 (`eslint-config-next` 15.2.3), Prettier 3.6.2
- Tailwind CSS 3.4.18 (+ `@tailwindcss/typography`, `tailwindcss-animate`), PostCSS 8.5.6, Autoprefixer 10.4.21
- `tsx` 4.21.0 - Runs standalone TypeScript scripts (`src/scripts/*`)
- `cross-env` 10.1.0 - Cross-platform env vars in scripts
- `critters` 0.0.25 - Critical CSS inlining

## Key Dependencies

**Payload ecosystem (all pinned 3.61.1):**
- `@payloadcms/db-mongodb` - MongoDB/Mongoose adapter
- `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/admin-bar`, `@payloadcms/live-preview-react`
- `@payloadcms/richtext-lexical` (Lexical 0.35.0 editor)
- `@payloadcms/storage-vercel-blob` - Media storage on Vercel Blob
- `@payloadcms/email-resend` - Transactional email via Resend
- `@payloadcms/payload-cloud`, `@payloadcms/translations`
- Plugins: `plugin-form-builder`, `plugin-nested-docs`, `plugin-redirects`, `plugin-search`, `plugin-seo`, `plugin-mcp`
- `@nouance/payload-dashboard-analytics` 0.3.0 - Admin analytics dashboard

**Data layer:**
- `mongodb` 6.16.0, `mongoose` 8.15.1 - Database driver/ODM
- `graphql` 16.8.2 - Payload GraphQL API

**AI / content generation:**
- `@anthropic-ai/sdk` 0.78.0 - Claude (content generation/rewrite scripts)
- `openai` 6.25.0 - OpenAI API
- `@google/generative-ai` 0.24.1 - Gemini
- `@xenova/transformers` 2.17.2 - Local embeddings/transformers (in-browser/Node)
- `natural` 8.1.0, `pluralize` 8.0.0 - NLP/keyword tooling

**SEO / data tooling:**
- `googleapis` 171.4.0, `google-auth-library` 10.5.0 - Google Search Console, Google Ads, indexing
- `next-sitemap` 4.2.3 - Sitemap generation (`postbuild`)
- `schema-dts` 1.1.5 - Typed Schema.org JSON-LD
- `linkinator` 7.5.3 - Broken-link crawling
- `marked` 17.0.1, `turndown` 7.2.2, `gray-matter` 4.0.3 - Markdown ↔ HTML / frontmatter for content sync

**UI / UX:**
- Radix UI primitives (accordion, checkbox, label, select, slot)
- `framer-motion` 12.29.2, `lenis` 1.3.17 (smooth scroll), `@splidejs/react-splide` (carousel)
- `lucide-react` 0.548.0 (icons), `geist` 1.5.1 (font), `recharts` 3.7.0 (charts)
- `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`
- `prism-react-renderer` 2.3.1 (code highlighting)
- `react-hook-form` 7.65.0, `react-turnstile` 1.1.5 (Cloudflare Turnstile)

**Media / infra:**
- `sharp` 0.34.4 - Image processing
- `cloudinary` 2.9.0 - Image CDN/transformations
- `@aws-sdk/client-s3` 3.1026.0 - S3-compatible storage access
- `@vercel/analytics` 1.6.1, `@vercel/speed-insights` 1.2.0, `@next/third-parties` 16.1.6 (GA/GTM)
- `resend` 6.9.2 - Email API

**CLI / scripting:**
- `commander` 14.0.3, `@clack/prompts` 1.0.1, `enquirer` 2.4.1 - Interactive script TUIs
- `dotenv` 17.2.3, `glob` 13.0.6, `p-limit` 7.3.0

## Configuration

**Build / framework configs:**
- `next.config.ts` - Redirects (www→non-www, legacy `/posts/*`→`/blog/*`, IE, sitemap), image remote patterns, `withPayload` wrapper
- `src/payload.config.ts` - Collections, globals, localization (es default + en), MongoDB adapter, plugins, email, jobs
- `next-sitemap.config.cjs` - Post-build sitemap config
- `vercel.json` - `framework: nextjs`, `buildCommand: npm run build`, `installCommand: npm install --legacy-peer-deps`, `outputDirectory: ../.next`
- `tsconfig.json` - Strict TS, path aliases `@/*`→`./src/*`, `@payload-config`, `payload-types`
- `redirects.json` - Generated at build time via `npm run redirects` (`src/scripts/fetch-redirects.ts`)
- `vitest.config.mts`, `playwright.config.ts` - Test runners
- Tailwind/PostCSS configs + `src/cssVariables.js`

**Environment:**
- Configured via `.env` (present in repo root, contents not committed-safe; no `.env.example` checked in)
- `PAYLOAD_SECRET`, `DATABASE_URI` are required for the app/admin to boot
- See INTEGRATIONS.md for the full env var inventory

## Build Scripts (`package.json`)

| Script | Purpose |
|--------|---------|
| `build` | `npm run redirects` then `next build` (4GB heap via NODE_OPTIONS) |
| `vercel-build` | Alias of `build` |
| `postbuild` | `next-sitemap` sitemap generation |
| `dev` | Redirects + `next dev --turbo` |
| `dev:prod` | Clean build then `next start` |
| `start` | `next start` |
| `lint` / `lint:fix` | `next lint` |
| `test` | Runs `test:int` then `test:e2e` |
| `test:int` | Vitest run (`vitest.config.mts`) |
| `test:e2e` | Playwright |
| `generate:types` | `payload generate:types` → `src/payload-types.ts` |
| `generate:importmap` | `payload generate:importmap` |
| `redirects` | `tsx src/scripts/fetch-redirects.ts` |
| `import:posts` / `sync` | Content sync (`src/scripts/syncContent.ts`) |
| `sync:keywords` | `src/scripts/syncKeywords.ts` |
| `sync:gsc` | Google Search Console sync (`src/scripts/seo/sync-gsc.ts`) |
| `audit:urls` | `src/scripts/audit-urls.ts` |
| `fix:links` | `src/scripts/fix-internal-links.ts` |
| `create-post` | `src/scripts/create-post.ts` |
| `scrape:dinorank` | `src/scripts/scrape-dinorank.ts` |
| `export:keywords` | `src/scripts/export-keywords-csv.ts` |
| `utils` | Interactive TUI (`src/scripts/utils/tui.ts`) |

## Platform Requirements

**Development:**
- Node.js ^20, pnpm 9.x (or npm with `--legacy-peer-deps`)
- MongoDB instance (`DATABASE_URI`)
- `.env` with secrets (Payload, DB, integrations)

**Production:**
- Vercel (Next.js framework preset, `vercel.json`)
- MongoDB (e.g. Atlas), Vercel Blob storage, Resend, Cloudinary
- Browserslist target: `since 2023, not dead`

---

*Stack analysis: 2026-06-22*
