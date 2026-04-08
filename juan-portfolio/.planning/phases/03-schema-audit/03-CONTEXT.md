# Phase 3: Schema.org Audit & Optimization - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and fix all Schema.org structured data across the site. Add missing Person schema with real social data, add BreadcrumbList to posts and categories, add ProfessionalService schema on homepage, fix any BlogPosting gaps. Zero schema validation errors on all key pages.

</domain>

<decisions>
## Implementation Decisions

### Person Schema — Social Profiles
- LinkedIn: https://www.linkedin.com/in/juancangulo/
- GitHub: https://github.com/sve-nnn
- Both included in `sameAs` array
- Name: "Juan Carlos Angulo"
- knowsAbout: ["Technical SEO", "Next.js", "TypeScript", "Payload CMS", "Web Performance", "Content Strategy"]
- jobTitle: "Technical SEO Engineer & Full-Stack Developer"

### Service Schema
- Use `ProfessionalService` schema type on the homepage (appropriate for freelancer/consultant)
- Connect with the existing `Person` schema via author relationship

### BreadcrumbList
- Add BreadcrumbList automatically via page components (not manually per page)
- Apply to: all blog post pages, all category listing pages
- Implement in the existing post page.tsx and category page.tsx components

### BlogPosting Schema
- Continue using `BlogPosting` (subtype of Article, more specific for blog content ✅)
- Ensure all required fields are populated: headline, datePublished, dateModified, author, publisher, url
- Add `mainEntityOfPage` linking to the post URL

### Claude's Discretion
- Exact implementation location for BreadcrumbList (which component, how to build the crumb array)
- ProfessionalService schema details (area, services listed)
- How to wire Person schema into the homepage (via Home global Payload fields vs hardcoded in page.tsx)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utilities/schema/generatePersonSchema.ts` — already supports sameAs, knowsAbout, jobTitle, alumniOf, hasCredential
- `src/utilities/schema/generateArticleSchema.ts` — already generates BlogPosting schema with author + publisher
- `src/utilities/schema/generateBreadcrumbSchema.ts` — already exists (check implementation)
- `src/utilities/schema/generateOrganizationSchema.ts` — already exists
- `src/plugins/seo/utils/schemaGenerator.ts` — legacy schema generator (appears unused in current routing)
- `src/utilities/generateSchema.ts` — main entry point for schema generation

### Established Patterns
- Schemas are injected as JSON-LD `<script type="application/ld+json">` in page HEAD
- Author page (`/author/[slug]/page.tsx`) already uses `generatePersonSchema`
- Post page (`/_posts_deprecated/[slug]/page.tsx`) has `generateArticleSchema` but this is deprecated
- Current active post page is at `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx` or similar — needs investigation

### Integration Points
- Homepage: needs Person + ProfessionalService schema injection
- Blog post pages: need BreadcrumbList + verify BlogPosting is present
- Category pages: need BreadcrumbList
- All schemas use `NEXT_PUBLIC_SERVER_URL` env var for base URL

</code_context>

<specifics>
## Specific Ideas

- The homepage currently does NOT emit Person schema (checked: `generatePersonSchema` is not called from any homepage component)
- The current active post routing appears to be under `/blog/[category]/[slug]` — the `/_posts_deprecated/` route has the schema code but it's deprecated
- The `generateBreadcrumbSchema.ts` file exists in utilities but may or may not be wired into post/category pages

</specifics>

<deferred>
## Deferred Ideas

- Adding Author's image to Person schema (needs an author profile photo — Phase 4 concern)
- Schema for individual Work/Portfolio pages
- FAQ schema for posts that have FAQ sections
- Schema testing with Google Rich Results Test (manual validation — human_needed in verification)

</deferred>
