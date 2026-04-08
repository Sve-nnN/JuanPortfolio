# Phase 2: Content Fixes - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all content quality issues: clean mejores-cursos body, resolve development/ category, audit and fix all post meta descriptions. No new posts created — only fixes to existing content.

</domain>

<decisions>
## Implementation Decisions

### mejores-cursos Body Rewrite
- Rewrite with real, clean content — ~800-1200 words, structured with H2s, comparativas de cursos SEO en español
- Remove all DinoBrain HTML/JS artifacts from the body
- Clean up `semantic_keywords` frontmatter — replace JS-artifact keywords with real SEO semantic keywords relevant to "mejores cursos SEO en español"
- Keep existing frontmatter (title, slug, metaTitle, metaDescription) — these are fine

### development/ Category
- Create "Development" category in Payload CMS with slug `development`
- Sync all 7 article pairs (ES + EN) via `pnpm sync push` setting `categories: [development]` in frontmatter
- Publish as `draft` (status: draft) — articles need individual review before publishing
- Articles: headless-cms-seo, nextjs-portfolio, nextjs-server-components, payloadcms-seo, payloadcms-tutorial, payloadcms-vs-strapi, typescript-best-practices

### Meta Descriptions Audit
- Use a programmatic script to query all published Payload posts and check meta descriptions
- Flag: missing (`null`/empty), too short (<120 chars), too long (>160 chars)
- Fix any gaps found — either via sync (update frontmatter) or Payload MCP directly
- Claude's discretion on the specific query approach (Payload local API vs MCP)

### Claude's Discretion
- Exact content and structure of mejores-cursos rewritten body
- Category title and description for "Development" category in Payload
- Which posts need meta description updates and what those updates should be

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pnpm sync push -- --post=filename.md` for pushing individual files
- `pnpm sync push` for bulk push of all changed files
- Payload MCP for creating categories and updating CMS records directly
- `src/scripts/sync/payloadRepository.ts` — `PayloadRepository` class for Payload queries

### Established Patterns
- Category slug is kebab-case (e.g., `seo`, `cs-fundamentals`, `tech-seo`)
- Posts use `categories: [category-slug]` array in frontmatter
- Status field: `status: published` or `status: draft`
- Sync system maps `categories` frontmatter array to resolved category IDs in Payload

### Integration Points
- development/ articles need `categories: [development]` added to frontmatter before sync
- Newly created Development category must exist in Payload before sync (otherwise sync fails on category resolution)
- mejores-cursos has already been renamed to ascii slug in Phase 1

</code_context>

<specifics>
## Specific Ideas

- mejores-cursos should be a genuine resource — list real Spanish SEO courses (Ahrefs Academy ES, SEMrush Academy, courses from Spanish SEO influencers), not placeholder content
- The development/ articles already have bilingual content (EN + ES pairs) — they're likely AI-generated DinoBrain content, may need quality review before publishing (hence draft status)

</specifics>

<deferred>
## Deferred Ideas

- Individual review and publishing of development/ draft articles (user decision per article)
- Homepage and blog listing meta tag updates (already deferred from Phase 1 — part of Phase 2 meta audit scope)
- Adding actual images/screenshots to mejores-cursos article

</deferred>
