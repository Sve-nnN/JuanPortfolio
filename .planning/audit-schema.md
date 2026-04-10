# Schema Markup Audit Report

**Date:** 2026-04-09
**Site:** juan-tech.com (JuanPortfolio)
**Framework:** Next.js 15 + Payload CMS 3

---

## 1. Current Schema Implementation Status

### Architecture Overview
The site has a well-organized schema system with dedicated utility files under `src/utilities/schema/` and a central `JsonLd` component at `src/components/JsonLd.tsx`. There is also a separate plugin-based schema generator at `src/plugins/seo/utils/schemaGenerator.ts` (appears unused in page routes — legacy/dead code).

### Schema Types Implemented

| Schema Type | Where Used | Format |
|---|---|---|
| **Organization** | Root layout (`layout.tsx`) — every page | JSON-LD via `@graph` |
| **WebSite** + SearchAction | Root layout (`layout.tsx`) — every page | JSON-LD via `@graph` |
| **BlogPosting** | Blog post pages (`blog/[category]/[slug]`) | JSON-LD via `@graph` |
| **Person** | Home page, Author pages (`/author/[slug]`, `/authors/[slug]`) | JSON-LD via `@graph` |
| **ProfessionalService** | Home page only | JSON-LD via `@graph` |
| **FAQPage** | Home page (expert FAQ fallback), category pages, embedded in posts | JSON-LD via `@graph` |
| **BreadcrumbList** | Blog posts, category pages, author detail page (`/authors/[slug]`) | JSON-LD via `@graph` |
| **CollectionPage** | Category pages (`blog/[category]`) | JSON-LD via `@graph` |
| **TechArticle** | Case study detail pages | JSON-LD standalone |
| **SearchResultsPage** + ItemList | Search results page | JSON-LD via `@graph` |
| **ItemList** (Clients) | FeaturedClients block (home) | JSON-LD standalone |
| **WebPage** | Generic pages (`/[slug]`) | JSON-LD via `@graph` |

### Delivery Method
- Primary: `<JsonLd>` React component rendering `<script type="application/ld+json">`
- Secondary: Direct `<script>` tags in `FeaturedClients` block and `authors/[slug]` page
- All use JSON-LD format (correct, preferred by Google)

---

## 2. Issues Found

### CRITICAL Issues

#### C1. Duplicate/Conflicting BlogPosting Schema on Post Pages
**File:** `src/components/JsonLd.tsx:140-167` + `src/utilities/generateSchema.ts:46-84`
**Problem:** On blog post pages (`blog/[category]/[slug]/page.tsx`), the `JsonLd` component receives BOTH a `schema` prop (from `generateSchema()` which already creates a BlogPosting) AND a `post` prop. At line 140, the code checks `if (post && !schema)` to auto-generate an Article schema — but since `schema` is always provided by `generateSchema()`, this second BlogPosting is never generated. This means the BlogPosting from `generateSchema()` is used, which has a different structure than the one in `JsonLd`. This is not a duplication bug per se, but it means the richer BlogPosting logic in `JsonLd` (lines 147-167) that includes multiple authors, image, publisher @id reference, and category-based URL is **dead code** for post pages.

**Impact:** Medium. The active BlogPosting from `generateSchema()` is less complete (single author object vs. array, no image property).

#### C2. Double `@context` in Nested Schemas
**File:** `src/utilities/generateSchema.ts:24-25` + `src/utilities/generateSchema.ts:90-91`
**Problem:** `generateSchema()` creates a `baseSchema` with `@context: 'https://schema.org'` embedded in the entity itself (line 25). When breadcrumbs are present, it wraps everything in a second `@graph` with another `@context` (line 90). Then `JsonLd.tsx:174` wraps everything AGAIN in `{ '@context': 'https://schema.org', '@graph': schemas }`. This results in **triple-nested @context** declarations.

When breadcrumbs exist on a blog post, the rendered JSON-LD looks like:
```json
{
  "@context": "https://schema.org",      // From JsonLd.tsx
  "@graph": [{
    "@context": "https://schema.org",    // From generateSchema wrapper
    "@graph": [{
      "@context": "https://schema.org",  // From baseSchema
      "@type": "BlogPosting", ...
    }, {
      "@context": "https://schema.org",  // From breadcrumb generator
      "@type": "BreadcrumbList", ...
    }]
  }]
}
```

