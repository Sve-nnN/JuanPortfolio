# External Integrations

**Analysis Date:** 2026-06-22

## APIs & External Services

**AI / Content Generation:**
- Anthropic Claude - Content generation/rewriting
  - SDK: `@anthropic-ai/sdk`
  - Auth: `ANTHROPIC_API_KEY`
  - Used in: `src/scripts/create-post/llm-adapters.ts`, content flywheel services
- OpenAI - Content/embeddings
  - SDK: `openai`
  - Auth: `OPENAI_API_KEY`
- Google Gemini (Generative AI)
  - SDK: `@google/generative-ai`
  - Auth: `GOOGLE_AI_API_KEY`
- Local transformers - `@xenova/transformers` for on-device embeddings (no external auth)

**SEO / SERP / Keyword data:**
- DinoRank - Keyword research scraped via authenticated session (no public API)
  - Client: `src/scripts/dinorank/DinoRankApiClient.ts`, `src/scripts/services/DinoRankService.ts`, `DinoBrainApiAdapter.ts`
  - Session persisted to `content/dinorank-kw-session.json`
  - Entry: `npm run scrape:dinorank`, route `src/app/api/dinorank/redactar/route.ts`
- SerpApi - SERP data
  - Adapter: `src/scripts/seo/adapters/SerpApiAdapter.ts`
  - Auth: `SERPAPI_API_KEY`; local cache `.serpapi-cache.json` (`src/scripts/seo/SerpCache.ts`)
- DataForSEO - SERP/keyword metrics
  - Adapter: `src/scripts/seo/adapters/DataForSeoAdapter.ts`
  - Auth: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `DATAFORSEO_SANDBOX`
- Google Search Console - Performance/indexing data
  - SDK: `googleapis` / `google-auth-library`
  - Adapter: `src/scripts/seo/adapters/GSCAdapter.ts`; sync `src/scripts/seo/sync-gsc.ts`
  - Auth: `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_PROPERTY_URL`
- Google Ads - Keyword volume/planner
  - Adapter: `src/scripts/seo/adapters/GoogleAdsAdapter.ts`
  - Auth: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_REFRESH_TOKEN`
- Google Indexing API
  - Adapter: `src/scripts/seo/adapters/IndexingAdapter.ts`; route `src/app/api/seo/indexing/route.ts`
- Google PageSpeed Insights - Core Web Vitals
  - Auth: `GOOGLE_PSI_API_KEY`; update `src/scripts/seo/update-cwv.ts`, route `src/app/(payload)/api/page-metrics/scan/route.ts`
- Bing Webmaster
  - Auth: `BING_WEBMASTER_API_KEY`

## CMS

- Payload CMS 3.61.1 (`src/payload.config.ts`)
  - Admin panel + REST + GraphQL API
  - Collections: Pages, Posts, Media, Categories, Users, Works, CaseStudies, Clientes, AdBanners, Testimonials, KeywordMetrics, PageMetrics, GSCMetrics, BrokenLinks
  - Globals: Header, Footer, Home, BlogListing, CaseStudiesListing, Styles, SiteSettings, LLM
  - Localization: `es` (default) + `en`, fallback enabled
  - Plugins (`src/plugins/index.ts`): redirects, nested-docs, SEO, form-builder, search; MCP plugin in `payload.config.ts`

## Data Storage

**Database:**
- MongoDB via Mongoose
  - Adapter: `@payloadcms/db-mongodb` (`mongooseAdapter`, maxPoolSize 5)
  - Connection: `DATABASE_URI`

**File / Media Storage:**
- Vercel Blob - Primary media storage for the `media` collection
  - Adapter: `@payloadcms/storage-vercel-blob`
  - Auth: `BLOB_READ_WRITE_TOKEN` (storage disabled if unset)
- Cloudinary - Image CDN / OG image transformations
  - SDK: `cloudinary`; Auth: `CLOUDINARY_URL`
- AWS S3 (`@aws-sdk/client-s3`) - S3-compatible access for tooling

**Caching:**
- Local file cache for SerpApi (`.serpapi-cache.json`)
- Next.js route revalidation / ISR (revalidate hooks, `src/hooks/`)

## Authentication & Identity

- Payload auth - Admin/users collection (`Users.slug`), `PAYLOAD_SECRET`
- Cloudflare Turnstile - Bot protection on contact form
  - SDK: `react-turnstile`; component `src/components/Turnstile/index.tsx`
  - Used in `src/blocks/ContactFormBlock/Component.tsx`, `src/app/(frontend)/[locale]/actions/sendEmail.ts`
  - Auth: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`
