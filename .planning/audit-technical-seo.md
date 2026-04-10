# Technical SEO Audit Report — juan-tech.com

**Date:** 2026-04-09  
**Auditor:** Technical SEO Agent  
**Stack:** Next.js 15 + Payload CMS 3, Vercel, Bilingual (ES/EN)  
**Overall Technical Score: 78/100**

---

## Executive Summary

The site has a strong technical foundation with SSR/SSG via Next.js, robust security headers, proper hreflang implementation, and comprehensive structured data. However, there are several high-impact issues: a broken static sitemap, missing AI crawler management in robots.txt, absence of IndexNow integration, and potential CLS issues from dynamic block loading. The site excels in security, URL structure, and metadata management but needs attention on crawlability signals and performance optimization.

---

## 1. Crawlability & Indexability

### 1.1 robots.txt

**Status: NEEDS IMPROVEMENT**

**Dynamic robots.txt (`src/app/robots.ts`)** -- GOOD:
- Allows all user-agents on `/`
- Blocks `/admin`
- Lists 5 sitemaps (main, pages, posts, categories, authors)

**Static robots.txt (`public/robots.txt`)** -- ISSUE:
- The static file at `public/robots.txt` is a stripped-down version that only lists 1 sitemap
- Depending on build/deploy behavior, this static file may override the dynamic one
- **Missing: `Disallow: /api/`** -- API endpoints are crawlable
- **Missing: `Disallow: /_next/`** -- Internal Next.js routes exposed
- **Missing: AI crawler rules** -- No rules for GPTBot, ChatGPT-User, ClaudeBot, CCBot, PerplexityBot, Google-Extended, Anthropic-AI, etc.
- **Missing: `Crawl-delay`** directive for aggressive bots

**Issues:**
| Priority | Issue | Impact |
|----------|-------|--------|
| CRITICAL | Static `public/robots.txt` may shadow dynamic `src/app/robots.ts` | Sitemaps not discoverable by crawlers |
| HIGH | No `/api/` disallow rule | API endpoints being crawled and indexed |
| HIGH | No AI crawler management rules | Uncontrolled AI training data scraping |
| MEDIUM | No `/_next/` disallow rule | Internal build assets exposed |

### 1.2 Meta Robots / noindex

**Status: GOOD**

- `generateMeta()` in `src/utilities/generateMeta.ts` supports per-page `noindex` from CMS via `meta.noindex` or `doc.noindex`
- When noindex is true, both `index: false` and `follow: false` are set
- The `/sitemap` HTML page explicitly sets `robots: { index: true, follow: true }`

**Minor Issue:**
- When `noindex: true`, the system sets `follow: false` as well. Best practice is `noindex, follow` to still pass link equity.

### 1.3 Canonical Tags

**Status: GOOD**

- `generateMeta()` correctly builds canonical URLs per locale
- ES pages: `https://juan-tech.com/path`
- EN pages: `https://juan-tech.com/en/path`
- Root layout also sets canonical with `x-default` pointing to ES
- `getServerSideURL()` strips `www.` and enforces `https://` in production

### 1.4 Hreflang Implementation

**Status: GOOD**

- Every page generates `alternates.languages` with `es`, `en`, and `x-default`
- Root layout, post pages, category pages, contact, terms, privacy all implement this
- `x-default` consistently points to ES (the default locale)

**Minor Issue:**
- Hreflang values use `'es'` and `'en'` instead of the recommended `'es-ES'`/`'en-US'` or `'es'`/`'en'` BCP-47 tags. Google accepts both, but being more specific (`es-419` for LATAM) could improve geo-targeting.

---

## 2. Sitemap Implementation

### 2.1 Dynamic Sitemaps (Route Handlers)

**Status: GOOD**

Four dynamic sitemaps via `next-sitemap`:
- `/posts-sitemap.xml` -- All published posts, both locales, with category-based URLs
- `/pages-sitemap.xml` -- All published pages + `/blog` + `/search` per locale
- `/categories-sitemap.xml` -- All categories per locale
- `/authors-sitemap.xml` -- All authors per locale

All use `unstable_cache` with tag-based revalidation (e.g., `'posts-sitemap'`), triggered by CMS hooks.

### 2.2 Static Sitemaps

**Status: CRITICAL ISSUE**

- `public/sitemap.xml` contains only 1 entry: `robots.txt` itself
- `public/sitemap-0.xml` is identical -- only `robots.txt`
- These are placeholder/broken files that serve no purpose
- The dynamic `src/app/robots.ts` references `/sitemap.xml` which would serve this broken static file

