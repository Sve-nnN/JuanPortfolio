# JuanTech / JuanPortfolio

A high-performance, enterprise-grade portfolio and blog platform built with Next.js and Payload CMS.

This project is a modern web application designed to showcase a professional portfolio and host a content-rich blog. It combines the power of **Next.js 15 (App Router)** for a high-performance frontend with **Payload CMS** for a flexible, headless content management backend.

## Features

- **Performance First**: Built on Next.js 15 with Turbopack, optimized for speed and SEO.
- **Algorithmic SEO 2026**: Advanced NLP integration for entity-based internal linking and SGE optimization.
- **Headless CMS**: Powered by Payload CMS (MongoDB), offering a customizable admin panel.
- **Rich Content Management**:
  - **Blog**: Full-featured blog with categories, authors, and rich text editing.
  - **Portfolio**: Showcase projects and case studies with dedicated collections.
  - **Page Builder**: Flexible layout building blocks (Hero, Content, Media, CTA) for dynamic page creation.
- **Markdown Importer**: Robust utility to migrate content from Markdown files with automated categorization, author resolution, and SEO generation.
- **SEO Optimized**: Built-in SEO plugin, meta tag management, and sitemap generation.
- **GSC Integrated**: Direct integration with Google Search Console for performance monitoring.
- **Modern UI**: Styled with Tailwind CSS and Shadcn UI components for a responsive design.
- **Internationalization**: Full support for multiple languages (English & Spanish).

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **CMS**: [Payload CMS](https://payloadcms.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) / [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (running locally or via Atlas)
- pnpm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/juantech/JuanPortfolio.git
    cd JuanPortfolio
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Setup Environment:**
    Copy the example environment file and configure your variables (MongoDB URI, Payload Secret, GSC Credentials, etc.):

    ```bash
    cp .env.example .env
    ```

4.  **Run Development Server:**

    ```bash
    pnpm dev
    ```

    The app will be available at `http://localhost:3000`.
    The Admin Panel is at `http://localhost:3000/admin`.

## Content Synchronization System (pSEO-ready)

This project features a bidirectional synchronization engine designed to keep local Markdown files and Payload CMS documents in perfect sync. This utility is located at `src/scripts/syncContent.ts`.

### Key Features
- **Git-like Workflow**: Supports `status`, `push`, `pull`, and `fetch`.
- **Bidirectional Conversion**: Automatically transforms Markdown to Lexical (CMS) and Lexical back to Markdown.
- **Keyword Management**: Synchronize `keywords.md` directly to the CMS and track performance.
- **Automatic Linking**: Markdown keywords are automatically resolved to Payload document IDs for deep SEO tracking.
- **Bilingual Support**: English posts use the `.en.md` file suffix; Spanish posts use `.md` or `.es.md`. Locale is detected from the filename before falling back to the `idioma` frontmatter field, ensuring backward compatibility with existing content.
- **Modular Architecture**: The engine is composed of focused modules under `src/scripts/sync/` — `localeDetector`, `stateManager`, `postParser`, and `payloadRepository` — each independently testable.

### Bilingual File Naming Convention

| File suffix | Locale | Notes |
| :---------- | :----- | :---- |
| `article.md` | `es` | Default. All existing posts are backward compatible. |
| `article.es.md` | `es` | Explicit Spanish designation. |
| `article.en.md` | `en` | English variant of the same article. |

### Command Line Interface

| Command                               | Description                                                                         |
| :------------------------------------ | :---------------------------------------------------------------------------------- |
| `pnpm sync status`                    | Shows local vs remote change status.                                                |
| `pnpm sync push [--post=<filename.md>] [--force]` | Uploads local Markdown changes (optionally for a specific post) and links keywords to entries. `--force` overwrites remote content. |
| `pnpm sync pull`                      | Downloads remote CMS changes to local Markdown files.                               |
| `pnpm sync:keywords [--fetch-serp] [--verbose]` | Synchronizes the `keywords.md` table with the KeywordMetrics collection. Optionally enriches with SerpAPI (PAA, AI Overviews, Competitors). |
| `npx tsx src/scripts/search-keyword.ts "keyword"` | Searches for a keyword in the local keywords.md file and returns all its data. |
| `pnpm run sync:gsc`                   | Syncs Search Console data and aggregates it into the KeywordMetrics.                |
| `pnpm sync push --force`              | Overwrites remote CMS content with local files regardless of conflicts.             |

---

## JuanTech Content Engine (Unified CLI)

The project includes a centralized orchestration engine that unifies all automation scripts into a single, modular CLI. This engine manages the full lifecycle of content from research to publication and optimization.

### Key Commands

| Command | Description |
| :--- | :--- |
| `pnpm engine research "<keyword>"` | Researches metrics using DinoRank and updates `keywords.md`. |
| `pnpm engine automate "<keyword>"` | **The Flywheel**: Runs Research → Content Generation → AI Enrichment → CMS Sync → Internal Linking. |
| `pnpm engine sync <push|pull|status>` | Managed content synchronization with Payload CMS. |
| `pnpm engine links [--locale <es|en>]` | Optimizes and enforces internal linking across all posts. |

### Architecture (Service-Oriented)

The engine is built using a service-oriented architecture located in `src/scripts/services/`:

- **KeywordService**: Manages the `keywords.md` source of truth and metrics.
- **DinoRankService**: Keyword research and AI suggestions via DinoRank HTTP API.
- **DinoBrainApiAdapter**: Content generation via DinoRank's DinoBrain tool (pure HTTP, no Playwright).
- **PostService**: Handles frontmatter AI generation (LLM) and Markdown assembly.
- **SyncService**: Automates the transfer of content between local files and the CMS.
- **LinkService**: Programmatically enforces topic cluster rules and NLP-based internal links.

### DinoBrain Content Generation (API-based)

`DinoBrainApiAdapter` orchestrates article generation via DinoRank's DinoBrain HTTP API:

| Method | URL | Purpose |
| :----- | :-- | :------ |
| `GET` | `/dinobrain/` | Initialize session, extract `contentCredits` from `Consumos restantes: N` |
| `POST` | `/ajax/generaContenido.php` | Start generation. Body: `keyword=&contexto=&exclusiones=&numPalabras=&imagenes=no`. Response: plain numeric ID (e.g. `304927`) — **not** JSON (API change, 2026-03-13). |
| `POST` | `/ajax/controlIA.php` | Poll status. Body: `idContenido=<id>`. Finished when response contains `finalizado` or `100%`. |
| `POST` | `/ajax/obtieneContenidoGenerado.php` | Download result. Body: `id=<id>&modo=undefined&keyword=`. Returns full HTML page. |

**Content extraction (2026-03-13):** `obtieneContenidoGenerado.php` now returns the full DinoRank page HTML, not just the article. Extract the article from `<div id="textodelcontenido">` using JSDOM. The `<h1>` inside this div is used as the post title and removed from the body HTML.

**Multi-account fallback:** If a `login()` call fails for the first account with `contentCredits > 0`, the adapter iterates through all available accounts until one succeeds.

### Keyword Pivot

After keyword research, `ContentFlywheelService` calls `DinoRankService.getSuggestions()` to get AI-suggested alternative keywords via `kresearchIAsimilares.php`. Each keyword is scored as:

```
score = volume / competition_weight
competition_weight: Baja=1, Media=2, Alta=3 (or unknown=2)
```

If the best alternative scores **more than 50% better** than the researched keyword, the pipeline pivots to the alternative. This automatically optimizes for lower-competition, higher-volume opportunities. The pivot decision is logged as `[Flywheel] Pivoted keyword: "X" → "Y"`.

### Usage Example

```bash
# Trigger the full content flywheel for a new topic
pnpm tsx src/scripts/engine.ts automate "patrones de diseño en react" --provider anthropic
```

---

## Content Generation Pipeline

### Overview

`src/scripts/create-post.ts` automates the end-to-end workflow for creating SEO-optimized blog posts. It coordinates three systems in sequence: keyword selection from `content/keywords.md`, content generation via DinoRank's DinoBrain tool (Playwright automation), and frontmatter generation via a configurable LLM provider.

### Workflow

1. Select a keyword from `keywords.md` that does not yet have a corresponding post file.
2. Open a DinoRank browser session and generate the article body using DinoBrain with a custom writing persona and style guide.
3. Pass the generated content and keyword metadata to the configured LLM to produce SEO-optimized frontmatter: `title`, `metaDescription`, `primary_keywords`, `semantic_keywords`, `contentRole`, `pillarSlug`, and `relatedPosts`.
4. Write the assembled Markdown file to `content/posts/<category>/<slug>.md`.
5. Run `pnpm sync push` automatically to upload the post to Payload CMS.

### LLM Providers

| Flag | Provider | Environment variable |
| :--- | :------- | :------------------- |
| `--provider=anthropic` (default) | Claude (claude-sonnet-4-6) | `ANTHROPIC_API_KEY` |
| `--provider=openai` | GPT-4o-mini | `OPENAI_API_KEY` |
| `--provider=gemini` | Gemini 2.0 Flash | `GOOGLE_AI_API_KEY` |

The active provider can also be set via the `LLM_PROVIDER` environment variable.

### Account Management

DinoRank accounts are persisted in `content/dinorank-state.json`. Each account supports up to 5 content generations. When credits are exhausted the script creates a new account interactively (manual CAPTCHA step required). Previous generations are stored in a history array for re-export without re-generating content via `--re-export`.

### Usage

```bash
pnpm create-post
pnpm create-post -- --provider=openai
pnpm create-post -- --provider=gemini --keyword="big-o notation"
pnpm create-post -- --re-export
```

---

## Keyword Research Automation

### Overview

`src/scripts/scrape-dinorank.ts` extracts keyword metrics — search volume, competition index (0–1), and CPC — from DinoRank's Keyword Research tool via **pure HTTP API** (no Playwright). Results are written back to the `Volume`, `Difficulty`, and `CPC` columns in `content/keywords.md` and cached locally for 30 days.

### API Endpoints

| Method | URL | Purpose |
| :----- | :-- | :------ |
| `GET` | `/login/` | Obtain session cookies (`PHPSESSID`, `csrf_token`) |
| `POST` | `/ajax/login.php` | Authenticate. Body: `nombreUsuario=&clave=&permanecer=no&elemento=&tiempo=<ts>`. Success: response includes `"status":"activo"`. Use `permanecer=no` (not `si`) to create short-lived sessions (~20-30 min server-side). |
| `GET` | `/homed/` | Post-login redirect; confirms session is active |
| `GET` | `/keyword-research/` | Initialize KW research session (required before search) |
| `POST` | `/ajax/kresearch.php` | Launch keyword search. Body: `keyword=&keyword_pais=&keyword_idioma=es&...`. Retry on no-JSON response (server still processing). |
| `POST` | `/ajax/kresearchIAsimilares.php` | AI-suggested alternative keywords. Body: `keyword=<kw>&keyword_pais=<COUNTRY>&keyword_idioma=<lang>`. Same response format as `kresearch.php`. |
| `POST` | `/ajax/cierra.php` | **Logout** — always called on exit. Body: `t=<timestamp>`. Critical: must call to close the server-side session, otherwise the next login from a different location triggers `device_conflict`. |
| `GET` | `/registro/?codPromo=dinoTrial25` | Begin account registration flow |
| `POST` | `/ajax/registro1.php` | Create account. Body: `email=&clave=&elemento=&telefono=%2B34666000000` |
| `POST` | `/ajax/tracking/agregarKeyword.php` | Onboarding step 1 |
| `POST` | `/ajax/enviaOnboardingPasosDetalle.php` | Onboarding steps (paso=3, paso=5) |

### Response Parsing

`kresearch.php` and `kresearchIAsimilares.php` return a string with a URL prefix before the JSON payload:

```
https://visibilidad.dinorank.com/...{"status":"OK","total_results":0,"message":"<HTML table>"}
```

Parse with: `raw.slice(raw.indexOf('{'))` then `JSON.parse()`. **`total_results` is always 0** regardless of actual results (API change, 2026-03-13) — do not use it as a signal. The `message` field always contains the full HTML table with all results when `status === "OK"`. Retry only when the response contains no JSON at all (server still processing).

**Table column order** (10-column layout, updated 2026-03-13):

| Index | Header | Example value |
| :---- | :----- | :------------ |
| 0 | *(checkbox)* | — |
| 1 | Palabras clave | `algoritmos y estructuras de datos` |
| 2 | Vol. | `1400` |
| 3 | Tendencia | *(sparkline graph)* |
| 4 | Snippets | *(snippet types)* |
| 5 | Intención | *(search intent)* |
| 6 | CPC | `0.20` |
| 7 | Competencia | `Baja` / `Media` / `Alta` *(categorical, not decimal)* |
| 8 | Dificultad | *(score)* |
| 9 | Palabras | *(word count)* |

**Keyword text extraction:** The keyword cell (`cells[1]`) `textContent` starts with `\n\t...`. Use `.split('\n').map(s => s.trim()).find(s => s.length > 1)` to extract the non-empty text token.

**Cookie handling:** Use `response.headers.getSetCookie()` (Node 18.14+). Never use `headers.get('set-cookie').split(',')` — it breaks on date values in `expires` attributes (e.g. `expires=Thu, 05-Mar-2026`).

### Account Rotation & Retry

`scrapeWithRetry` retries up to 10 times, excluding failed accounts each round:

- **`DeviceConflictError`** — login response hints at device conflict. Account excluded, session cleared.
- **`NoCreditsError`** — `kresearch.php` returns no valid JSON. Account excluded; new account registered via API.
- **Any other error** — account silently excluded, next account tried.

Account registry: `content/dinorank-accounts-registry.json`. Fields: `email`, `password`, `kwCredits`, `contentCredits`, `keywords[]`, `content[]`, `lastUsed`.

**Account onboarding fix (2026-03-13):** After `completeOnboarding()` finishes, the API now calls `await api.logout()` to close the DinoRank session server-side. Without this, subsequent login attempts from the same account fail with `device_conflict`. The `--onboarding` CLI flag also now correctly calls `registerAccount(email, password)` to persist the new account to the registry.

**Credits exhaustion detection:** `kresearch.php` responses with `créditos`, `agotado`, or `límites` text indicate the account's trial has expired. The account's `kwCredits` is set to `0` and it is skipped in future requests. New accounts are created only when the registry has *no accounts with credits at all*.

### Usage

```bash
pnpm scrape:dinorank "big-o notation"
pnpm scrape:dinorank "seo técnico" --country=mx
pnpm scrape:dinorank "algoritmos y estructuras de datos" --country=es
```

NDJSON logs written to `logs/scrape-dinorank.log`. Set `DINO_DEBUG=1` to dump raw `kresearch.php` HTML to `/tmp/dino-raw.html`.

---

## Google Search Console Integration

### Overview

Full integration with Google Search Console API to track organic performance directly within the CMS.

### Core Capabilities

- **Automated Data Sync**: Daily synchronization of clicks, impressions, CTR, and position data using a service account.
- **Global Dashboard**: A centralized panel in Payload Admin (`/admin/gsc-dashboard`) showing Top 10 pages and queries.
- **In-Context Analytics**: A "Search Console" tab inside every Page and Post editor showing performance specific to that URL.
- **List View Clicks**: Real-time visibility of latest clicks directly in the collection list views.

### Usage

```bash
# Manually trigger GSC data synchronization
pnpm run sync:gsc
```

---

## SEO Metrics & Intelligence

### Overview

The `update-seo-metrics.ts` script enriches the `content/keywords.md` file with real-time SEO intelligence. It uses an interactive selection interface and advanced crawling to build a comprehensive view of the competitive landscape.

### Core Capabilities

- **Interactive Selection**: Terminal UI to selectively update keywords.
- **Competitive Crawling**: 
  - **Heading Extraction**: Maps H2/H3 structure of top organic competitors.
  - **Average Word Count**: Automatically calculates the average word count of the top-ranking articles.
- **Keyword Gap Analysis**: Integrated deep-crawling of competitor body content to identify missing long-tail opportunities.
- **Funnel Stage Automation**: Automatically maps keywords to Awareness (TOFU), Consideration (MOFU), or Decision (BOFU) based on intent.
- **Information Gain Suggestions**: Generates unique angles ("My Angle") for each topic to ensure content differentiation.
- **Opportunity Scoring**: Intelligence-based prioritization score.

### Usage

```bash
# Update metrics for selected keywords
npx tsx src/scripts/update-seo-metrics.ts

# Discover new opportunities via Keyword Gap Analysis
npx tsx src/scripts/update-seo-metrics.ts --analyze-gap
```

---

## Core Web Vitals Monitoring

### Overview

The `update-cwv.ts` script provides an automated system for tracking Core Web Vitals (CWV) performance metrics for all frontend pages. It integrates directly with Google PageSpeed Insights (PSI).

### Usage

```bash
# Run the CWV monitoring script
npx tsx src/scripts/seo/update-cwv.ts
```

---

## Internal Linking System

Automated system that enforces topic cluster architecture and distributes authority via context-aware internal links.

### Topic Cluster Model

Content is classified into three roles set directly in post frontmatter:

| Role | Frontmatter | Description |
| :--- | :---------- | :---------- |
| `pillar` | `contentRole: pillar` | Comprehensive guide (3,000+ words) targeting a broad keyword. Links out to all satellites. |
| `satellite` | `contentRole: satellite`<br>`pillarSlug: <slug>` | Deep-dive article on a long-tail keyword. Always links back to its pillar. |
| `standalone` | `contentRole: standalone` | Self-contained post with no cluster relationship. |

Structural links between pillar and satellite posts are enforced automatically. If a satellite does not link to its pillar — or a pillar does not link back to a satellite — the script detects and injects the missing link.

### Key Features
- **Cluster Health Dashboard**: Displays the link status of every pillar and its satellites before applying any changes.
- **Structural Link Enforcement**: Guarantees every satellite links to its pillar and every pillar links back to all satellites, independent of keyword matching.
- **NLP Semantic Matching**: Uses Dice's Coefficient (via `natural` library) to ensure keyword-based links are contextually relevant beyond simple string matching.
- **Language Isolation**: Spanish posts only link to Spanish content; English posts only link to English content.
- **Content Gap Detection**: Identifies keywords mentioned three or more times across posts with no dedicated target page.

### Frontmatter Fields

```yaml
contentRole: pillar          # pillar | satellite | standalone
pillarSlug: digital-marketing # required for satellite posts; omit for pillar and standalone
```

### Usage

```bash
# Preview cluster health and keyword opportunities without modifying files
npx tsx src/scripts/build-internal-links.ts --dry-run

# Tag unclassified posts with contentRole (heuristic: word count, title patterns)
npx tsx src/scripts/build-internal-links.ts --classify [--dry-run]

# Enforce structural cluster links only, skipping keyword scan
npx tsx src/scripts/build-internal-links.ts --cluster-only

# Process a single locale
npx tsx src/scripts/build-internal-links.ts --locale es
npx tsx src/scripts/build-internal-links.ts --locale en

# Full run with verbose output
npx tsx src/scripts/build-internal-links.ts --verbose
```

---

## Auto-Generated OG Images (Cloudinary Overlay)

Every page and post automatically gets a branded Open Graph (OG) image with the page title rendered as a text overlay directly in the Cloudinary URL — no server-side image generation, no build step, zero additional infra.

### How It Works

When `generateMeta` runs for any route, it resolves the OG image through a three-tier chain:

| Priority | Source | Overlay applied? |
| :------- | :----- | :--------------- |
| 1 | Explicit `meta.image` set by the editor in the CMS | No — used as-is |
| 2 | `content.heroImage.cloudinaryUrl` (or `.url` if it's a Cloudinary URL) | Yes |
| 3 | Deterministic fallback from `getFallbackBySlug(slug)` (53 images, hash-selected) | Yes |

When the overlay is applied (`getCloudinaryOgWithTitle`), the URL-based transformation chain is:

```
/upload/
  w_1200,h_630,c_fill,g_auto,f_jpg,q_auto,right   ← base resize to OG dimensions
  /l_portfolio:og-scrim/w_1200,h_300,c_fill/fl_layer_apply,g_south   ← dark gradient at bottom
  /l_text:Array-Bold.woff2_70_right:<ENCODED_TITLE>,co_white,w_1100,c_fit/fl_layer_apply,g_south_east,x_50,y_50
  /<publicId>
```

All transformations happen in Cloudinary's CDN — no image processing on the server, cached at the edge after the first request.

### Transformation Details

| Step | Transform | Purpose |
| :--- | :-------- | :------ |
| Base | `w_1200,h_630,c_fill,g_auto,f_jpg,q_auto` | Standard OG crop, JPEG output, smart gravity |
| Scrim | `l_portfolio:og-scrim/w_1200,h_300,c_fill/fl_layer_apply,g_south` | Semi-transparent dark gradient covering the bottom 300px — ensures text is readable on both bright and dark images |
| Text | `l_text:Array-Bold.woff2_70_right:<title>,co_white,w_1100,c_fit/fl_layer_apply,g_south_east,x_50,y_50` | Title in Array Bold 70px, white, right-aligned, constrained to 1100px, positioned bottom-right with 50px inset |

**Title encoding rules:**
- Titles longer than 65 characters are truncated to 62 chars + `…` before encoding
- The title is passed through `encodeURIComponent()` (spaces → `%20`, accents → `%C3%ADa`, commas → `%2C`, slashes → `%2F`)
- Existing transformation segments in the source URL are stripped before the OG transforms are applied, so the function is safe to call on already-transformed Cloudinary URLs

### Cloudinary Assets Required

Two assets must be uploaded once to the Cloudinary account (`dmufha3qv`):

| Asset | Resource type | Public ID | Description |
| :---- | :------------ | :-------- | :---------- |
| Array Bold font | `raw / authenticated` | `Array-Bold.woff2` | Custom woff2 font for text overlays |
| OG scrim | `image / upload` | `portfolio/og-scrim` | 1200×300 PNG gradient (transparent → ~82% black) |

> **Why 1200×300?** Cloudinary's megapixel limit (25 Mpx) is hit if a small PNG is scaled up during a `c_fill` transform. Using the exact target dimensions means no upscaling is needed.

### Implementation Files

| File | Role |
| :--- | :--- |
| `src/utilities/cloudinaryUrl.ts` | `getCloudinaryOgWithTitle(url, title)` — pure function, builds the Cloudinary URL |
| `src/utilities/generateMeta.ts` | Resolves OG image through the three-tier chain and calls `getCloudinaryOgWithTitle` |
| `src/constants/fallbackImages.ts` | `getFallbackBySlug(slug)` — deterministic hash selection from 53 pre-uploaded fallback images |
| `tests/unit/utilities/cloudinaryUrl.test.ts` | 27 unit tests covering guard rails, transform structure, public-id extraction, encoding, truncation |
| `tests/unit/utilities/generateMeta.test.ts` | 16 unit tests for the full OG resolution chain |
| `tests/int/utilities/cloudinaryOg.int.test.ts` | 7 live integration tests that hit Cloudinary and verify HTTP 200 responses |

### Running the Tests

```bash
# Unit tests only (fast, no network)
pnpm test:int -- tests/unit/utilities/cloudinaryUrl.test.ts
pnpm test:int -- tests/unit/utilities/generateMeta.test.ts

# Live integration tests (requires network, hits real Cloudinary CDN)
pnpm test:int -- tests/int/utilities/cloudinaryOg.int.test.ts
```

---

## Internationalization (i18n)

The platform supports a dual-language architecture (Spanish and English) integrated at both the CMS and Frontend layers.

### Language Routing

- **Root (/)**: Serves content in Spanish.
- **Prefix (/en)**: Serves content in English.
- **Automatic Detection**: The system uses a custom middleware to handle internal rewrites and locale detection via headers.

### Content Localization

To localize a new field in a Payload collection:
1.  Set `localized: true` in the field configuration.
2.  **Constraint**: Never localize `slug` fields or block-level layout arrays. Only localize text, textarea, and richText fields.
3.  The frontend will automatically receive the correct language version based on the current URL prefix.

### Key Components

- **LocaleProvider**: Synchronizes the active language across client-side components.
- **Language Toggle**: Located in the Header, allows instant switching between ES and EN while maintaining the current page context.
- **CMSLink**: A wrapper around Next.js Link that handles localized path resolution automatically.

---

## Documentation

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT © Juan Carlos Angulo

---

## Actualizaciones Recientes (2026-04-03)

Pipeline DinoRank completado en orden EN -> ES para cerrar gaps estrategicos del backlog.

Nuevos posts EN:
- content/posts/seo/content-pillar.en.md
- content/posts/seo/seo-copywriting-guide.en.md
- content/posts/seo/keyword-research-guide.en.md
- content/posts/tech-seo/structured-data-seo.en.md

Nuevos posts ES:
- content/posts/seo/content-pillar.md
- content/posts/seo/seo-copywriting-guide.md
- content/posts/seo/keyword-research-guide.md
- content/posts/tech-seo/structured-data-seo.md

Se actualizo content/keywords_backlog.md para incluir los targets faltantes EN/ES y habilitar asignacion automatica en pipeline.
