# Phase 3 Schema.org Audit Notes

**Date:** 2026-03-30
**Auditor:** execute-phase agent
**Status:** Complete — consumed by plans 03-02 and 03-03

---

## Schema Emission Map

| Page | Route file | Schema types emitted | How |
|---|---|---|---|
| Homepage (`/`) | `src/app/(frontend)/[locale]/[slug]/page.tsx` (slug=home branch) | FAQPage (if FAQs exist on layout blocks + expertFaq fallback) | `<JsonLd isHome={true} blocks locale siteUrl />` — JsonLd.tsx builds FAQ from blocks + injects expertFaq |
| Blog post page (`/blog/[category]/[slug]`) | `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx` | BlogPosting + BreadcrumbList (via `@graph`) | `generateSchema({ doc: post, collection: 'posts', url: fullUrl, breadcrumbs })` → `<JsonLd schema={schema} post={post} locale siteUrl />` |
| Blog category page (`/blog/[category]`) | `src/app/(frontend)/[locale]/blog/[category]/page.tsx` | CollectionPage + BreadcrumbList + FAQPage (if category has ≥2 FAQs) | `mergeSchemas([collectionPageSchema, faqSchema, breadcrumbSchema])` → `<JsonLd schema={schema} />` |
| Blog listing page (`/blog`) | No dedicated `blog/page.tsx` found (route likely handled by `[slug]/page.tsx` with slug=`blog-listing`) | Unknown — slug page would call `generateSchema` with `collection: 'pages'` → WebPage | `generateSchema({ doc: page, collection: 'pages', url: fullUrl })` |
| Generic CMS page | `src/app/(frontend)/[locale]/[slug]/page.tsx` (non-home, non-blog slug) | WebPage schema (or custom `meta.jsonLD` override if set) | Either `page.meta.jsonLD` custom JSON or `generateSchema({ doc: page, collection: 'pages', url })` → WebPage |

---

## Gaps Found

### Homepage

**Currently emitted:**
- FAQPage schema (built from layout blocks + expertFaq fallback)
- Nothing else — no Organization, no WebSite, no Person, no ProfessionalService

**Missing per Phase 3 requirements:**
- `Person` schema with `name: "Juan Carlos Angulo"`, `jobTitle`, `sameAs: [LinkedIn, GitHub]`, `knowsAbout: [6 topics]`, `@id: /#person`
- `ProfessionalService` schema with `provider: { '@id': '/#person' }`, `serviceType`, `areaServed: 'Worldwide'`

Note: `generatePersonSchema` function exists in `src/utilities/schema/generatePersonSchema.ts` and supports all required fields. It is NOT imported in `JsonLd.tsx` and NOT called from any homepage code path.

### BlogPosting (post pages)

**Schema generation flow:**
- Post page calls `generateSchema({ doc: post, collection: 'posts', url: fullUrl, breadcrumbs })` — this returns a `@graph` with `[BlogPosting, BreadcrumbList]`
- `schema` prop is passed to `<JsonLd schema={schema} post={post} />`
- In `JsonLd.tsx`, because `schema` is provided and non-null, the `if (post && !schema)` auto-generate block is SKIPPED
- Therefore the BlogPosting comes exclusively from `generateSchema.ts` output

**`mainEntityOfPage` status in `generateSchema.ts`:**
- NOT present. The BlogPosting object (lines 58–71) spreads `baseSchema` (which has `url`, `name`, `description`, `image`, `publisher`) and adds `@type`, `headline`, `description`, `datePublished`, `dateModified`, `author`. No `mainEntityOfPage` field exists.

**`@id` status in `generateSchema.ts`:**
- NOT present. `baseSchema` does not set `@id`. The BlogPosting spread does not add `@id`. Only `url` is inherited from `baseSchema`.

**Fields present (inherited from baseSchema spread + explicit):**
- `@context: 'https://schema.org'` (via baseSchema)
- `@type: 'BlogPosting'`
- `url` (from baseSchema)
- `name` = meta.title or doc.title (from baseSchema)
- `description` = tldr or meta.description
- `image` (from baseSchema, if meta image exists)
- `publisher` with `@id: /#organization`, `@type`, `name`, `founder: { @id: /#person }`, `logo`
- `headline` = title
- `datePublished` = doc.publishedAt
- `dateModified` = doc.updatedAt
- `author` = `{ @type: Person, @id: /#person, name, url: .../author/juan-carlos-angulo }`

**Fields MISSING (required by Google Rich Results):**
- `@id` on the BlogPosting node (self-referencing IRI)
- `mainEntityOfPage: { @type: WebPage, @id: <postUrl> }`

**Note on `generateArticleSchema.ts`:**
- This function IS exported from `src/utilities/schema/index.ts` but is NOT called from any active page component. The category page imports from `@/utilities/schema` but only uses `generateCollectionPageSchema`, `generateFAQSchema`, `generateBreadcrumbSchema`, `mergeSchemas`. The post page uses `generateSchema.ts` directly (not the `schema/` utilities index). `generateArticleSchema` is dead code in the current routing.

### BreadcrumbList

**Post pages (`/blog/[category]/[slug]`):**
- breadcrumbs array IS built in `page.tsx` (4 items: Home → Blog → Category → Post)
- passed to `generateSchema({ ..., breadcrumbs })`
- `generateSchema.ts` calls `generateBreadcrumbSchema(breadcrumbs)` and wraps result in `@graph`
- Status: PRESENT — no change needed

**Category pages (`/blog/[category]`):**
- `generateBreadcrumbSchema` IS called directly with a 3-item array (Home → Blog → Category)
- Status: PRESENT — no change needed

---

## Action Items for Each Plan

### 03-02: Add Person + ProfessionalService to Homepage

In `src/components/JsonLd.tsx`:
1. Add import: `import { generatePersonSchema } from '@/utilities/schema'`
2. After the `expertFaq` block, add `homeSchemas` computation (only when `isHome=true`):
   - Call `generatePersonSchema({ name: 'Juan Carlos Angulo', url: ..., jobTitle: '...', sameAs: [LinkedIn, GitHub], knowsAbout: [...] })`
   - Build `ProfessionalService` schema object inline with `@id: ${siteUrl}/#service`, `provider: { '@id': '${siteUrl}/#person' }`
3. Push `homeSchemas` items into the `schemas` array (after FAQ push, before explicit schema push)

### 03-03: Fix BlogPosting mainEntityOfPage and @id

In `src/utilities/generateSchema.ts`, inside the `collection === 'posts'` branch:
1. Add `'@id': url` to the BlogPosting object
2. Add `mainEntityOfPage: { '@type': 'WebPage', '@id': url }` to the BlogPosting object

No other files need changes. BreadcrumbList is already wired on both post and category pages.
