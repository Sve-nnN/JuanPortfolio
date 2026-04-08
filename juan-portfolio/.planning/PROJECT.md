# juan-tech.com — Portfolio & Technical SEO Blog

## What This Is

Personal portfolio and bilingual (ES/EN) technical blog for Juan Carlos Angulo, Software Engineer and Technical SEO consultant. The site showcases consulting services, publishes in-depth SEO and software engineering guides, and functions as an SEO authority-building asset at juan-tech.com.

## Core Value

Rank for high-intent consulting keywords in Spanish ("consultor SEO técnico freelance") while building E-E-A-T signals through technically rigorous, bilingual content.

## Requirements

### Validated

- ✓ Bilingual Next.js 15 + Payload CMS 3 site deployed (v0 — pre-GSD)
- ✓ Content sync system (markdown ↔ CMS) — pre-GSD
- ✓ Keyword tracking pipeline (DinoRank + keywords.md) — pre-GSD
- ✓ Automated post creation (create-post script with LLM adapters) — pre-GSD

### Active

<!-- Current scope. Building toward these. -->

- [ ] Full site crawl audit with 4xx/3xx error resolution
- [ ] Schema.org markup audit and structured data optimization
- [ ] Author/person profile document and E-E-A-T signals
- [ ] All identified SEO fixes applied and documented
- [ ] Remaining issues from initial audit resolved (development/ category, mejores-cursos rewrite, noindex verification, general category)

### Out of Scope

- Full redesign or layout changes — this milestone is audit + fixes only
- New post creation — handled by create-post pipeline, not this milestone
- Paid SEO tools beyond Ahrefs MCP — budget constraint

## Context

- Site went from 2 published posts to 26+ in the pre-GSD SEO audit (2026-03-27)
- Initial Ahrefs keyword research done, meta tags updated on 6 markdown files
- 9 Tech SEO articles synced to CMS; 15 draft posts published
- Remaining known issues: `development/` category 7 posts unresolved, `mejores-cursos-seo-en-español` needs body rewrite, `noindex` field mapping unverified, `/blog/general` category needs noindex
- Previous seo-audit session produced 4 detailed reports in `.planning/seo-audit/`
- Architecture: Next.js 15 App Router + Payload CMS 3, default locale ES, English under `/en/`

## Constraints

- **Tech stack**: Next.js 15, Payload CMS 3, MongoDB — no stack changes this milestone
- **Content edits**: Via markdown sync (`pnpm sync push`) or Payload local API scripts
- **CMS-only data**: Category metadata, author records, globals require Payload local API or admin
- **Schema.org**: Implemented in `src/utilities/` — changes require code edits + type regeneration

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use markdown + sync as content source of truth | Allows version control, script access, and AI tooling | ✓ Good |
| Default locale ES, English under `/en/` | Spanish-first audience, EN for international reach | ✓ Good |
| Noindex placeholder EN posts (guia-eeat.en, sql-vs-nosql.en) | Thin content harms crawl budget and risks soft 404 | — Pending verification |
| Pivot homepage KW to "consultor SEO freelance" | 450/mo KD:0 vs 10/mo for "consultor seo técnico" | — Pending measurement |

---
*Last updated: 2026-03-30 — Milestone v1.0 started*