**Impact:** High. Nested `@graph` arrays with redundant `@context` can confuse parsers. Google's Rich Results Test may still parse it, but it's structurally incorrect per JSON-LD spec. Each individual schema generator (Breadcrumb, Organization, Person, etc.) adds its own `@context` which becomes redundant when merged into `@graph`.

#### C3. Organization Schema Missing in BlogPosting Publisher
**File:** `src/utilities/generateSchema.ts:34-42`
**Problem:** The `publisher` in `generateSchema()` includes full Organization details inline (name, logo, founder) with `@type: 'Organization'`. But the Organization schema from the root layout uses `@id: '.../#organization'`. The BlogPosting should reference the Organization by `@id` only, not duplicate it. Meanwhile in `JsonLd.tsx:161`, the publisher correctly uses `{ '@id': '.../#organization' }`. The mismatch means the active code path has an inline publisher rather than a linked one.

**Impact:** Medium. Not invalid, but duplicates data and misses the benefit of `@id` linking within the `@graph`.

#### C4. Missing `@context` in Several Schema Generators When Used Standalone
**Files:** `src/utilities/schema/generateCollectionPageSchema.ts`, `src/utilities/schema/generateFAQSchema.ts`
**Problem:** When these generators are used via `mergeSchemas()`, the merge function adds `@context`. But the individual generators ALSO include `@context`, creating redundancy. Conversely, if they were used standalone, they'd work fine. The inconsistency is a code smell rather than a runtime bug, but `generateCollectionPageSchema` includes `@context` while it's always used inside `mergeSchemas`.

**Impact:** Low.

### HIGH Priority Issues

#### H1. FAQPage Schema on Commercial Site
**File:** `src/components/JsonLd.tsx:113-125`, `src/utilities/schema/generateFAQSchema.ts`
**Problem:** FAQPage schema is generated on the home page (with a hardcoded "expert" FAQ at line 63-68), blog category pages, and within blog posts that contain FAQ blocks. Since August 2023, Google restricted FAQPage rich results to government and healthcare sites only. juan-tech.com is a commercial site.

**Impact:** The FAQPage markup will NOT generate Google rich results. However, it still benefits AI/LLM citations and GEO (Generative Engine Optimization), so this is informational, not critical. The hardcoded "expert FAQ" on the homepage (line 63-68) is a self-promotional question that could appear manipulative to crawlers.

#### H2. Case Study Schema Missing Required Properties
**File:** `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx:107-119`
**Problem:** The TechArticle schema for case studies is missing several recommended properties:
- No `publisher` property (required for Article rich results)
- No `mainEntityOfPage`
- Author is hardcoded as "Juan Carlos Angulo" with no `@id` or `url`
- No `image` fallback if meta image is absent (Google requires image for Article rich results)
- The `@context` is included inline, but this schema is then passed to `JsonLd` which wraps it in another `@graph` with `@context`

**Impact:** High. Case studies will not qualify for Article rich results without `publisher` and `image`.

#### H3. Missing BreadcrumbList on Several Page Types
**Pages without breadcrumbs:**
- Home page (`/`)
- Blog listing page (`/blog`)
- Blog paginated pages (`/blog/page/[n]`)
- Case studies listing (`/case-studies`)
- Authors listing (`/authors`)
- Author page at `/author/[slug]` (note: `/authors/[slug]` HAS breadcrumbs)
- Search page (`/search`)
- Generic pages (`/[slug]`) except when breadcrumbs data exists

**Impact:** Medium. BreadcrumbList is one of the most reliable rich result types. Missing breadcrumbs on listing pages reduces navigation schema coverage.

#### H4. Duplicate Author Page Routes with Different Schema
**Routes:** `/author/[slug]` vs `/authors/[slug]`
**Problem:** Two different page components serve author profiles with different schema implementations:
- `/author/[slug]` uses `JsonLd` component with Person schema (no breadcrumbs)
- `/authors/[slug]` uses `<Script>` tag with Person + BreadcrumbList merged schema

Both generate Person schema with the same `@id` (`/#person`), but different property sets. If both are indexed, Google sees conflicting Person entities.

**Impact:** High. Duplicate content + conflicting schemas for the same entity.

