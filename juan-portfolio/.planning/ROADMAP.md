# Roadmap: juan-tech.com — v1.0 Site Audit & SEO Fixes

## Overview

Five phases turning the initial SEO audit findings into a fully clean, schema-rich, author-backed site. Phase 1 resolves all crawl errors and indexability issues. Phase 2 fixes content problems (HTML artifacts, unresolved category). Phase 3 audits and repairs all Schema.org structured data. Phase 4 builds out the author/person profile for E-E-A-T. Phase 5 documents everything.

## Phases

- [ ] **Phase 1: Crawl Errors & Indexability** — Resolve all 4xx/3xx errors, noindex gaps, and special-character slug
- [ ] **Phase 2: Content Fixes** — Rewrite mejores-cursos body, resolve development/ category, verify all metas
- [ ] **Phase 3: Schema.org Audit & Optimization** — Audit all structured data, fix gaps, validate
- [ ] **Phase 4: Author Profile & E-E-A-T** — Create author profile doc, populate Payload author, link all posts
- [ ] **Phase 5: Documentation & Strategy Summary** — Write post-milestone summary, update audit reports

---

## Phase Details

### Phase 1: Crawl Errors & Indexability
**Goal:** Zero 4xx/3xx URLs in sitemap; all indexability flags (noindex) verified correct in rendered HTML.
**Depends on:** Nothing (first phase)
**Requirements:** CRAWL-01, CRAWL-02, CRAWL-03, CRAWL-04, CRAWL-05
**Success Criteria** (what must be TRUE):
1. A fresh sitemap crawl returns 0 pages with 4xx or 3xx status
2. `mejores-cursos-seo-espanol` resolves at the new URL; old `ñ`-slug returns 301
3. `/blog/general` category page has `noindex` in rendered HTML
4. `guia-eeat.en` and `sql-vs-nosql.en` rendered HTML contains `<meta name="robots" content="noindex">`
5. `experiencia-de-usuario` EN route has noindex applied (stub `.en.md` or code-level solution)

**Plans:**
- [ ] 01-01: Rename mejores-cursos slug + add 301 redirect in Payload redirects collection
- [ ] 01-02: Implement noindex for /blog/general category page (code or CMS)
- [ ] 01-03: Verify noindex rendering for guia-eeat.en + sql-vs-nosql.en; add experiencia-de-usuario EN noindex

---

### Phase 2: Content Fixes
**Goal:** All published posts have clean body content and valid meta tags; unresolved content decisions made.
**Depends on:** Phase 1
**Requirements:** CONTENT-01, CONTENT-02, CONTENT-03
**Success Criteria** (what must be TRUE):
1. `mejores-cursos-seo-espanol.md` body contains no HTML tags, JavaScript, or DinoBrain artifacts
2. `development/` articles either appear under a published "Development" category or are removed from the repo
3. A query of all published posts confirms no post has a missing or over-limit meta description

**Plans:**
- [ ] 02-01: Rewrite mejores-cursos body (remove HTML artifacts, write clean structured content)
- [ ] 02-02: Resolve development/ category — create category in Payload + sync, or delete files
- [ ] 02-03: Audit all post meta descriptions programmatically; fix any remaining gaps

---

### Phase 3: Schema.org Audit & Optimization
**Goal:** All key pages emit valid, complete structured data with no validation errors.
**Depends on:** Phase 2
**Requirements:** SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05
**Success Criteria** (what must be TRUE):
1. Every published blog post has `Article`/`BlogPosting` schema with all required fields in rendered HTML
2. Homepage emits `Person` schema with social `sameAs` links and `knowsAbout`
3. Homepage or service page emits a service/professional schema
4. Zero validation errors when running any page through schema.org validator
5. `BreadcrumbList` schema present on at least one post page and one category page

**Plans:**
- [ ] 03-01: Audit current schema.org implementation in `src/utilities/`; map what exists vs gaps
- [ ] 03-02: Add/fix `Person` schema on homepage; add `sameAs` and `knowsAbout`
- [ ] 03-03: Verify/fix `Article`/`BlogPosting` on posts; add `BreadcrumbList` to posts and categories
- [ ] 03-04: Validate all schema changes; document findings

---

### Phase 4: Author Profile & E-E-A-T
**Goal:** Complete, indexable author presence with all posts linked; profile document created.
**Depends on:** Phase 3
**Requirements:** AUTHOR-01, AUTHOR-02, AUTHOR-03, AUTHOR-04
**Success Criteria** (what must be TRUE):
1. `content/author-profile.md` exists with full bio, credentials, social links, and expertise areas
2. Payload author record has avatar, bio, and all social URLs populated
3. All 26+ published posts show the author relationship in Payload (none empty)
4. Author bio page has >300 words of original content and is not marked noindex

**Plans:**
- [ ] 04-01: Create `content/author-profile.md` with comprehensive person/expertise data
- [ ] 04-02: Update Payload Users collection author record via local API script (bio, avatar, socials)
- [ ] 04-03: Audit all posts for author relationship; bulk-assign author via script where missing

---

### Phase 5: Documentation & Strategy Summary
**Goal:** All audit findings and applied fixes documented; strategy-audit-2026.md completed.
**Depends on:** Phase 4
**Requirements:** DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
1. `content/strategy-audit-2026.md` contains a complete log of all issues found, changes applied, and impact estimates
2. `.planning/seo-audit/` reports reflect the final post-fix state (or a new `05-post-fixes.md` report is added)
3. MILESTONES.md entry for v1.0 is written with stats and git range

**Plans:**
- [ ] 05-01: Write `content/strategy-audit-2026.md` — full audit narrative and change log
- [ ] 05-02: Update `.planning/seo-audit/04-full-audit-log.md` with remaining issues resolved status
- [ ] 05-03: Write MILESTONES.md v1.0 entry; commit all planning artifacts

---

## Stats

- **Total phases:** 5
- **Total plans:** 14
- **Requirements mapped:** 19 / 19 (100% coverage)
- **Starting phase:** 1 (first milestone)