- Google OAuth/service accounts - For GSC, Google Ads, Indexing (refresh tokens / service account keys)
- Preview auth - `PREVIEW_SECRET` for draft preview routes (`src/app/(frontend)/next/preview/route.ts`)

## Email

- Resend - Transactional email
  - Adapter: `@payloadcms/email-resend` (`src/payload.config.ts`), `resend` SDK
  - Auth: `RESEND_SECRET`
  - Defaults: `EMAIL_FROM` (no-reply@juan-tech.com), `EMAIL_FROM_NAME` (JuanTech)
  - Contact form: `src/app/(frontend)/[locale]/actions/sendEmail.ts`; test `src/scripts/test-email.ts`

## Monitoring & Analytics

- Vercel Analytics (`@vercel/analytics`) and Speed Insights (`@vercel/speed-insights`)
- Google Analytics / GTM via `@next/third-parties`
  - Auth: `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`
- Payload Dashboard Analytics (`@nouance/payload-dashboard-analytics`)
- Custom GSC admin dashboard (`src/components/admin/GSCDashboard`, registered in `payload.config.ts`)

## MCP (Model Context Protocol)

- Payload MCP server exposed via `@payloadcms/plugin-mcp` (`src/payload.config.ts`)
  - Server name: "Juan Portfolio MCP" v1.0.0
  - Exposes collections: pages, posts, media, categories, users, works, case-studies, clientes, ad-banners, testimonials, page-metrics
  - Pinned SDK: `@modelcontextprotocol/sdk@1.25.3` (peer dep override)

## CI/CD & Deployment

**Hosting:**
- Vercel (`vercel.json`, `framework: nextjs`, install `npm install --legacy-peer-deps`)

**CI Pipeline (`.github/workflows/`):**
- `build-validation.yml` - Build + tests on push/PR to `main`/`develop` (Node 20, pnpm 10)
- `validate-branch-name.yml` - Branch naming enforcement
- Gemini automation: `gemini-dispatch.yml`, `gemini-invoke.yml`, `gemini-review.yml`, `gemini-scheduled-triage.yml`, `gemini-triage.yml`

**Cron / Jobs:**
- Payload jobs queue (`jobs` in `payload.config.ts`), authorized via `CRON_SECRET` Bearer header (Vercel Cron)
- Sitemap regeneration via `postbuild`

## Webhooks & Callbacks

**Incoming:**
- Payload REST/GraphQL API (`src/app/(payload)/api/[...slug]/route.ts`, `/api/graphql`)
- SEO/indexing route (`src/app/api/seo/indexing/route.ts`)
- Page metrics scan routes (`src/app/(payload)/api/page-metrics/scan`, `scan-all`)
- Internal-links + autocomplete + dinorank routes (`src/app/api/internal-links/*`, `/api/autocomplete`, `/api/dinorank/redactar`)
- Preview/exit-preview/seed (`src/app/(frontend)/next/*`)
- Sitemaps + `llms.txt` (`src/app/(frontend)/(sitemaps)/*`, `src/app/(frontend)/llms.txt/route.ts`)

**Outgoing:**
- Google Indexing API submissions
- DinoRank authenticated POSTs (login/keyword scraping)

## Environment Configuration

**Required env vars (names only — values in untracked `.env`):**

| Variable | Purpose |
|----------|---------|
| `PAYLOAD_SECRET` | Payload encryption secret (required) |
| `DATABASE_URI` | MongoDB connection (required) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage |
| `CLOUDINARY_URL` | Cloudinary credentials |
| `RESEND_SECRET`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | Resend email |
| `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_SITE_URL`, `VERCEL_PROJECT_PRODUCTION_URL` | Canonical URLs |
| `PREVIEW_SECRET`, `CRON_SECRET` | Preview/cron auth |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY` | AI providers |
| `SERPAPI_API_KEY` | SerpApi |
| `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `DATAFORSEO_SANDBOX` | DataForSEO |
| `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_PROPERTY_URL`, `NEXT_PUBLIC_GSC_PROPERTY_URL` | Google Search Console |
| `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_REFRESH_TOKEN` | Google Ads |
| `GOOGLE_PSI_API_KEY` | PageSpeed Insights |
| `BING_WEBMASTER_API_KEY` | Bing Webmaster |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID` | Analytics |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `CONTENT_DIR` | Content markdown directory for sync scripts |

**Secrets location:**
- Local: `.env` (untracked); no `.env.example` committed
- CI: GitHub Actions secrets (`.github/workflows/build-validation.yml`)
- Production: Vercel environment variables

---

*Integration audit: 2026-06-22*