#### H5. SearchAction URL May Be Relative
**File:** `src/utilities/schema/generateWebSiteSchema.ts:20-27`
**Problem:** If `searchUrl` from SiteSettings is `/search` (relative), the `urlTemplate` becomes `/search?q={search_term_string}` which is relative. Google requires absolute URLs in schema markup.

**Impact:** Medium. The SearchAction sitelinks search box may not work if the URL is relative.

### MEDIUM Priority Issues

#### M1. BlogPosting `image` Property Uses Relative URL
**File:** `src/components/JsonLd.tsx:160`
**Problem:** `(post.meta.image as Media).url` likely returns a relative path like `/media/image.jpg`. The BlogPosting image should be an absolute URL. In contrast, `generateSchema.ts:29` correctly prepends `process.env.NEXT_PUBLIC_SERVER_URL`.

**Impact:** Medium (though this code path is currently dead code per C1).

#### M2. FeaturedClients Schema Missing from @graph
**File:** `src/blocks/FeaturedClients/Component.tsx:30-46`
**Problem:** The FeaturedClients block outputs its own standalone `<script type="application/ld+json">` with `@context`, creating a separate JSON-LD block on the page instead of being part of the main `@graph`. This means the home page has at minimum 3 separate JSON-LD blocks (Organization+WebSite from layout, Person+ProfessionalService+FAQ from JsonLd, ItemList from FeaturedClients).

**Impact:** Low. Multiple JSON-LD blocks are valid per Google documentation, but a single `@graph` is cleaner and avoids any parsing ambiguity.

#### M3. Person Schema `@id` Collision
**Files:** Multiple
**Problem:** All Person schemas use the same `@id: '.../#person'` regardless of which person it represents. If the site ever has multiple authors, they'd all share the same `@id`, creating conflicting entities.

**Impact:** Low for now (single-author site), but architecturally fragile.

#### M4. Blog Listing Pages Missing Schema
**File:** `src/app/(frontend)/[locale]/blog/page.tsx`
**Problem:** The main blog listing page and paginated blog pages have no JSON-LD schema at all. They should have a CollectionPage or ItemList schema similar to category pages.

**Impact:** Medium. Missed opportunity for structured data on high-traffic listing pages.

#### M5. Authors Listing Page Missing Schema
**File:** `src/app/(frontend)/[locale]/authors/page.tsx`
**Problem:** No schema markup at all. Should have a CollectionPage schema with person entities.

**Impact:** Low-Medium.

#### M6. Case Studies Listing Page Missing Schema
**File:** `src/app/(frontend)/[locale]/case-studies/page.tsx`
**Problem:** No schema markup at all.

**Impact:** Low.

### LOW Priority Issues

#### L1. Dead Code: Plugin Schema Generator
**File:** `src/plugins/seo/utils/schemaGenerator.ts`
**Problem:** This is a full schema generation system (205 lines) that appears unused in any page route. The `SEOHead` component at `src/plugins/seo/components/SEOHead.tsx` uses Next.js Pages Router `Head` component (not App Router), suggesting this is legacy code from a migration.

**Impact:** None functionally, but increases maintenance burden.

#### L2. `hasCredential` Schema Type Mismatch
**File:** `src/utilities/schema/generatePersonSchema.ts:57`
**Problem:** The `datePublished` property on `EducationalOccupationalCredential` is not a standard property. The correct property is `dateCreated` or `validFrom`.

**Impact:** Low. Google doesn't use credential schema for rich results.

#### L3. Hardcoded Site URL
**File:** `src/components/JsonLd.tsx:37`, `src/app/(frontend)/[locale]/search/page.tsx:82`
**Problem:** `siteUrl` defaults to `'https://juan-tech.com'` in JsonLd component props. The search page hardcodes `https://juan-tech.com`. Other files correctly use `getServerSideURL()` or `process.env.NEXT_PUBLIC_SERVER_URL`.

**Impact:** Low (works in production but could cause issues in staging/preview environments).

---

## 3. Pages/Routes Schema Coverage Summary

