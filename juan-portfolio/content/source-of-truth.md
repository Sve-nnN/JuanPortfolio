# SEO Source of Truth: Absolute Strategic & Technical Framework

This document is the authoritative reference for all SEO operations within the JuanPortfolio platform. It integrates Google’s Search Essentials with advanced high-performance methodologies from 12 specialized SEO disciplines.

---

## 1. Core Philosophy: People-First & Intent-Driven
We create content for humans first, while ensuring search engine bots can discover and understand it.
- **Search Essentials**: Adherence to Google’s baseline technical requirements is mandatory.
- **Intent Mapping**: Every page must target a specific user journey stage:
    - *Informational*: Learning/Answers (e.g., Blog posts).
    - *Navigational*: Brand/Product access.
    - *Commercial*: Comparison/Reviews.
    - *Transactional*: Direct action/Purchase (e.g., Service pages).
- **E-E-A-T Framework**: Prioritize Experience, Expertise, Authoritativeness, and Trustworthiness. Trust is the non-negotiable foundation.

---

## 2. Technical Foundation: The Crawl-Index-Rank Pipeline

### A. Discovery & Crawling (Crawlability)
- **Robots.txt**: Use to manage crawl budget. **NEVER** block CSS, JS, or images required for rendering. Declare the sitemap URL.
- **Sitemaps XML**: Automatically generated, valid, and contains only canonical, indexable URLs with `<lastmod>` tags.
- **Site Architecture**: Key pages must be within ~3 clicks from the homepage. Ensure no orphaned URLs.
- **Crawl Efficiency**: Minimize redirect chains and loops. Avoid session IDs in URLs.

### B. Understanding & Indexing (Indexation)
- **Semantic HTML**: Use H1-H4, `<article>`, `<nav>`, and `<header>` to provide explicit structural context.
- **DOM Accessibility**: All critical text content must be in the initial DOM. Content added via CSS `content` is ignored.
- **Canonicalization**: Enforce a single "Source of Truth" URL via `rel="canonical"` to consolidate ranking signals.
- **Metadata**: Unique title tags (50-60 chars) and meta descriptions (150-160 chars) for every indexable page.

### C. Performance & Core Web Vitals (Ranking Signals)
- **LCP (Largest Contentful Paint)**: < 2.5s. Optimize hero images (AVIF/WebP) and use `fetchpriority="high"`.
- **INP (Interaction to Next Paint)**: < 200ms. Minimize main-thread JavaScript execution.
- **CLS (Cumulative Layout Shift)**: < 0.1. Define dimensions for all media and use `aspect-ratio`.
- **HTTPS**: Mandatory. Secure every connection and eliminate mixed content.

---

## 3. Keyword & Semantic Strategy

### Entity-Based Optimization
- **Semantic Depth**: Prioritize semantic depth (TF-IDF / LSI Entities) over exact keyword repetition. Ensure topical completeness by covering relevant sub-entities.
- **Semantic Keywords (LSI)**: Integrate related entities and concepts naturally to build topical depth.
- **Anchor Text Standards**: **NEVER** use "click here." Use descriptive, intent-aligned anchor text:
    - `[Date] + [Content Type] + [Publication]` (External).
    - `[Post Title / Semantic Keyword]` (Internal).

### Cannibalization Prevention
- **One Keyword, One Page**: Maintain a strict mapping to prevent internal competition.
- **Intent Differentiation**: If two pages target the same keyword, rewrite one for a different search intent or consolidate them.

---

## 4. Content Architecture: Topic Clusters

We use the **Reverse Hub & Spoke** model:
1.  **Cornerstone/Pillar Page**: Comprehensive guides (3,000+ words) for broad, competitive terms.
2.  **Supporting Content (Spokes)**: Deep dives into specific subtopics that link back to the Pillar with high-relevance anchor text.
3.  **Cross-Linking**: Strategic internal links from spokes to other relevant spokes to establish topical authority.

---

## 5. Featured Snippet & UI Optimization

### Generative AI (SGE / AI Overviews) Optimization
- **TL;DR Summary**: Place a direct, high-value summary paragraph (40-50 words) immediately below the H1 to facilitate AI summarization and improve user retention.
- **Clean Data Extraction**: Use standard HTML lists (`<ul>`, `<ol>`) and tables for key data points to ensure AI crawlers can accurately parse and cite your content.
- **Information Gain**: Always provide original data, personal experience, or unique perspectives ("My Angle") that a generative AI cannot invent or find in top competitor content.

### Snippet Hunting (Position Zero)
- **Direct Answers**: Provide a 40–60 word answer paragraph immediately after a question-based heading (H2/H3).
- **Structured Lists**: Use numbered steps (5-8 items) or bullet points for "how-to" queries.
- **Comparison Tables**: Use clean HTML tables for specifications and comparison data.

### Image & Video SEO
- **Alt Text**: Descriptive, keyword-rich (but natural) text explaining the image's context.
- **Captions**: Place high-quality images near relevant textual explanations.
- **Video**: Standalone pages with transcripts and structured data.

---

## 6. Structured Data (Schema.org)

Always implement **JSON-LD** in the `<head>` for:
- **Article/BlogPosting**: For all blog content.
- **FAQPage**: To dominate People Also Ask (PAA) sections.
- **BreadcrumbList**: To improve SERP snippet presentation.
- **Organization/Person**: To establish brand and author entities.

---

## 7. Audit & Maintenance Protocol

- **SEO Health Index**: Monthly audits scoring Crawlability (30%), Foundations (25%), On-Page (20%), E-E-A-T (15%), and Authority (10%).
- **Content Refreshing**:
    - Update statistics older than 2 years.
    - Refresh examples/case studies older than 3 years.
    - Update titles with the current year for freshness signals.
- **Monitoring**: Continuous tracking via Google Search Console (Index Coverage, CWV) and Lighthouse CI.

---

## 8. Prohibited Practices (Strategic Non-Focus)
- **Meta Keywords**: Ignored by Google.
- **Word Count Obsession**: Write for value, not length.
- **Keyword-First URLs**: Follow business logic; keywords in slugs are low-impact beyond breadcrumbs.
- **Heading Order Obsession**: Prioritize logic and accessibility over "SEO order."
