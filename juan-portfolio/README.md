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
  - **Average Word Count**: Automatically calculates the average word count of the top-ranking articles to guide content length.
- **Opportunity Scoring**: Calculates an intelligence-based score to prioritize content creation.

### Usage

```bash
# Start the interactive SEO manager
npx tsx src/scripts/update-seo-metrics.ts
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

### Usage

```bash
# Start the interactive internal linking manager
npx tsx src/scripts/build-internal-links.ts

# Migrate legacy relative links to absolute production URLs
pnpm run fix:links
```

---

## Documentation

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT © Juan Carlos Angulo
