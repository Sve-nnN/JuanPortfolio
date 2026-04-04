# Roadmap: juan-tech.com — v1.0 Site Audit & SEO Fixes + v1.1 Internal Linking Intelligence

## Overview

The roadmap started with the v1.0 SEO audit and fix cycle, then continued into the editorial automation pipeline. The next milestone adds semantic internal linking intelligence on top of the existing content, schema, and author foundations.

## Phases

- [x] **Phase 1: Crawl Errors & Indexability** — Resolve all 4xx/3xx errors, noindex gaps, and special-character slug (completed 2026-03-31)
- [x] **Phase 2: Content Fixes** — Rewrite mejores-cursos body, resolve development/ category, verify all metas (completed 2026-03-31)
- [x] **Phase 3: Schema.org Audit & Optimization** — Audit all structured data, fix gaps, validate (completed 2026-03-31)
- [x] **Phase 4: Author Profile & E-E-A-T** — Create author profile doc, populate Payload author, link all posts (completed 2026-03-31)
- [x] **Phase 5: Documentation & Strategy Summary** — Write post-milestone summary, update audit reports (completed 2026-03-31)
- [x] **Phase 6: DinoBrain HTTP API Integration for Post Creation** — Replace Playwright BrainState with pure HTTP DinoBrainApiAdapter; extend account registry; keep tests green (completed 2026-04-02)
- [x] **Phase 7: Pipeline Editorial Autónomo** — Gap analyzer, keyword assigner, DinoRank orchestrator, metadata guard (completed 2026-04-03)
- [x] **Phase 8: Semantic Internal-Link Scoring Foundation** — Convert keyword linker to semantic ranking engine with embeddings/vector similarity (completed 2026-04-04)
- [x] **Phase 9: Admin review/apply tab for internal linking** — Payload Posts admin tab with suggestion list, inline diff preview, and per-link apply (completed 2026-04-04)

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

**Plans:** 3/3 plans complete
- [x] 01-01-PLAN.md — Wire noindex end-to-end: sync types + postParser + generateMeta + CMS updates for EN placeholders
- [x] 01-02-PLAN.md — Rename mejores-cursos slug (remove ñ), create 301 redirect, set noindex on General category
- [x] 01-03-PLAN.md — Verify all Phase 1 success criteria in rendered HTML; write verification report

---

### Phase 2: Content Fixes
**Goal:** All published posts have clean body content and valid meta tags; unresolved content decisions made.
**Depends on:** Phase 1
**Requirements:** CONTENT-01, CONTENT-02, CONTENT-03
**Success Criteria** (what must be TRUE):
1. `mejores-cursos-seo-espanol.md` body contains no HTML tags, JavaScript, or DinoBrain artifacts
2. `development/` articles either appear under a published "Development" category or are removed from the repo
3. A query of all published posts confirms no post has a missing or over-limit meta description

**Plans:** 3/3 plans complete
- [x] 02-01-PLAN.md — Rewrite mejores-cursos body: strip HTML/JS artifacts, write clean ~1000-word Markdown, fix semantic_keywords, sync
- [x] 02-02-PLAN.md — Create Development category in Payload + add categories/status:draft to all 14 development/ files + sync
- [x] 02-03-PLAN.md — Audit all published post meta descriptions via Payload MCP; fix missing/short/long; write report

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

**Plans:** 4/4 plans complete
- [x] 03-01-PLAN.md — Audit current schema emission points; document gaps for BlogPosting, homepage, BreadcrumbList
- [x] 03-02-PLAN.md — Add Person + ProfessionalService schemas to homepage via JsonLd component
- [x] 03-03-PLAN.md — Add mainEntityOfPage + @id to BlogPosting in generateSchema.ts
- [x] 03-04-PLAN.md — Validate all schema changes via curl; write VERIFICATION.md; human checkpoint

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

**Plans:** 3/3 plans complete
- [x] 04-01-PLAN.md — Write bilingual author-profile.md (ES + EN bio, expertise, services, education, social links)
- [x] 04-02-PLAN.md — Update Payload user record via MCP: bio, jobTitle (ES + EN), socialMedia (LinkedIn + GitHub)
- [x] 04-03-PLAN.md — Audit published posts for missing author; bulk-assign via MCP; write VERIFICATION.md; human checkpoint

---

### Phase 5: Documentation & Strategy Summary
**Goal:** All audit findings and applied fixes documented; strategy-audit-2026.md completed.
**Depends on:** Phase 4
**Requirements:** DOCS-01, DOCS-02
**Success Criteria** (what must be TRUE):
1. `content/strategy-audit-2026.md` contains a complete log of all issues found, changes applied, and impact estimates
2. `.planning/seo-audit/` reports reflect the final post-fix state (or a new `05-post-fixes.md` report is added)
3. MILESTONES.md entry for v1.0 is written with stats and git range

**Plans:** 3/3 plans complete
- [x] 05-01: Write `content/strategy-audit-2026.md` — full audit narrative and change log
- [x] 05-02: Update `.planning/seo-audit/04-full-audit-log.md` with remaining issues resolved status
- [x] 05-03: Write MILESTONES.md v1.0 entry; commit all planning artifacts

---

### Phase 6: DinoBrain HTTP API Integration for Post Creation

