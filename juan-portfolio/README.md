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

## Documentation

-   [Payload CMS Documentation](https://payloadcms.com/docs)
-   [Next.js Documentation](https://nextjs.org/docs)

## Contributing

Contributions are welcome. Please submit a Pull Request following the standard fork-and-branch workflow.

## License

MIT © Juan Carlos Angulo
