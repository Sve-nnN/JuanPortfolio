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
- **Internationalization**: Full support for locale-specific updates using the `idioma` and `slug` frontmatter fields.

### Command Line Interface

| Command                               | Description                                                                         |
| :------------------------------------ | :---------------------------------------------------------------------------------- |
| `pnpm sync status`                    | Shows local vs remote change status.                                                |
| `pnpm sync push`                      | Uploads local Markdown changes and links keywords to entries.                       |
| `pnpm sync pull`                      | Downloads remote CMS changes to local Markdown files.                               |
| `pnpm sync:keywords`                  | Synchronizes the `keywords.md` table with the KeywordMetrics collection.            |
| `pnpm run sync:gsc`                   | Syncs Search Console data and aggregates it into the KeywordMetrics.                |
| `pnpm sync push --force`              | Overwrites remote CMS content with local files regardless of conflicts.             |

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

Automated system to distribute authority and improve crawlability via context-aware links.

### Key Features
- **NLP Semantic Matching**: Uses Dice's Coefficient (via `natural` library) to ensure links are contextually relevant beyond simple string matching.
- **Authority Clusters**: Automatically identifies `Pillar` and `Supporting` content, prioritizing links to high-authority pillar pages.
- **Language Isolation**: English posts only link to English content; Spanish posts only link to Spanish content.
- **Pure Semantic Extraction**: Automatically filters out keywords from the "wrong" language during extraction.
- **Gap Detection**: Identifies mentioned keywords that don't have a dedicated target page yet.

### Usage

```bash
# Start the interactive internal linking manager
npx tsx src/scripts/build-internal-links.ts

# Preview changes without modifying files
npx tsx src/scripts/build-internal-links.ts --dry-run
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