**Goal:** Replace the Playwright-based BrainState machine in `create-post.ts` with the pure HTTP `DinoBrainApiAdapter` from seo-content-engine, adding country/language/tone/site-type parameters; extend the accounts registry schema with DinoBrain-specific fields; keep all existing tests green.
**Depends on:** Phase 5
**Requirements:** BRAIN-01, BRAIN-02, BRAIN-03, BRAIN-04, BRAIN-05
**Success Criteria** (what must be TRUE):
1. `pnpm create-post` generates a complete post body via HTTP (no Playwright for content generation)
2. DinoBrain parameters (country, language, site type, domain, word count) are accepted as CLI flags and forwarded to the API
3. Account registry `content/dinorank-accounts-registry.json` carries the new fields: `createdLanguage`, `createdCountry`, `createdDomain`, `createdProjectType`, `assignedClientId`, `cooldownUntil`
4. Existing `pnpm test:int` suite passes with no regressions
5. CLAUDE.md / README updated to document new CLI flags

**Plans:** 5/5 plans complete
- [x] 06-01-PLAN.md — Port DinoRankApiClient HTTP layer (login, get, post, logout, extractContentCredits, login-language)
- [x] 06-02-PLAN.md — Port DinoBrainApiAdapter (generate(), account selection, cooldown, provision flow)
- [x] 06-03-PLAN.md — Migrate create-post.ts: remove BrainState Playwright block, wire DinoBrainApiAdapter, add CLI flags
- [x] 06-04-PLAN.md — Extend account registry schema + migrate existing entries + update tests
- [x] 06-05-PLAN.md — Verification: run full pipeline dry-run, update CLAUDE.md, write VERIFICATION.md

---

### Phase 7: Crear pipeline editorial autónomo: analizar content/ y estrategia, detectar gaps, asignar keyword por post faltante, lanzar redacción con DinoRank, y completar title/metaTitle/metaDescription según contenido generado

**Goal:** Ejecutar un pipeline editorial autonomo y auditable que detecte gaps de contenido, asigne keywords por post faltante, genere borradores con DinoRank y garantice title/metaTitle/metaDescription validos antes de sync.
**Depends on:** Phase 6
**Requirements:** PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06
**Success Criteria** (what must be TRUE):
1. El pipeline detecta de forma determinista los posts faltantes comparando estrategia + contenido existente.
2. Cada gap recibe una keyword unica y trazable en artefactos de salida.
3. Existe comando CLI para ejecutar modo autonomo con --dry-run y --limit.
4. Los drafts generados siempre contienen title, metaTitle y metaDescription no vacios.
5. La metadata queda validada (y reportada) con reglas de longitud antes del sync.
6. Hay cobertura de tests unit/integration y reporte de verificacion de fase.

**Plans:** 3/3 plans complete
- [x] 07-01-PLAN.md - Contratos + gap analyzer + keyword assigner determinista
- [x] 07-02-PLAN.md - Orquestador autonomo + comando CLI de pipeline
- [x] 07-03-PLAN.md - Metadata guard + validacion integral + cierre de evidencia

---

### Phase 8: Semantic internal-link scoring foundation
**Goal:** Convert the current keyword-based linker into a semantic ranking engine that can score candidate links using embeddings/vector similarity, then choose the safest anchor text in the body.
**Depends on:** Phase 7
**Requirements:** LINK-01, LINK-02
**Success Criteria** (what must be TRUE):
1. A deterministic scorer can rank candidates with semantic similarity plus existing keyword and cluster signals.
2. Safe anchor replacement only edits valid mentions and avoids code blocks, headings, and existing links.
3. The scoring layer is covered by unit/integration tests and can be reused by the admin workflow.

**Plans:** 3/3 plans complete
- [x] 08-01-PLAN.md - Define scoring contracts, candidate model, and vector-similarity interfaces
- [x] 08-02-PLAN.md - Implement semantic ranking and safe anchor replacement in the linking engine
- [x] 08-03-PLAN.md - Add unit/integration coverage for scoring, anchor replacement, and locale safety

---

### Phase 9: Admin review/apply tab for internal linking
**Goal:** Expose a dedicated Posts admin tab where editors can review suggestions, filter them, preview the result, and apply the chosen links.
**Depends on:** Phase 8
**Requirements:** LINK-03, LINK-04
**Success Criteria** (what must be TRUE):
1. The Posts admin shows a stable internal-linking tab with actionable suggestions.
2. Editors can run dry-run previews and then apply links from the same screen.
3. The UI uses the semantic engine output instead of duplicate bespoke logic.

**Plans:** 3/3 plans complete
- [x] 09-01-PLAN.md - Define admin tab data contract and fetch layer for link suggestions
- [x] 09-02-PLAN.md - Implement the Posts admin tab with suggestion list, filters, preview, and apply actions
- [x] 09-03-PLAN.md - Wire tab actions to the linking service and add admin-focused tests

---

### Phase 10: Reporting, rollout, and guardrails
**Goal:** Make bulk application auditable and safe for rollout by recording what changed, what was skipped, and how locale isolation behaved.
**Depends on:** Phase 9
**Requirements:** LINK-05, LINK-06
**Success Criteria** (what must be TRUE):
1. Bulk application produces a clear summary of changed posts, skipped matches, and link counts.
2. Locale isolation is enforced in the final application path and in verification coverage.
3. The milestone ships with a repeatable verification flow and operational notes.

**Plans:** 2 plans
- [ ] 10-01-PLAN.md - Add audit reporting, dry-run summaries, and locale guardrails to the application flow
- [ ] 10-02-PLAN.md - Run end-to-end verification, document the rollout, and finalize milestone notes

## Stats

- **Total phases:** 10
- **Total plans:** 30
- **Requirements mapped:** 25 / 25 (100% coverage)
- **Starting phase:** 1 (first milestone)
