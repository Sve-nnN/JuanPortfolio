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
| `pnpm import:posts` | Process all Markdown files in `content/posts` and subdirectories. |
| `pnpm import:posts --file=example.md` | Import a single specific file by name. |
| `pnpm import:posts --optional` | Relax validation for missing assets (e.g., skip missing images instead of failing). |

### Core Capabilities

#### 1. Recursive Categorization
The script infers categories from the filesystem structure.
- **Root Files**: Files directly in `content/posts/` are considered uncategorized or root-level posts.
- **Subdirectories**: A file located in `content/posts/tech/react/` will be assigned to a "React" category, causing the script to automatically verify or create the corresponding Category document in Payload.

#### 2. Advanced Frontmatter Processing
The system reads YAML frontmatter to populate complex relationships and metadata.

**Supported Fields:**
- `title` (Required): The title of the post.
- `date`: Maps to the `publishedAt` timestamp.
- `authors`: Array of User IDs. If unresolvable, it defaults to the first available Admin user to ensure data integrity.
- `relatedPosts`: Array of slugs. Automatically resolves to internal Payload relationships.
- `heroImage`: Path to an image asset. The script handles upload and media linking automatically.
- `metaTitle` / `metaDescription`: Explicit SEO control. If omitted, these are auto-generated from the content.

