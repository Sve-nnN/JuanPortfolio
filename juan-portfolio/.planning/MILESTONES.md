# Project Milestones: juan-tech.com

[Entries in reverse chronological order - newest first]

---

## v1.1 — Internal Linking Intelligence

**Date:** 2026-04-04
**Status:** Complete
**Phases completed:** 5 (6: DinoBrain HTTP API, 7: Editorial Pipeline, 8: Semantic Scoring, 9: Admin Tab, 10: Reporting & Guardrails)

### What This Milestone Covers

Extended the content automation stack with a full semantic internal linking engine. Posts are scored by vector similarity, safe anchor text replacement avoids code blocks and headings, and the Payload admin exposes a review/apply tab for editors. The milestone closes with audit logging and an explicit locale isolation guardrail test.

### Git Range

**First commit:** `d59e68f` (docs(06): research phase DinoBrain HTTP API integration)
**Last commit:** `9e8cf25` (test(10-01): add 4 locale isolation tests for bulk apply path)

Full commit range: `d59e68f..9e8cf25`

### Key Stats

| Category | Metric |
|---|---|
| Total phases | 5 (phases 6–10) |
| Requirements addressed | BRAIN-01–05, PIPE-01–06, LINK-01–06 |
| New CLI flags added | --country, --language, --site-type, --domain, --words (Phase 6); --locale, --classify, --cluster-only (Phase 8+) |
| Test coverage added | ~50 new int/unit tests across phases 6–10 |
| Audit file auto-written | `content/linking-run-YYYY-MM-DD.md` on every non-dry-run apply |
| Locale isolation tests | 4 (`tests/int/internal-linking-bulk-locale.int.test.ts`) |
| Operational runbook | `content/linking-ops-2026.md` |

### Changes Per Phase

**Phase 6 — DinoBrain HTTP API Integration**
- Replaced Playwright BrainState with pure HTTP DinoBrainApiAdapter
- Extended account registry with DinoBrain-specific fields
- Added --country, --language, --site-type, --domain, --words CLI flags

**Phase 7 — Editorial Pipeline**
- Gap analyzer: detects missing posts by comparing strategy + existing content
- Keyword assigner: deterministic per-gap keyword selection
- Metadata guard: validates title/metaTitle/metaDescription before sync

**Phase 8 — Semantic Scoring Foundation**
- Vector similarity scoring via Xenova/paraphrase-multilingual-MiniLM-L12-v2
- Safe anchor replacement: skips code blocks, headings, existing links
- Candidate model + scoring contracts in types.ts

**Phase 9 — Admin Review/Apply Tab**
- Payload Posts custom tab: suggestion list, inline diff preview, per-link apply
- API route: /api/internal-linking/suggestions and /api/internal-linking/apply
- Wired to semantic engine output (no bespoke duplicate logic)

**Phase 10 — Reporting, Rollout, and Guardrails**
- writeAuditReport() auto-writes content/linking-run-YYYY-MM-DD.md on every apply
- 4 integration tests confirm locale isolation in bulk apply path
- Operational runbook: content/linking-ops-2026.md

---

## v1.0 — Site Audit & SEO Fixes

**Date:** 2026-03-31
**Status:** Complete
**Phases completed:** 5 (1: Crawl & Indexability, 2: Content Fixes, 3: Schema Audit, 4: Author Profile, 5: Documentation)

### What This Milestone Covers

First structured technical SEO audit and fix pass for juan-tech.com. Identified and resolved crawl errors, thin content, schema.org gaps, and missing E-E-A-T signals. Established infrastructure for ongoing content quality control.

### Git Range

**First commit:** `6c90e12` (test(01-01): add failing noindex tests for postParser)
**Last commit:** `867f926` (docs(05-02): create post-fix status report)

Full commit range: `6c90e12..867f926`

### Key Stats

| Category | Metric |
|---|---|
| Total phases | 5 |
| Total commits | ~18 |
| Source code files changed | 8 |
| Content (markdown) files changed | ~37 |
| Posts with noindex applied | 3 EN placeholders |
| Meta description issues fixed | 21 across 20 posts |
| Development posts added (draft) | 14 |
| Schema types added to homepage | 2 (Person, ProfessionalService) |
| BlogPosting schema fields fixed | 2 (`@id`, `mainEntityOfPage`) |
| 301 Redirects created | 2 (ñ slug variants) |
| Author coverage on published posts | 9/9 = 100% |
| Audit issues resolved | 6 of 15 (40%) |
| Audit issues partially resolved | 4 of 15 (27%) |
| Audit issues still open | 5 of 15 (33%) |

### Changes Per Phase

**Phase 1 — Crawl Errors & Indexability** (`6c90e12`–`62f17d3`)
- Wired `noindex` field end-to-end through sync module, Payload schema, and `generateMeta.ts`
- Set noindex on guia-eeat EN, sql-vs-nosql EN, and created experiencia-de-usuario EN stub
- Renamed mejores-cursos slug (ñ removed), created 2 redirect records in MongoDB
- Set General category to noindex
- All 5 CRAWL requirements verified PASS (HTML robots meta confirmed via curl)

**Phase 2 — Content Fixes** (`918206b`–`3c788b5`)
- Rewrote mejores-cursos-seo-espanol.md body: 1,268 clean words replacing HTML/JS artifacts
- Created Development Payload category + synced 14 bilingual development articles as drafts
- Fixed all 21 meta description issues across 20 published posts (MISSING, TOO_SHORT, TOO_LONG)

**Phase 3 — Schema.org Audit** (`1cebd25`–`528746a`)
- Audited schema emission across all page types; documented gaps in 03-AUDIT-NOTES.md
- Added Person + ProfessionalService schemas to homepage via JsonLd.tsx isHome branch
- Fixed BlogPosting: added `@id` and `mainEntityOfPage` to generateSchema.ts
- BreadcrumbList confirmed already wired on post and category pages — no changes needed
- All 5 SCHEMA requirements verified PASS

**Phase 4 — Author Profile & E-E-A-T** (`29a7117`–`e2a808f`)
- Created content/author-profile.md: 897-word bilingual document (bio, expertise, services, education, social)
- Updated Payload user record: bio (720 chars ES), jobTitle (bilingual), socialMedia links
- Bulk-assigned author to all 9 published posts (2 patched, 7 already set)

**Phase 5 — Documentation** (`5625a99`–`867f926`)
- Appended Milestone v1.0 section to content/strategy-audit-2026.md
- Created .planning/seo-audit/05-post-fixes.md (15 remaining issues status report)
- Wrote this MILESTONES.md entry

### Open Items Carried Forward

The following remain from the original audit (see `.planning/seo-audit/05-post-fixes.md` for full details):

**OPEN (5):**
- Issues 1-6: Homepage and category-level meta tags (require Payload admin updates)
- Issue 13: Publish 9 Tech SEO articles from `content/posts/tech-seo/`

**PARTIAL (4):**
- Issue 7: Tech SEO category (EN meta still needs Payload admin update)
- Issues 9-10: Author page SEO meta title/description fields not yet set in Payload

---
