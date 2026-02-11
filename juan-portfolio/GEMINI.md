# JuanPortfolio / JuanTech - AI instructional Context

This project is a high-performance, enterprise-grade portfolio and blog platform built with **Next.js 15** and **Payload CMS 3.0**. It follows a code-first approach where the CMS configuration and the frontend reside in the same repository, sharing types and utilities.

## Project Overview

- **Frontend**: Next.js 15 (App Router) with Turbopack support. Styled with Tailwind CSS and Shadcn UI.
- **Backend (CMS)**: Payload CMS 3.0 (Headless), using MongoDB as the database via Mongoose.
- **Language**: strict TypeScript throughout.
- **Localization**: Full support for English (`en`) and Spanish (`es`) at both the CMS and Frontend levels.
- **Content Strategy**:
    - Source of truth for blog posts are Markdown files in `content/posts/`.
    - Automated migration system syncs these files to Payload CMS.
    - Advanced internal linking system driven by frontmatter keywords (`primary_keywords`, `semantic_keywords`).
- **SEO**: Deeply integrated SEO intelligence system including keyword tracking, competitor heading extraction, and automated metadata generation.

## Architecture Highlights

- `src/app/(frontend)`: Contains the Next.js frontend routes and UI components.
- `src/collections`: Payload CMS collection definitions (Posts, Pages, Media, Projects, etc.).
- `src/globals`: Payload CMS global settings (Header, Footer, Site Settings).
- `src/scripts`: Custom CLI tools for content management and SEO automation.
- `content/`: Directory containing Markdown source files and the SEO keyword tracker (`keywords.md`).

## Building and Running

### Commands

| Action | Command |
| :--- | :--- |
| **Install** | `pnpm install` |
| **Development** | `pnpm dev` |
| **Production Build** | `pnpm build` |
| **Start Production** | `pnpm start` |
| **Import Posts** | `pnpm import:posts` |
| **Link Automation** | `npx tsx src/scripts/build-internal-links.ts` |
| **Fix Links** | `pnpm run fix:links` |
| **SEO Intelligence** | `npx tsx src/scripts/update-seo-metrics.ts` |
| **Run Tests** | `pnpm test` (Integration & E2E) |

### Environment Variables
Ensure `.env` is configured with:
- `DATABASE_URI`: MongoDB connection string.
- `PAYLOAD_SECRET`: Secret for CMS authentication.
- `NEXT_PUBLIC_SERVER_URL`: Base URL of the site.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token.

## Development Conventions

- **Clean Code**: Adhere strictly to the "Clean Code" principles (descriptive naming, small functions, SRP).
- **TypeScript**: Use strong typing. Avoid `any` at all costs. Generate types using `pnpm generate:types` when the CMS schema changes.
- **Styling**: Use Tailwind CSS utility classes. Prefer Shadcn UI components for complex interactive elements.
- **Git**: Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).
- **Content Updates**:
    - To add a post: Create a `.md` file in `content/posts/<category>/`.
    - Run `pnpm import:posts` to sync to the DB.
    - Run the internal linking script to inject relevant links into the new content.
- **SEO**: When creating new content, always consult `content/keywords.md` for target keywords and competitor benchmarks.
