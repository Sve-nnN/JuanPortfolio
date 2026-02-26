# JuanPortfolio / JuanTech - AI instructional Context

This project is a high-performance, enterprise-grade portfolio and blog platform built with **Next.js 15** and **Payload CMS 3.0**. It follows a code-first approach where the CMS configuration and the frontend reside in the same repository, sharing types and utilities.

## Project Overview

- **Frontend**: Next.js 15 (App Router) with Turbopack support. Styled with Tailwind CSS and Shadcn UI.
- **Backend (CMS)**: Payload CMS 3.0 (Headless), using MongoDB as the database via Mongoose.
- **Language**: strict TypeScript throughout.
- **Localization**: Full support for English (`en`) and Spanish (`es`) at both the CMS and Frontend levels.
## Content Strategy

- **Source of truth**: Markdown files in `content/posts/`.
- **Bidirectional Sync**: Advanced Git-like synchronization between local Markdown files and Payload CMS.
- **Conversion**: Automatic Markdown <-> Lexical JSON transformation.
- **Bilingual Naming**: `article.md` (Spanish default), `article.en.md` (English), `article.es.md` (explicit Spanish). Locale is resolved from the filename first, then the `idioma` frontmatter field, then defaults to `es`.

## Building and Running

### Commands

| Action               | Command                                       |
| :------------------- | :-------------------------------------------- |
| **Install**          | `pnpm install`                                |
| **Development**      | `pnpm dev`                                    |
| **Sync Status**      | `pnpm sync status`                            |
| **Push Content**     | `pnpm sync push [--post=<filename.md>] [--force]`   |
| **Sync Keywords**    | `pnpm sync:keywords`                          |
| **Link Automation**  | `npx tsx src/scripts/build-internal-links.ts [--classify] [--cluster-only] [--locale en\|es] [--dry-run]` |
| **SEO Metrics**      | `npx tsx src/scripts/update-seo-metrics.ts`   |
| **Keyword Gap**      | `npx tsx src/scripts/update-seo-metrics.ts --analyze-gap` |
| **Sync GSC Data**    | `pnpm run sync:gsc`                           |
| **CWV Monitoring**   | `npx tsx src/scripts/seo/update-cwv.ts`       |

## Content Synchronization (Git-like)

The project uses a custom synchronization engine (`src/scripts/syncContent.ts`) to manage content and keywords across local files and the CMS database. The engine delegates to focused modules under `src/scripts/sync/`:

| Module | Responsibility |
| :----- | :------------- |
| `localeDetector.ts` | Resolves locale from filename suffix, then frontmatter, then defaults to `es` |
| `stateManager.ts` | Loads/saves `content/content-sync.json`; migrates legacy `idioma` field to `locale` |
| `postParser.ts` | Parses frontmatter, validates required fields, builds Payload-compatible post data |
| `payloadRepository.ts` | Single repository for all CMS reads/writes using a generic `resolveByField()` helper |

### Core Workflow
1. **Keywords**: Sync `keywords.md` to the CMS using `pnpm sync:keywords`.
2. **Content**: Push local Markdown edits using `pnpm sync push [--post=<filename.md>] [--force]`. This automatically links posts to their primary and semantic keywords in the CMS.
3. **Analytics**: Run `pnpm run sync:gsc` to download Search Console data and aggregate performance metrics directly into your keywords.
4. **Pull**: Download remote CMS edits back to local Markdown with `pnpm sync pull`.

### Intelligence Layer
- **Automatic Linking**: Frontmatter keywords are resolved to Payload document IDs during sync.
- **Semantic Link Matching**: Uses Dice's Coefficient (NLP) to validate context before inserting internal links.
- **Performance Tracking**: Clicks, impressions, and position are tracked at both the Page and Keyword levels.
- **SGE Citability Score**: Competitor analysis detects if top-ranking pages are optimized for AI extraction.
- **Intent Multipliers**: Opportunity scores are weighted by conversion intent (BOFU > MOFU > TOFU).
- **Top-Down Semantic Gap**: Integrated crawler identifies missing 3-5 word technical phrases from competitors, filtered by semantic similarity to avoid duplicates.
- **i18n Isolation**: Enforced language-specific internal linking and keyword extraction.

