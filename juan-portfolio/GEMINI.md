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
- **i18n Support**: Locale-specific updates via `idioma` frontmatter field.

## Building and Running

### Commands

| Action               | Command                                       |
| :------------------- | :-------------------------------------------- |
| **Install**          | `pnpm install`                                |
| **Development**      | `pnpm dev`                                    |
| **Sync Status**      | `pnpm sync status`                            |
| **Push Content**     | `pnpm sync push`                              |
| **Sync Keywords**    | `pnpm sync:keywords`                          |
| **Link Automation**  | `npx tsx src/scripts/build-internal-links.ts` |
| **SEO Metrics**      | `npx tsx src/scripts/update-seo-metrics.ts`   |
| **Keyword Gap**      | `npx tsx src/scripts/update-seo-metrics.ts --analyze-gap` |
| **Sync GSC Data**    | `pnpm run sync:gsc`                           |
| **CWV Monitoring**   | `npx tsx src/scripts/seo/update-cwv.ts`       |

## Content Synchronization (Git-like)

The project uses a custom synchronization engine (`src/scripts/syncContent.ts`) to manage content and keywords across local files and the CMS database.

### Core Workflow
1. **Keywords**: Sync `keywords.md` to the CMS using `pnpm sync:keywords`.
2. **Content**: Push local Markdown edits using `pnpm sync push`. This automatically links posts to their primary and semantic keywords in the CMS.
3. **Analytics**: Run `pnpm run sync:gsc` to download Search Console data and aggregate performance metrics directly into your keywords.
4. **Pull**: Download remote CMS edits back to local Markdown with `pnpm sync pull`.

### Intelligence Layer
- **Automatic Linking**: Frontmatter keywords are resolved to Payload document IDs during sync. Includes authority weighting (Pillar vs Supporting).
- **Semantic Link Matching**: Uses Dice's Coefficient (NLP) to validate context before inserting internal links.
- **Performance Tracking**: Clicks, impressions, and position are tracked at both the Page and Keyword levels.
- **SGE Citability Score**: Competitor analysis detects if top-ranking pages are optimized for AI extraction.
- **Intent Multipliers**: Opportunity scores are weighted by conversion intent (BOFU > MOFU > TOFU).
- **Top-Down Semantic Gap**: Integrated crawler identifies missing 3-5 word technical phrases from competitors, filtered by semantic similarity to avoid duplicates.
- **i18n Isolation**: Enforced language-specific internal linking and keyword extraction.

## 2026 SEO Strategy (Source of Truth)

- **AI Overviews (SGE) Optimization**: 
  - Mandatary 40-50 word TL;DR summary below H1.
  - Clean HTML lists (`<ul>`, `<ol>`) for crawler extraction.
  - Mandatory "Information Gain" (unique data/perspective not found in competitors).
  - **SGE Validator**: Use `validateSGECompliance` in `src/scripts/seo/seo-logic.ts` to audit draft quality.
- **Semantic Depth & NLP**: 
  - Focus on entities rather than keyword density.
  - Semantic similarity check using Dice's Coefficient for all automated internal links.
- **Authority Cluster Architecture**:
  - **Pillar Pages**: Comprehensive guides with high internal link density.
  - **Supporting Pages**: Focused long-tail articles linking back to Pillar pages.
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
