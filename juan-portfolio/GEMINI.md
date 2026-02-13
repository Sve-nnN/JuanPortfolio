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
- **SEO Intelligence**: 
  - Deeply integrated SEO intelligence system including keyword tracking and competitor benchmarks.
  - **New**: Google Search Console integration for real-time performance tracking in the CMS.
  - **New**: Automated competitor word count analysis.

## Architecture Highlights

- `src/app/(frontend)`: Contains the Next.js frontend routes and UI components.
- `src/collections`: Payload CMS collection definitions (Posts, Pages, GSCMetrics, etc.).
- `src/scripts`: Custom CLI tools for content management and SEO automation.
  - `seo/adapters/GSCAdapter.ts`: Adapter for Google Search Console API.
  - `seo/sync-gsc.ts`: Script to synchronize organic traffic data.
- `content/`: Directory containing Markdown source files and the SEO keyword tracker (`keywords.md`).

## Internationalization (i18n)

The project implements a full internationalization system with Spanish (`es`) as the default language and English (`en`) as the secondary language.

### Routing Strategy

- **Spanish (Default)**: Served at the root path (`/`).
- **English**: Served at the `/en/` prefix.
- **Middleware**: Uses `NextResponse.rewrite` to internally map prefix-less URLs to the `es` locale while keeping the browser URL clean. It injects an `x-pathname` header to allow Server Components to accurately detect the current path and locale.

### Technical Implementation

- **Stability Rule**: Slugs and block-level layout fields must remain non-localized (`localized: false`). Localizing structural fields causes database format mismatches and routing failures.
- **Field Localization**: Only leaf-level text fields (titles, bios, richText, descriptions) are localized within blocks and collections.
- **Context Management**: The `LocaleProvider` uses the URL as the absolute source of truth. The `Header` and `Footer` components receive the locale directly from the server via props to ensure immediate synchronization.
- **Navigation**: The `CMSLink` component and `getPostUrl` utility automatically handle locale prefixes and mapping for all collections (Posts, Pages, Categories, Case Studies).

### SEO & Metadata

- **Hreflang support**: The root layout automatically generates `alternate` links for all localized versions of a page.
- **Locale-aware formatting**: Utilities like `formatDateTime` use native JavaScript Internationalization APIs to format data based on the active locale.

## Building and Running

### Commands

| Action               | Command                                       |
| :------------------- | :-------------------------------------------- |
| **Install**          | `pnpm install`                                |
| **Development**      | `pnpm dev`                                    |
| **Production Build** | `pnpm build`                                  |
| **Import Posts**     | `pnpm import:posts`                           |
| **Link Automation**  | `npx tsx src/scripts/build-internal-links.ts` |
| **SEO Metrics**      | `npx tsx src/scripts/update-seo-metrics.ts`   |
| **Sync GSC Data**    | `pnpm run sync:gsc`                           |
| **CWV Monitoring**   | `npx tsx src/scripts/seo/update-cwv.ts`       |

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