## Topic Cluster System

Internal linking is governed by `src/scripts/build-internal-links.ts` using a hub-and-spoke model.

### Frontmatter Fields

| Field | Values | Notes |
| :---- | :----- | :---- |
| `contentRole` | `pillar` \| `satellite` \| `standalone` | Required for cluster linking |
| `pillarSlug` | e.g. `digital-marketing` | Required on satellite posts |

### Key Modules

| Module | Responsibility |
| :----- | :------------- |
| `topicCluster.ts` | Pure functions: `buildClusterMap`, `getMissingClusterLinks`, `getClusterSummaries` |
| `FrontmatterTagger.ts` | Infers and writes `contentRole` to post frontmatter using word count and title heuristics |
| `ContentScanner.ts` | Scans posts for keyword opportunities; enforces locale isolation |
| `LinkInjector.ts` | Inserts markdown links into post bodies; appends "See Also" when no natural anchor exists |

### Structural Link Rules

- A satellite without a link to its pillar gets one injected automatically.
- A pillar without a link to a satellite gets one injected automatically.
- Structural links are applied before keyword-based links and are not subject to the `maxLinksPerKeyword` limit.

### Locale Isolation

Posts only receive links to content in the same locale (`idioma` field). Cross-locale linking is never injected.

### CLI Usage

```bash
npx tsx src/scripts/build-internal-links.ts --dry-run         # preview only
npx tsx src/scripts/build-internal-links.ts --classify        # tag unclassified posts
npx tsx src/scripts/build-internal-links.ts --cluster-only    # structural links only
npx tsx src/scripts/build-internal-links.ts --locale es       # single locale
```

## 2026 SEO Strategy (Source of Truth)

- **AI Overviews (SGE) Optimization**: 
  - Mandatary 40-50 word TL;DR summary below H1.
  - Clean HTML lists (`<ul>`, `<ol>`) for crawler extraction.
  - Mandatory "Information Gain" (unique data/perspective not found in competitors).
  - **SGE Validator**: Use `validateSGECompliance` in `src/scripts/seo/seo-logic.ts` to audit draft quality.
- **Semantic Depth & NLP**: 
  - Focus on entities rather than keyword density.
  - Semantic similarity check using Dice's Coefficient for all automated internal links.
- **Topic Cluster Architecture**:
  - **Pillar Pages** (`contentRole: pillar`): Comprehensive guides (3,000+ words) with high internal link density, linking out to all satellites.
  - **Satellite Pages** (`contentRole: satellite`, `pillarSlug: <slug>`): Focused long-tail articles that always link back to their pillar.
  - **Standalone Pages** (`contentRole: standalone`): Self-contained posts with no cluster relationship.
  - Structural links are enforced automatically by `build-internal-links.ts` regardless of keyword matching.
- **pSEO Verdicts**: Strong expert verdicts in technical comparisons ("Use Case Winner") to build E-E-A-T.



### Environment Variables

Ensure `.env` is configured with:

- `DATABASE_URI`: MongoDB connection string.
- `PAYLOAD_SECRET`: Secret for CMS authentication.
- `GSC_CLIENT_EMAIL`: Google Service Account email.
- `GSC_PRIVATE_KEY`: Google Service Account private key.
- `GSC_PROPERTY_URL`: Search Console property (e.g., `sc-domain:example.com`).
- `NEXT_PUBLIC_GSC_PROPERTY_URL`: Base URL for GSC page mapping.

## Development Conventions

- **Clean Code**: Adhere strictly to the "Clean Code" principles.
- **TypeScript**: No `any` allowed. Use `pnpm generate:types` for CMS schema changes.
- **SEO Workflow**:
  - Update `content/keywords.md` using the metrics script.
  - Sync GSC data regularly to monitor ranking improvements.
  - Use the "Search Console" tab in Payload to analyze specific page performance.