| Page Route | Schemas Present | Issues |
|---|---|---|
| `/` (Home) | Organization, WebSite, Person, ProfessionalService, FAQPage | H1 (FAQPage restricted), expert FAQ manipulative |
| `/blog` | Organization, WebSite | M4 (no CollectionPage/ItemList) |
| `/blog/page/[n]` | Organization, WebSite | M4 (no schema), H3 (no breadcrumbs) |
| `/blog/[category]` | Organization, WebSite, CollectionPage, BreadcrumbList, FAQPage* | H1 (FAQPage restricted) |
| `/blog/[category]/[slug]` | Organization, WebSite, BlogPosting, BreadcrumbList, FAQPage* | C2 (nested @context), C3 (inline publisher) |
| `/case-studies` | Organization, WebSite | M6 (no schema) |
| `/case-studies/[slug]` | Organization, WebSite, TechArticle | H2 (missing publisher/image) |
| `/authors` | Organization, WebSite | M5 (no schema) |
| `/authors/[slug]` | Organization, WebSite, Person, BreadcrumbList | H4 (duplicate with /author) |
| `/author/[slug]` | Organization, WebSite, Person | H4 (duplicate, no breadcrumbs) |
| `/search` | Organization, WebSite, SearchResultsPage* | L3 (hardcoded URL) |
| `/[slug]` (pages) | Organization, WebSite, WebPage, BreadcrumbList* | C2 (nested @context when breadcrumbs) |

*Only present when conditions are met (FAQs exist, search query present, breadcrumbs data available).

---

## 4. Recommendations

### Priority 1 (Fix Now)

1. **Eliminate nested `@context` and `@graph`**: Remove `@context` from all individual schema generators (`generateOrganizationSchema`, `generateBreadcrumbSchema`, `generatePersonSchema`, `generateFAQSchema`, `generateCollectionPageSchema`, `generateWebSiteSchema`). Only the top-level `JsonLd` component should add `@context` and `@graph`. Similarly, refactor `generateSchema.ts` to not add its own `@context` or `@graph` wrapper.

2. **Fix Case Study schema**: Add `publisher`, `mainEntityOfPage`, and ensure `image` is present with absolute URL. Use `@id` reference for publisher and author.

3. **Consolidate author routes**: Either redirect `/author/[slug]` to `/authors/[slug]` or vice versa. Remove one implementation.

4. **Ensure absolute URLs everywhere**: Audit all schema properties that accept URLs. The SearchAction `urlTemplate` and any image URLs must be absolute.

### Priority 2 (Should Fix)

5. **Add CollectionPage schema to blog listing** (`/blog`) and **paginated pages** (`/blog/page/[n]`).

6. **Add BreadcrumbList to all pages** that currently lack it (blog listing, case studies listing, authors listing, search).

7. **Refactor BlogPosting generation**: Either use the richer `JsonLd` component logic (which supports multiple authors) or enhance `generateSchema()` to include image, multiple authors, and `@id`-linked publisher. Remove the dead code path.

8. **Remove or tone down the expert FAQ** on the homepage (line 63-68 in JsonLd.tsx). Self-promotional FAQs like "Who is the best expert?" could be seen as manipulative by quality raters.

### Priority 3 (Nice to Have)

9. **Clean up dead code**: Remove `src/plugins/seo/utils/schemaGenerator.ts` and `src/plugins/seo/components/SEOHead.tsx` if confirmed unused.

10. **Add unique `@id` per person**: Use author slug in the `@id` instead of a generic `/#person` to support future multi-author scenarios.

11. **Unify JSON-LD output**: Consider having all blocks (FeaturedClients, etc.) contribute schemas to a centralized collector rather than emitting standalone `<script>` tags.

12. **Fix `hasCredential.datePublished`** to use `dateCreated` per Schema.org spec.

---

## 5. Validation Checklist Results

| Check | Status | Notes |
|---|---|---|
| `@context` is `https://schema.org` | PASS | All use https (not http) |
| `@type` values are valid and not deprecated | PASS | No deprecated types used |
| Required properties present | PARTIAL FAIL | Case studies missing publisher; BlogPosting from generateSchema missing image |
| Property values match expected types | PARTIAL FAIL | hasCredential.datePublished is non-standard |
| No placeholder text | PASS | No placeholder values found |
| URLs are absolute | PARTIAL FAIL | SearchAction URL potentially relative; some image URLs relative |
| Dates in ISO 8601 | PASS | All dates come from Payload CMS which uses ISO 8601 |
| No nested @context/@graph | FAIL | Multiple levels of nesting in post pages |
| No duplicate schemas for same entity | PARTIAL FAIL | Duplicate author routes; potential double Organization in BlogPosting |
