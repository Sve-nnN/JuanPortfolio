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

| Command | Description |
| :--- | :--- |
| `pnpm import:posts` | Start the interactive TUI to select and process Markdown files. |
| `pnpm import:posts --file=example.md` | Import a single specific file by name, bypassing the TUI. |
| `pnpm import:posts --optional` | Relax validation for missing assets (e.g., skip missing images instead of failing). |
| `pnpm import:posts --include-test` | Include the `content/posts/test` directory in the scan. |

### Core Capabilities

#### 1. Interactive Selection (TUI)
When run without a specific file argument, the script launches a terminal user interface using `enquirer`. This allows for multi-selection of posts to be imported or updated, providing real-time feedback on the process.

#### 2. Recursive Categorization
The script infers categories from the filesystem structure.
- **Root Files**: Files directly in `content/posts/` are considered uncategorized.
- **Subdirectories**: The folder name is used as the category slug (e.g., `content/posts/tech-seo/` uses `tech-seo` as the slug). The script automatically verifies or creates the corresponding Category document in Payload.

#### 3. Advanced Frontmatter Processing
The system reads YAML frontmatter to populate complex relationships and metadata.

**Supported Fields:**
- `title` (Required): The title of the post.
- `date`: Maps to the `publishedAt` timestamp.
- `authors`: Array of slugs or IDs. Automatically resolved to Payload relationships.
- `relatedPosts`: Array of slugs. Automatically resolves to internal Payload relationships.
- `heroImage`: Path to an image asset. The script handles upload and media linking automatically.
- `metaTitle` / `metaDescription`: Explicit SEO control. If omitted, these are auto-generated from the content.

#### 4. Safe Revalidation
To prevent errors in script environments, the importer disables Next.js path revalidation during the database operations by passing a specific context to Payload hooks.

---

## Internal Linking System

### Overview

The `build-internal-links.ts` script automates the generation of intelligent and SEO-optimized internal links between blog posts and identifies content gaps based on a refined keyword analysis. It is located at `src/scripts/build-internal-links.ts`.

### Core Capabilities

#### 1. Intelligent Automated Linking Engine
The script identifies relevant keyword mentions within post content and injects absolute markdown links to the most authoritative target posts.
- **Absolute URLs**: Generates links using the production domain (`https://juan-tech.com/blog/...`) to ensure compatibility across different environments.
- **Primary Keyword Authority**: Linking opportunities are driven by keywords explicitly declared as `primary_keywords` in a post's frontmatter.
- **Context-Aware Relevance Scoring**: Utilizes `semantic_keywords` to establish contextual relevance.
- **Duplicate Prevention**: Detects existing links in the content and ensures each target post is linked only once per source post.
- **Exclusion and Safety**: Automatically excludes headings, code blocks, frontmatter, and existing links.

#### 2. Interactive Manager (TUI)
The script features an interactive interface that allows users to review found opportunities per post and confirm the application of changes.

#### 3. Legacy Link Migration
A dedicated utility is provided to migrate older relative links to the new absolute format.

### CLI Configuration

| Option | Description | Default |
| :--- | :--- | :--- |
| `--dry-run` | Preview matches and recommendations without modifying files. | `false` |
| `--category <name>` | Limit processing to a specific post category. | `All` |
| `--max-links <n>` | Set the maximum number of links allowed per keyword occurrence per post. | `3` |
| `--include-test` | Include the `test` directory in the scan. | `false` |
| `--verbose` | Output detailed matching logic and skipping reasons. | `false` |

### Utility Commands

| Script | Description |
| :--- | :--- |
| `pnpm run fix:links` | Scans all posts and converts relative internal links to absolute production URLs. |

---

## SEO Metrics System

### Overview

The `update-seo-metrics.ts` script is designed to enrich the `content/keywords.md` file with real-time SEO intelligence. It fetches data from professional providers to help evaluate keyword opportunities and track content performance. It is located at `src/scripts/update-seo-metrics.ts`.

### Core Capabilities

#### 1. Multi-Provider Support
The script uses an adapter pattern to support multiple data sources, ensuring high-quality metrics even if a specific API is unavailable.
- **SerpApi**: Recommended for comprehensive SERP analysis. It provides detailed intelligence on related searches, "People Also Ask" questions, and advanced SERP features.
- **Google Ads API**: Used for precise monthly search volume and competition index metrics.
- **DataForSEO**: Supported as a secondary provider for volume and difficulty data.

#### 2. Intelligent Difficulty Estimation
When using providers that do not offer a native "Difficulty" score (like standard SerpApi search), the system calculates an estimated difficulty (0-100) based on several factors:
- **Commercial Intent**: The number of paid advertisements (ads) appearing for the query.
- **Competition Volume**: The total number of results found by the search engine.
- **Informational Authority**: The presence of high-authority features like the Knowledge Graph or Featured Snippets.

#### 3. Advanced SERP Intelligence
The script captures more than just volume and difficulty. it extracts a suite of competitive data points:
- **Related Searches**: Up to 8 related query suggestions to help discover long-tail opportunities.
- **PAA Count**: The number of "People Also Ask" questions, indicating potential for FAQ content.
- **Top Domain**: Identifies the current leader for the keyword to facilitate competitive benchmarking.
- **SERP Features**: Detects the presence of videos, images, shopping results, local packs, and top stories.

#### 4. Smart Caching and Optimization
- **24-Hour Caching**: Metrics are cached in the database to minimize API costs.
- **Same-Day Skip**: If a keyword has already been updated on the current day, the script will skip it automatically.
- **Dry Run Support**: Users can preview updates without modifying the markdown file.

### Usage

```bash
# Auto-detect best available source and update keywords
npx tsx src/scripts/update-seo-metrics.ts

# Force specific data provider
npx tsx src/scripts/update-seo-metrics.ts --source=serpapi
npx tsx src/scripts/update-seo-metrics.ts --source=google-ads
```

### Data Schema

The script maintains a 13-column markdown table in `content/keywords.md`:

| Field | Description |
| :--- | :--- |
| **Volume** | Estimated monthly search volume. |
| **Difficulty** | Competition score from 0 to 100. |
| **Last Updated** | Timestamp of the last successful data fetch. |
| **Source** | The name of the provider that supplied the data. |
| **PAA Count** | Number of "People Also Ask" entries found. |
| **Has AI Overview** | Indicates if Google is showing an AI-generated summary. |
| **SERP Features** | List of special results shown (e.g., videos, images). |

---

## Documentation

-   [Payload CMS Documentation](https://payloadcms.com/docs)
-   [Next.js Documentation](https://nextjs.org/docs)

## Contributing

Contributions are welcome. Please submit a Pull Request following the standard fork-and-branch workflow.

## License

MIT © Juan Carlos Angulo
