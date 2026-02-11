# JuanTech / JuanPortfolio

A high-performance, enterprise-grade portfolio and blog platform built with Next.js and Payload CMS.

This project is a modern web application designed to showcase a professional portfolio and host a content-rich blog. It combines the power of **Next.js 15 (App Router)** for a high-performance frontend with **Payload CMS** for a flexible, headless content management backend.

## Features

- **Performance First**: Built on Next.js 15 with Turbopack, optimized for speed and SEO.
- **Headless CMS**: Powered by Payload CMS (MongoDB), offering a customizable admin panel.
- **Rich Content Management**:
  - **Blog**: Full-featured blog with categories, authors, and rich text editing.
  - **Portfolio**: Showcase projects and case studies with dedicated collections.
  - **Page Builder**: Flexible layout building blocks (Hero, Content, Media, CTA) for dynamic page creation.
- **Markdown Importer**: Robust utility to migrate content from Markdown files with automated categorization, author resolution, and SEO generation.
- **SEO Optimized**: Built-in SEO plugin, meta tag management, and sitemap generation.
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
    Copy the example environment file and configure your variables (MongoDB URI, Payload Secret, etc.):

    ```bash
    cp .env.example .env
    ```

4.  **Run Development Server:**

    ```bash
    pnpm dev
    ```

    The app will be available at `http://localhost:3000`.
    The Admin Panel is at `http://localhost:3000/admin`.

## Content Migration System

This project includes a sophisticated migration system designed to ingest valid Markdown files and transform them into structured Payload CMS documents. This utility is located at `src/scripts/importPosts.ts`.

### Command Line Interface

The script is executed via `pnpm` and supports several arguments to control its behavior.

| Command                               | Description                                                                         |
| :------------------------------------ | :---------------------------------------------------------------------------------- |
| `pnpm import:posts`                   | Start the interactive TUI to select and process Markdown files.                     |
| `pnpm import:posts --file=example.md` | Import a single specific file by name, bypassing the TUI.                           |
| `pnpm import:posts --optional`        | Relax validation for missing assets (e.g., skip missing images instead of failing). |
| `pnpm import:posts --include-test`    | Include the `content/posts/test` directory in the scan (skipped by default).        |

### Core Capabilities

#### 1. Interactive Selection (TUI)

When run without a specific file argument, the script launches a terminal user interface using `enquirer`. This allows for multi-selection of posts to be imported or updated, providing real-time feedback on the process.

#### 2. Recursive Categorization

The script infers categories from the filesystem structure. The folder name is used as the category slug (e.g., `content/posts/tech-seo/` uses `tech-seo` as the slug). The script automatically verifies or creates the corresponding Category document in Payload, including the mandatory slug field.

#### 3. Advanced Frontmatter Processing

The system reads YAML frontmatter to populate complex relationships and metadata. Supported fields include `title`, `publishedAt`, `authors`, `relatedPosts`, `heroImage`, and meta overrides.

#### 4. Safe Revalidation

To prevent invariant errors in script environments, the importer disables Next.js path revalidation during database operations by passing `disableRevalidate: true` in the Payload context.

---

## Internal Linking System

### Overview

The `build-internal-links.ts` script automates the generation of intelligent internal links between blog posts and identifies content gaps. It is located at `src/scripts/build-internal-links.ts`.

### Core Capabilities

#### 1. Intelligent Automated Linking Engine

The script identifies relevant keyword mentions within post content and injects absolute markdown links to the most authoritative target posts.

- **Absolute Production URLs**: Generates links using the production domain (`https://juan-tech.com/blog/...`) to ensure search engine compatibility and cross-environment consistency.
- **Primary Keyword Authority**: Linking opportunities are driven by keywords explicitly declared as `primary_keywords` in a post's frontmatter.
- **Context-Aware Relevance Scoring**: Utilizes `semantic_keywords` to establish contextual relevance.
- **Duplicate Prevention**: Detects existing links in the content and ensures each target post is linked only once per source post.
- **Exclusion and Safety**: Automatically excludes headings, code blocks, and frontmatter.

#### 2. Interactive Manager (TUI)

The script features an interactive interface that allows users to review found opportunities per post and confirm the application of changes.

#### 3. Legacy Link Migration

A dedicated utility is provided to migrate older relative links to the new absolute format.

### Usage

```bash
# Start the interactive internal linking manager
npx tsx src/scripts/build-internal-links.ts

# Migrate legacy relative links to absolute production URLs
pnpm run fix:links
```

---

## SEO Metrics System

### Overview

The `update-seo-metrics.ts` script enriches the `content/keywords.md` file with real-time SEO intelligence. It uses an interactive selection interface and advanced crawling to build a comprehensive view of the competitive landscape.

### Core Capabilities

#### 1. Interactive Keyword Selection

The script launches a Terminal UI that displays keywords along with their last update date. Users can selectively update specific keywords, bypassing the standard same-day caching logic for manual selections.

#### 2. Advanced Competitive Crawling

For every updated keyword, the script identifies the top organic competitors and performs a deep analysis:

- **Heading Extraction**: Uses `JSDOM` to fetch and extract H2 and H3 headings in their original document order.
- **Tag Labeling**: Each heading is individually labeled (e.g., `H2: text - H3: text`) for structural analysis.
- **Meta Intelligence**: Extracts the meta title and meta description for the top competitors.
- **Intelligent Fallback**: If a URL fails to crawl or lacks headings, the script automatically attempts the next available result until 4 successful data sets are collected.

#### 3. Data Integrity and Merging

- **15-Column Schema**: Optimized markdown table format focusing on high-value intelligence.
- **Sticky Merging**: Competitive data is preserved when switching providers unless new crawling data is successfully acquired.
- **Sanitization**: Automatically escapes pipes and collapses whitespace to maintain markdown table structure.

### Usage

```bash
# Start the interactive SEO manager
npx tsx src/scripts/update-seo-metrics.ts

# Force a specific provider
npx tsx src/scripts/update-seo-metrics.ts --source=serpapi
```

---

## Core Web Vitals Monitoring

### Overview

The `update-cwv.ts` script provides an automated system for tracking Core Web Vitals (CWV) performance metrics for all frontend pages. It integrates directly with Google PageSpeed Insights (PSI) and stores historical data in Payload CMS.

### Core Capabilities

#### 1. Smart Metric Collection

- **Field Data First**: Prioritizes real-user data (CrUX) for the most accurate representation of user experience.
- **Lab Data Fallback**: Automatically falls back to Lighthouse Lab Data for new or low-traffic pages that lack sufficient field data, ensuring every page has a performance baseline.
- **Comprehensive Metrics**: Tracks LCP, FCP, FID, INP, CLS, and the overall Performance Score.

#### 2. Automated History Tracking

- **Historical Trends**: Maintains a rolling history of the last 30 scans for each URL, enabling trend analysis over time.
- **Payload Integration**: Data is stored in the `PageMetrics` collection, accessible via the Admin Panel.

#### 3. Rate Limiting & Safety

- **Quota Management**: Implements intelligent rate limiting (1 request every 2 seconds) to stay strictly within Google's API quotas (100 reqs/100s/user).

### Usage

```bash
# Run the CWV monitoring script
npx tsx src/scripts/seo/update-cwv.ts
```

_Note: Requires `GOOGLE_PSI_API_KEY` in `.env` for higher rate limits, though it works without it for low volumes._

---

## Documentation

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Contributing

Contributions are welcome. Please submit a Pull Request following the standard fork-and-branch workflow.

## License

MIT © Juan Carlos Angulo
