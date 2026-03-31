# Requirements: juan-tech.com

**Defined:** 2026-03-30
**Milestone:** v1.0 — Site Audit & SEO Fixes
**Core Value:** Rank for high-intent consulting keywords in Spanish while building E-E-A-T signals through technically rigorous, bilingual content.

---

## v1.0 Requirements

### Crawl Audit

- [ ] **CRAWL-01**: All URLs in the sitemap return 2xx status codes (no 4xx/3xx errors surfaced by crawler)
- [ ] **CRAWL-02**: `/blog/general` category page has `noindex` so it doesn't waste crawl budget
- [ ] **CRAWL-03**: `experiencia-de-usuario` EN route is excluded from indexing (no EN content exists for it)
- [ ] **CRAWL-04**: `noindex` on `guia-eeat.en.md` and `sql-vs-nosql.en.md` is verified to emit correct `<meta name="robots">` in rendered HTML
- [ ] **CRAWL-05**: `mejores-cursos-seo-en-español` slug is renamed to `mejores-cursos-seo-espanol` with a 301 redirect, eliminating the special-character URL

### Content Fixes

- [ ] **CONTENT-01**: `mejores-cursos-seo-espanol` article body is rewritten — all HTML artifacts and JavaScript remnants from DinoBrain removed, replaced with clean structured content
- [ ] **CONTENT-02**: `development/` category articles (7 posts ES+EN) have a resolution applied: either a "Development" category is created in Payload and they are published, or they are explicitly removed from the repository
- [ ] **CONTENT-03**: All published posts have a non-empty, within-limit meta description (no post with missing or >155-char description is indexable)

### Schema.org Audit

- [ ] **SCHEMA-01**: All blog posts emit valid `Article` or `BlogPosting` structured data with `author`, `datePublished`, `dateModified`, `headline`, and `url` properties
- [ ] **SCHEMA-02**: The homepage emits a valid `Person` schema with `name`, `jobTitle`, `url`, `sameAs` (social profiles), and `knowsAbout` properties
- [ ] **SCHEMA-03**: The homepage or a dedicated page emits a valid `ProfessionalService` or `LocalBusiness`-equivalent schema covering the consulting service offering
- [ ] **SCHEMA-04**: No schema.org validation errors are reported by Google's Rich Results Test or schema.org validator for any page with structured data
- [ ] **SCHEMA-05**: `BreadcrumbList` schema is present on all post and category pages

### Author / E-E-A-T Profile

- [ ] **AUTHOR-01**: A detailed author profile document exists at `content/author-profile.md` covering name, bio, credentials, social links, professional experience, and areas of expertise
- [ ] **AUTHOR-02**: The Payload author/user record for Juan Carlos Angulo has a complete bio, avatar, and all social profile links populated
- [ ] **AUTHOR-03**: Every published blog post is associated with the author record in Payload (no posts with empty author field)
- [ ] **AUTHOR-04**: The author bio page at `/en/author/juan-carlos-angulo` (or equivalent ES route) has a full, indexable description (not thin content)

### Documentation

- [ ] **DOCS-01**: A post-milestone summary document is written at `content/strategy-audit-2026.md` capturing all issues found, changes applied, and their rationale
- [ ] **DOCS-02**: `.planning/seo-audit/` reports are updated or superseded to reflect the final state after all fixes are applied

---

## Future Requirements (v1.1+)

### Content Expansion

- **FUTURE-01**: EN counterpart articles written for all Spanish-only posts (currently 15+ posts have no EN version)
- **FUTURE-02**: "Mejores cursos SEO" article expanded to target "curso seo gratis" cluster with 5+ subtopics

### Performance

- **FUTURE-03**: Core Web Vitals LCP < 2.5s verified on mobile for all key pages via field data
- **FUTURE-04**: CWV monitoring automated via `pnpm tsx src/scripts/seo/update-cwv.ts` on a schedule

### Authority Building

- **FUTURE-05**: Structured data for `FAQPage` added to homepage FAQ section
- **FUTURE-06**: `HowTo` schema added to technical tutorial posts

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Site redesign or UI overhaul | Audit-only milestone; UI changes are a separate concern |
| New post creation | Handled by create-post pipeline; not scoped here |
| Backlink building | Off-page SEO; out of scope for technical audit milestone |
| Paid tooling beyond Ahrefs MCP | Budget constraint |
| Migration to different CMS | No business case; Payload CMS working well |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRAWL-01 | Phase 1 | Pending |
| CRAWL-02 | Phase 1 | Pending |
| CRAWL-03 | Phase 1 | Pending |
| CRAWL-04 | Phase 1 | Pending |
| CRAWL-05 | Phase 1 | Pending |
| CONTENT-01 | Phase 2 | Pending |
| CONTENT-02 | Phase 2 | Pending |
| CONTENT-03 | Phase 2 | Pending |
| SCHEMA-01 | Phase 3 | Pending |
| SCHEMA-02 | Phase 3 | Pending |
| SCHEMA-03 | Phase 3 | Pending |
| SCHEMA-04 | Phase 3 | Pending |
| SCHEMA-05 | Phase 3 | Pending |
| AUTHOR-01 | Phase 4 | Pending |
| AUTHOR-02 | Phase 4 | Pending |
| AUTHOR-03 | Phase 4 | Pending |
| AUTHOR-04 | Phase 4 | Pending |
| DOCS-01 | Phase 5 | Pending |
| DOCS-02 | Phase 5 | Pending |

**Coverage:**
- v1.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 — Milestone v1.0 start*