**Issues:**
| Priority | Issue | Impact |
|----------|-------|--------|
| CRITICAL | `public/sitemap.xml` only indexes `robots.txt` URL | Main sitemap is effectively empty -- search engines can't discover pages via primary sitemap |
| HIGH | Duplicate broken sitemap at `public/sitemap-0.xml` | Confusing for crawlers |
| MEDIUM | No sitemap index file | 5 separate sitemaps without a single index entry point |

### 2.3 Sitemap Plugin (Legacy)

- `src/plugins/seo/endpoints/sitemap.ts` contains a legacy Payload endpoint-based sitemap generator
- Uses `req/res` pattern (Express-style), not the App Router convention
- This appears to be dead code -- the active sitemaps use route handlers

---

## 3. URL Structure

### 3.1 URL Architecture

**Status: EXCELLENT**

- Clean, hierarchical URLs: `/blog/{category}/{slug}`
- Locale prefixing: ES (default) has no prefix, EN uses `/en/`
- Case studies: `/case-studies/{slug}`
- Authors: `/authors/{slug}`

### 3.2 Redirects

**Status: GOOD**

- `www` to non-www (301 permanent)
- `/posts/*` to `/blog/*` (legacy migration)
- `/sitemap.html` to `/sitemap` (301)
- Singular to plural sitemap XML redirects
- IE browser redirect
- CMS-managed redirects via `redirects.json`
- MongoDB ObjectID detection in category slugs with automatic redirect to real slug

### 3.3 Middleware

**Status: GOOD**

- `src/middleware.ts` handles locale routing via URL rewriting (not redirects)
- Correctly excludes `/api`, `/_next`, `/admin`, `/sitemap`, and static files
- Default locale (ES) is served without prefix, rewritten internally to `/es/`

---

## 4. Security

### 4.1 Headers

**Status: EXCELLENT**

All critical security headers are configured in `next.config.js`:

