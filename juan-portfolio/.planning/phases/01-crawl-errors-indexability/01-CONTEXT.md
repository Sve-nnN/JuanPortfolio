# Phase 1: Crawl Errors & Indexability - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all 4xx/3xx sitemap errors and ensure noindex flags are correctly applied in rendered HTML. Scope: slug rename with 301, noindex for /blog/general, noindex for placeholder EN posts, fix sync module to support noindex frontmatter field.

</domain>

<decisions>
## Implementation Decisions

### noindex Mechanism
- Apply noindex to guia-eeat.en + sql-vs-nosql.en via Payload MCP (direct CMS update, immediate effect)
- Fix sync module (`PostFrontmatter`, `PayloadPostData`, `postParser.ts`) to support `noindex` field for future use
- Create stub `content/posts/cs-fundamentals/experiencia-de-usuario.en.md` with `noindex: true` to handle EN route with no EN content

### /blog/general
- Apply `noindex` to General category record via Payload MCP — do NOT delete the category (safer, avoids breaking existing post assignments)

### mejores-cursos Slug Rename
- Rename slug from `mejores-cursos-seo-en-español` → `mejores-cursos-seo-espanol` via Payload MCP
- Add 301 redirect in Payload Redirects collection: `/blog/seo/mejores-cursos-seo-en-espa%C3%B1ol` → `/blog/seo/mejores-cursos-seo-espanol`
- Use Payload Redirects plugin (not next.config or middleware) for consistency with existing redirect infrastructure

### Claude's Discretion
- Order of Payload MCP operations (slug rename before or after redirect creation — rename first, then create redirect)
- Exact path format for the redirect (with and without URL encoding)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Payload MCP available for direct CMS operations without going through sync
- `src/scripts/sync/types.ts` — `PostFrontmatter` and `PayloadPostData` need `noindex` field added
- `src/scripts/sync/postParser.ts` — needs to pass `noindex` from frontmatter to `PayloadPostData`
- `src/plugins/seo/fields/seoFields.ts` — `noindex` CMS field already exists at `meta.noindex`
- `src/plugins/seo/endpoints/sitemap.ts` — already checks `doc.meta?.noindex` to exclude from sitemap

### Established Patterns
- noindex in CMS is stored as `meta.noindex: boolean` (confirmed in `payload-types.ts` line 556)
- Search page already correctly implements `robots: { index: false, follow: false }` in `generateMetadata`
- `/search` and `/en/search` already excluded from `next-sitemap.config.cjs`
- Payload Redirects plugin is the established redirect mechanism (see `src/scripts/fetch-redirects.ts`)

### Integration Points
- Sync module: `src/scripts/sync/types.ts` → `src/scripts/sync/postParser.ts` → `src/scripts/sync/payloadRepository.ts`
- noindex chain: frontmatter `noindex: true` → `PostFrontmatter.noindex` → `PayloadPostData.meta.noindex` → CMS `meta.noindex` → `SEOHead.tsx` renders `<meta name="robots" content="noindex, nofollow">`
- Redirects: Payload Redirects collection → fetched at build time by `src/scripts/fetch-redirects.ts` → written to `next.config.js` redirects array

</code_context>

<specifics>
## Specific Ideas

- The `noindex: true` field was already added to `guia-eeat.en.md` and `sql-vs-nosql.en.md` in the prior audit (2026-03-27), but these were synced before the sync module supported noindex — so the CMS records need direct MCP updates
- Verify that after Payload MCP updates, the rendered HTML of guia-eeat.en and sql-vs-nosql.en actually contains `<meta name="robots" content="noindex">`
- The `mejores-cursos-seo-en-español` file has raw HTML artifacts in the body — that's a Phase 2 concern, not Phase 1

</specifics>

<deferred>
## Deferred Ideas

- Homepage meta tags update (Phase 2 — Content Fixes)
- Blog listing ES/EN meta tags (Phase 2)
- Category meta tags for SEO, CS Fundamentals, Tech SEO (Phase 2)
- Author page meta tags (Phase 4 — Author Profile & E-E-A-T)
- Publishing 9 unpublished tech-seo articles (Phase 2)
- mejores-cursos body content rewrite (Phase 2)

</deferred>