#### 3. High-Fidelity Content Conversion
Markdown content is not just stored as text; it is parsed and converted into Payload's native **Lexical RichText** format.
- **Formatting**: Preserves bold, italic, links, blockquotes, and lists.
- **Code Blocks**: Automatically maps code fences (```ts) to our custom, high-performance `code-block` component, preserving language syntax highlighting.

#### 4. Internationalization Support
The importer automatically writes content to both default (`en`) and secondary (`es`) locales to ensure a populated initial state for all language versions.

### Data Structure Requirements

To ensure a successful import, structure your content as follows:

**Directory Layout:**
```text
content/
  posts/
    getting-started.md       (Root post)
    engineering/             (Category: Engineering)
      system-design.md
      devops/                (Category: DevOps)
        docker-guide.md
```

**Markdown File Template:**
```yaml
---
title: System Design Principles
date: 2024-03-20
authors:
  - user-id-1
heroImage: /assets/images/architecture.png
metaTitle: Scalable System Design Guide
metaDescription: A comprehensive guide to building scalable systems.
---

# Introduction

Content goes here...
```

## SEO Metrics Script

### Overview

The `update-seo-metrics.ts` script fetches SEO data from various providers and updates the `content/keywords.md` file with comprehensive keyword intelligence, including volume, difficulty, and advanced SERP features analysis.

### Features

The script captures the following data points:

| Field | Description | Use Case |
|-------|-------------|----------|
| **Volume** | Estimated monthly search volume | Prioritize high-traffic opportunities |
| **Difficulty** | Keyword difficulty score (0-100) | Assess competition level |
| **Related Searches** | Up to 8 related query suggestions | Discover long-tail keywords and content clusters |
| **PAA Count** | Number of "People Also Ask" questions | Identify featured snippet opportunities |
| **Top Domain** | Domain ranking first for the keyword | Competitive analysis and authority benchmarking |
| **Has AI Overview** | Presence of AI-generated summaries | Adjust content strategy for AI-influenced SERPs |
| **SERP Features** | Active features (videos, knowledge graph, shopping, etc.) | Determine optimal content formats |

### Usage

```bash
# Auto-detect best available source
npx tsx src/scripts/update-seo-metrics.ts

# Force specific source
npx tsx src/scripts/update-seo-metrics.ts --source=google-ads
npx tsx src/scripts/update-seo-metrics.ts --source=serpapi
npx tsx src/scripts/update-seo-metrics.ts --source=dataforseo
npx tsx src/scripts/update-seo-metrics.ts --source=mock
```

### Supported Data Providers

#### 1. Google Ads API (`google-ads`)

- **Status**: Production-ready.
- **Requires**: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`.
- **Notes**: Uses v18 API. Provides accurate volume and difficulty data. Limited SERP features.

#### 2. SerpApi (`serpapi`)

- **Status**: Production-ready with enhanced SERP features.
- **Requires**: `SERPAPI_API_KEY`.
- **Features**: Full support for all SERP features including Related Searches, PAA, Top Domain, AI Overview, and active SERP features.
- **Notes**: Recommended for comprehensive competitive intelligence.

#### 3. DataForSEO (`dataforseo`)

- **Status**: Implemented (Sandbox & Live).
- **Requires**: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`.
- **Config**: Set `DATAFORSEO_SANDBOX=true` to use the free sandbox endpoint.
- **Notes**: Limited SERP features support.

#### 4. Mock (`mock`)

- **Status**: Development only.
- **Requires**: None. Generates fake data for testing.

### SERP Features Extraction

When using SerpApi, the script automatically extracts:

**Related Searches:**
- Maximum 8 related query suggestions
- Sourced from `related_searches[]` API response
- Format: Semicolon-separated list in markdown

**PAA Count:**
- Counts number of "People Also Ask" questions
- Sourced from `people_also_ask.length`
- Higher count indicates featured snippet opportunities

**Top Domain:**
- Extracts hostname from first organic result
- Sourced from `organic_results[0].link`
- Useful for competitive analysis

**AI Overview:**
- Boolean detection of AI-generated summaries
- Sourced from `ai_overview` presence
- Indicates need for unique, authoritative content

**SERP Features:**
- Detects: videos, knowledge_graph, featured_snippet, shopping, local_pack, top_stories
- Informs content format strategy (video, structured data, etc.)

### Output Format

The script updates `content/keywords.md` with a 13-column markdown table:

```markdown
| Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | Source | Related Searches | PAA Count | Top Domain | Has AI Overview | SERP Features |
```

**Example row:**
```markdown
| technical seo for developers | /tech-seo/guide | 20400000 | 0 |  |  | 2026-02-08 | SerpApi | Technical seo checklist; Off-page SEO; Technical SEO techniques | 0 | developers.google.com | Yes | videos |
```

### Caching & Smart Updates

- **Database Caching**: Results cached in Payload CMS `keyword-metrics` collection for 24 hours.
- **Smart Updates**: Keywords updated today are skipped automatically to minimize API costs.
- **Source Tracking**: Each row tracks data provider for transparency.

### Strategic Use Cases

**High PAA Count (>3)**
- Create comprehensive FAQ sections targeting these questions
- Optimize for featured snippet eligibility (position zero)

**AI Overview Present**
- Focus content on unique insights and original data
- Differentiate from AI-generated summaries

**Video SERP Feature Detected**
- Prioritize video content creation for the keyword
- Optimize for video carousel placement

**Related Searches Analysis**
- Build content clusters around suggested topics
- Discover long-tail keyword opportunities

---

## Internal Linking System

### Overview

The `build-internal-links.ts` script automates the generation of internal links between blog posts and identifies content gaps based on keyword analysis. It is located at `src/scripts/build-internal-links.ts`.

### Core Capabilities

#### 1. Automated Linking Engine
The script identifies keyword mentions within post content and injects markdown links to the most relevant target posts.
- **Relevance Scoring**: Prioritizes links based on keyword match type, cross-category diversity, and proximity to related terms.
- **Context Awareness**: Automatically excludes headings, code blocks, frontmatter, and existing links to prevent broken markdown or over-optimization.
- **Case Preservation**: Maintains the original capitalization of keywords when converting them to links.

#### 2. Semantic Variation Generation
The system generates variations for each keyword to increase matching coverage:
- **Pluralization**: Handles singular and plural forms (e.g., "metric" and "metrics").
- **Case Sensitivity**: Generates lowercase, uppercase, and title-case variations.
- **Hyphenation**: Reconciles differences between hyphenated and spaced keywords (e.g., "next-js" and "next js").

#### 3. Content Gap Analysis
The script identifies keywords referenced in existing content that do not have dedicated posts.
- **Detection**: Flags keywords mentioned multiple times across the codebase that lack a corresponding target URL in the existing collection.
- **Recommendations**: Automatically appends content opportunities to `content/keywords.md` with the source attribute set to "Internal Linking Script".
- **Mention Tracking**: Records how many times and in which posts a potential keyword was found.

### Usage

```bash
# Preview proposed changes and gap analysis
npx tsx src/scripts/build-internal-links.ts --dry-run --verbose

# Apply links to all posts and record recommendations
npx tsx src/scripts/build-internal-links.ts

# Process a specific category with custom link limits
npx tsx src/scripts/build-internal-links.ts --category tech-seo --max-links 5
```

### CLI Configuration

| Option | Description | Default |
| :--- | :--- | :--- |
| `--dry-run` | Preview matches and recommendations without modifying files. | `false` |
| `--category <name>` | Limit processing to a specific post category. | `All` |
| `--max-links <n>` | Set the maximum number of links allowed per keyword per post. | `3` |
| `--verbose` | Output detailed matching logic and skipping reasons. | `false` |

### Content Gap Recommendations

When content gaps are identified, the script appends them to the `keywords.md` table using the following format:

| Keyword | Target URL | ... | Status | Last Updated | Related Searches | Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| example keyword | /category/example | ... | recommended | [Today's Date] | Mentioned in: Post A, Post B | Internal Linking Script |

- **Status**: Set to "recommended" for new opportunities.
- **Source**: Explicitly attributed to "Internal Linking Script" for transparency in content planning.
- **Threshold**: Only recommends keywords mentioned in at least 3 separate contexts.

---

## Documentation

-   [Payload CMS Documentation](https://payloadcms.com/docs)
-   [Next.js Documentation](https://nextjs.org/docs)

## Contributing

Contributions are welcome. Please submit a Pull Request following the standard fork-and-branch workflow.

## License

MIT © Juan Carlos Angulo