| Header | Value | Status |
|--------|-------|--------|
| Content-Security-Policy | Comprehensive CSP with specific sources | PASS |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` (2 years) | PASS |
| X-Frame-Options | `SAMEORIGIN` | PASS |
| X-Content-Type-Options | `nosniff` | PASS |
| Referrer-Policy | `strict-origin-when-cross-origin` | PASS |
| Permissions-Policy | Disables camera, microphone, geolocation | PASS |
| Cross-Origin-Opener-Policy | `same-origin-allow-popups` | PASS |
| Cross-Origin-Resource-Policy | `cross-origin` | PASS |
| X-DNS-Prefetch-Control | `on` | PASS |

### 4.2 CSP Analysis

**Concern:** CSP includes `'unsafe-eval'` and `'unsafe-inline'` for `script-src`. This is common with Next.js but reduces CSP effectiveness. Consider using nonce-based CSP if feasible.

### 4.3 HTTPS

**Status: PASS**

- `upgrade-insecure-requests` in CSP
- HSTS with preload
- `getServerSideURL()` enforces HTTPS in production

---

## 5. Mobile Optimization

### 5.1 Viewport & Responsive Design

**Status: GOOD**

- Next.js 15 automatically sets the viewport meta tag
- Responsive grid layouts throughout (`grid-cols-1 lg:grid-cols-[1fr_320px]`)
- Mobile-specific TOC variant (`lg:hidden` for mobile, `hidden lg:block` for desktop)
- Responsive image sizes: `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw`

### 5.2 Touch Targets

**Status: ACCEPTABLE**

- Links in sitemap page use padding and spacing (`space-y-3`, `space-y-2.5`)
- Navigation components use standard Next.js Link components

---

## 6. Core Web Vitals (Source-level Assessment)

### 6.1 LCP (Largest Contentful Paint)

**Status: GOOD with caveats**

**Positives:**
- Hero images use `priority={true}`, `fetchPriority="high"`, `loading="eager"`
- Image formats include AVIF and WebP (`next.config.js: formats: ['image/avif', 'image/webp']`)
- Font loading with `display: 'swap'` prevents FOIT
- Static asset caching: `max-age=31536000, immutable` for `/_next/static/` and `/fonts/`

**Concerns:**
- Cloudinary images with `unoptimized={true}` bypass Next.js Image optimization
- Large placeholderBlur base64 string (741 chars) embedded inline in every image component

### 6.2 INP (Interaction to Next Paint)

**Status: ACCEPTABLE**

- Most interactive blocks (FAQ, forms, carousels) are client components (`'use client'`)
- Blocks loaded via `next/dynamic` -- lazy loading reduces initial JS bundle
- `optimizePackageImports` for `framer-motion` and `lucide-react`
- Modularized lucide-react imports to prevent full library import

**Concerns:**
- 11 client-side blocks could contribute to hydration overhead
- `framer-motion` used in multiple animation components (AnimateOnScroll, etc.)

### 6.3 CLS (Cumulative Layout Shift)

**Status: NEEDS IMPROVEMENT**

**Concerns:**
- All blocks loaded via `next/dynamic` without `loading` fallbacks or size reservations
- The `RenderBlocks` component uses margin classes (`mb-16`, `my-20 lg:my-32`) but no explicit height reservations
- Image component uses blur placeholder (good) but Cloudinary images skip optimization
- Font files loaded locally with `display: 'swap'` -- slight FOUT risk but minimal shift

| Priority | Issue | Impact |
|----------|-------|--------|
| MEDIUM | Dynamic blocks without skeleton/loading states | Layout shifts as blocks load |
| LOW | `font-display: swap` on 3 font families | Minor FOUT, acceptable tradeoff |

---

## 7. Structured Data / Schema Markup

### 7.1 Organization & WebSite Schema

**Status: GOOD**

- Root layout generates `Organization` and `WebSite` schemas from CMS `site-settings` global
- WebSite schema includes `SearchAction` for sitelinks search box
- Organization includes logo, social profiles, contact point

### 7.2 Blog Post Schema

**Status: GOOD**

- `BlogPosting` schema with author, dates, publisher, mainEntityOfPage
- `BreadcrumbList` schema on post pages
- FAQ schema extracted from both layout blocks and embedded Lexical content blocks
- `@graph` array pattern used correctly to combine multiple schemas

### 7.3 Home Page Schema

**Status: GOOD**

- `Person` schema for author
- `ProfessionalService` schema
- `FAQPage` schema with expert FAQ

### 7.4 Category Pages Schema

**Status: GOOD**

- `CollectionPage` schema with item count
- FAQ schema when categories have FAQs
- Breadcrumb schema

**Issues:**
| Priority | Issue | Impact |
|----------|-------|--------|
| MEDIUM | `generateSchema.ts` uses `process.env.NEXT_PUBLIC_SERVER_URL` directly (may be undefined at build) | Schema URLs could be malformed in SSG |
| LOW | No `Article` schema variant for pillar content vs. satellite | Missing content hierarchy signals |

---

## 8. JavaScript Rendering (SSR vs CSR)

### 8.1 Rendering Strategy

**Status: EXCELLENT**

- **SSR/SSG primary**: All page components are async server components
- `generateStaticParams()` used on post pages, category pages, and contact page for ISR/SSG
- Only 11 out of ~30 blocks are client-side (`'use client'`)
- Client components are used appropriately: forms, animations, carousels, interactive FAQ

### 8.2 Bundle Optimization

**Status: GOOD**

- All blocks lazy-loaded via `next/dynamic`
- `optimizePackageImports` for heavy libraries
- `modularizeImports` for lucide-react
- `compress: true` enables gzip
- `optimizeCss: true` (experimental)
- `reactStrictMode: true`

### 8.3 Third-party Scripts

**Status: GOOD**

- Google Analytics/GTM loaded in `React.Suspense` boundary
- Ahrefs analytics loaded with `strategy="afterInteractive"`
- Vercel Analytics and SpeedInsights loaded as components (tree-shakeable)

---

## 9. IndexNow Protocol

**Status: NOT IMPLEMENTED**

- No IndexNow integration found in the codebase
- No IndexNow API key file in `/public/`
- CMS hooks (`revalidatePost`, `revalidatePage`, `revalidateCaseStudy`) revalidate Next.js cache and sitemap tags but do not ping IndexNow

**Recommendation:** Add IndexNow pings in CMS afterChange hooks to notify Bing, Yandex, and Naver of content changes in real-time.

---

## 10. AI Crawler Management

**Status: NOT IMPLEMENTED**

- No `llms.txt` file in `/public/`
- No AI-specific rules in robots.txt
- No AI crawler blocking or allowing in middleware
- Content strategy document (`content/source-of-truth.md`) mentions GEO strategy but no technical implementation

---

## Prioritized Issues Summary

### CRITICAL (Fix Immediately)

1. **Broken static `public/sitemap.xml`** -- Contains only a self-referencing robots.txt entry. This is the primary sitemap referenced by robots.txt. Either remove the static file and ensure the dynamic route serves at `/sitemap.xml`, or generate a proper sitemap index file.

2. **Static `public/robots.txt` may shadow dynamic `src/app/robots.ts`** -- The static file lacks `/admin`, `/api/` disallow rules and only lists 1 sitemap instead of 5. Verify which file is served in production and consolidate.

### HIGH (Fix This Sprint)

3. **No `/api/` disallow in robots.txt** -- API endpoints are exposed to crawlers, potentially indexing raw JSON responses.

4. **No AI crawler rules in robots.txt** -- GPTBot, ClaudeBot, CCBot, PerplexityBot, etc. have unrestricted access. Decide on an AI crawling policy and implement it.

5. **No IndexNow integration** -- Content updates rely solely on sitemaps for discovery. IndexNow provides near-instant indexing for Bing/Yandex.

6. **Duplicate broken `public/sitemap-0.xml`** -- Remove this file.

### MEDIUM (Fix This Month)

7. **Dynamic blocks lack loading skeletons** -- `RenderBlocks` uses `next/dynamic` without `loading` option, causing potential CLS during block hydration.

8. **Schema URLs use `process.env.NEXT_PUBLIC_SERVER_URL` directly** -- May produce malformed URLs during static generation if env var is not set at build time. Use `getServerSideURL()` consistently.

9. **`noindex` also sets `follow: false`** -- Should be `noindex, follow` to preserve link equity on noindexed pages.

10. **No `llms.txt` file** -- Missing discoverability file for AI systems.

11. **Legacy sitemap plugin is dead code** -- `src/plugins/seo/endpoints/sitemap.ts` uses Express-style `req/res` and appears unused. Remove to avoid confusion.

### LOW (Backlog)

12. **Hreflang uses short codes** -- `'es'` and `'en'` instead of region-specific BCP-47 tags like `'es-419'` for LATAM targeting.

13. **CSP uses `unsafe-eval` and `unsafe-inline`** -- Common with Next.js but reduces security posture. Consider nonce-based CSP.

14. **Cloudinary images bypass Next.js optimization** -- `unoptimized={true}` for Cloudinary URLs means no responsive image optimization from Next.js. Cloudinary transformations should handle this, but verify.

15. **No `Case-Study` specific schema type** -- Case studies use generic page schema instead of a more specific type.

---

## What's Working Well

- **SSR/SSG architecture** -- Excellent rendering strategy with server components as default
- **Security headers** -- Comprehensive, industry-best-practice headers including HSTS preload
- **Hreflang & canonical tags** -- Properly implemented across all page types
- **Structured data** -- Rich schema markup with Organization, WebSite, BlogPosting, BreadcrumbList, FAQPage, Person, ProfessionalService, CollectionPage
- **Image optimization** -- Priority/eager loading for LCP images, blur placeholders, AVIF/WebP formats
- **URL structure** -- Clean, hierarchical, SEO-friendly URLs
- **Redirect handling** -- Comprehensive redirects covering legacy URLs, www normalization, IE detection
- **Cache strategy** -- Immutable caching for static assets, tag-based revalidation for dynamic content
- **Bundle optimization** -- Lazy-loaded blocks, modularized imports, package optimization
- **CMS-driven SEO** -- Per-page noindex, meta titles/descriptions, OG images all managed from Payload CMS

---

## Technical Score Breakdown

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Crawlability | 60/100 | 20% | 12 |
| Indexability | 85/100 | 15% | 12.75 |
| Security | 92/100 | 10% | 9.2 |
| URL Structure | 95/100 | 10% | 9.5 |
| Mobile | 85/100 | 10% | 8.5 |
| Core Web Vitals | 75/100 | 15% | 11.25 |
| Structured Data | 82/100 | 10% | 8.2 |
| JS Rendering | 90/100 | 10% | 9 |
| **TOTAL** | | **100%** | **80.4** |

**Adjusted Score: 78/100** (penalty for critical sitemap and robots.txt issues)

---

## Key Files Referenced

- `/public/robots.txt` -- Static robots file (problematic)
- `/src/app/robots.ts` -- Dynamic robots route
- `/public/sitemap.xml` -- Broken static sitemap
- `/public/sitemap-0.xml` -- Duplicate broken sitemap
- `/src/app/(frontend)/(sitemaps)/posts-sitemap.xml/route.ts` -- Dynamic posts sitemap
- `/src/app/(frontend)/(sitemaps)/pages-sitemap.xml/route.ts` -- Dynamic pages sitemap
- `/src/app/(frontend)/(sitemaps)/categories-sitemap.xml/route.ts` -- Dynamic categories sitemap
- `/src/app/(frontend)/(sitemaps)/authors-sitemap.xml/route.ts` -- Dynamic authors sitemap
- `/next.config.js` -- Security headers, redirects, image config
- `/src/middleware.ts` -- Locale routing
- `/src/utilities/generateMeta.ts` -- Meta/canonical/hreflang generation
- `/src/utilities/generateSchema.ts` -- Schema markup generation
- `/src/components/JsonLd.tsx` -- Structured data rendering
- `/src/app/(frontend)/layout.tsx` -- Root layout with schema, analytics
- `/src/blocks/RenderBlocks.tsx` -- Block registry (lazy-loaded)
- `/src/components/Media/ImageMedia/index.tsx` -- Image optimization component
- `/src/plugins/seo/endpoints/sitemap.ts` -- Legacy sitemap (dead code)
