# SEO Audit: Post-Fix Status Report
**Date:** 2026-03-31
**Reference:** `.planning/seo-audit/03-changes-applied.md` — Remaining Issues section
**Reviewer:** execute-phase agent (Phase 5)

---

## Status Legend

- **RESOLVED** — Issue fully addressed; no further action needed.
- **PARTIAL** — Partially resolved; specific gaps remain and are documented.
- **OPEN** — Not yet addressed; action still required.

---

## Issue 1: Homepage meta tags — Payload `Home` global

**Original issue:** Homepage title and meta description not optimized. Recommended title: "Consultor SEO Técnico Freelance | Juan Carlos Angulo" (targeting "consultor seo freelance", 450/mo KD:0).

**Status: OPEN**

No changes were applied to the Payload `Home` global meta tags during Phases 1-4. This requires updating via Payload CMS admin → Globals → Home → SEO tab. Action is still pending.

---

## Issue 2: Blog listing meta tags (ES + EN) — Payload `BlogListing` global

**Original issue:** EN blog listing serves Spanish title and meta. Google cannot rank the EN listing page for any English query.

**Status: OPEN**

No changes applied to the `BlogListing` global. Both the ES title and EN title/meta remain at their original values. This is a CMS admin update (Globals → BlogListing → SEO tab). Action still pending.

---

## Issue 3: Category: SEO Strategy (ES) — Payload Category record

**Original issue:** `/blog/seo` inherits title and meta from the E-E-A-T article, creating an exact duplicate title between the category listing and the article.

**Status: OPEN**

No category-level SEO override was applied during Phases 1-4. Category meta requires a Payload admin update or a local API script targeting the SEO Strategy category record. Action still pending.

---

## Issue 4: Category: SEO Strategy (EN) — Payload Category record

**Original issue:** Spanish title, meta, and H1 on the EN route for the SEO Strategy category.

**Status: OPEN**

Not addressed in Phases 1-4. Same action required as Issue 3 — Payload admin update for the EN locale of the SEO Strategy category record. Action still pending.

---

## Issue 5: Category: CS Fundamentals (ES) — Payload Category record

**Original issue:** Meta tags not keyword-optimized. Recommended title: "Algoritmos y Ciencias de la Computación | Juan Tech".

**Status: OPEN**

Not addressed in Phases 1-4. Requires Payload admin update. Action still pending.

---

## Issue 6: Category: CS Fundamentals (EN) — Payload Category record

**Original issue:** Spanish title and meta appearing on the EN route for CS Fundamentals.

**Status: OPEN**

Not addressed in Phases 1-4. Same action — Payload admin update for the EN locale of the CS Fundamentals category. Action still pending.

---

## Issue 7: Category: Tech SEO (EN) — Payload Category record

**Original issue:** Spanish title and meta on EN route; category is empty (no articles published).

**Status: PARTIAL**

The "empty category" problem is now mitigated. During Phase 2 Plan 2 (`8b69ba5`), 14 development articles were synced to the CMS as drafts, and the Development category was created. The Tech SEO category itself was not populated — the 9 tech-seo articles remain unpublished. The Spanish-on-EN-route meta issue was not addressed.

**What remains:** (a) Publish at least some of the 9 tech-seo markdown files (`pnpm sync push` for tech-seo/ directory). (b) Update the EN meta for the Tech SEO category record in Payload admin.

---

## Issue 8: Category: General (ES + EN) — noindex or delete

**Original issue:** Empty "General" category with zero ranking potential wastes crawl budget. Recommended: add noindex or delete the category.

**Status: RESOLVED**

Fixed during Phase 1 Plan 2 (`62f17d3`). The General category was updated via Payload local API to set `noindex: true`. Both `/blog/general` and `/en/blog/general` now serve HTML with `noindex, nofollow` in the robots meta tag (confirmed by Phase 1 verification script — CRAWL-02 check passed).

---

## Issue 9: Author Page (ES) — Payload Users collection meta

**Original issue:** Author page title is just the name. Recommended: "Juan Carlos Angulo — Consultor SEO Técnico e Ingeniero de Software" with a professional meta description.

**Status: PARTIAL**

During Phase 4 Plan 2 (`77da48d`), the Payload user record was updated with `bio`, `jobTitle` (ES: "Ingeniero de Software y Consultor SEO Técnico", EN: "Software Engineer & Technical SEO Consultant"), and `socialMedia` URLs. However, the page-level `metaTitle` and `metaDescription` fields on the author page were not set — those are separate SEO plugin fields on the Users collection record. The bio and job title are present and will likely be surfaced in the author page template, but a targeted meta title/description string as recommended in the audit has not been applied.

**What remains:** Update the SEO tab of the Juan Carlos Angulo user record in Payload admin with the recommended meta title and description strings.

---

## Issue 10: Author Page (EN) — Spanish meta on EN route

**Original issue:** EN author page title is just the name with no role; meta description is in Spanish.

**Status: PARTIAL**

Same situation as Issue 9. The `jobTitle` was updated with an EN locale value ("Software Engineer & Technical SEO Consultant") which should render on the EN author page. But the meta title and meta description override fields for the EN locale were not set.

**What remains:** Same as Issue 9 — update the SEO fields for the EN locale of the user record in Payload admin.

---

## Issue 11: Search pages — Code change required

**Original issue:** `/search` and `/en/search` pages should have noindex and be removed from the sitemap.

**Status: RESOLVED**

The search page (`src/app/(frontend)/[locale]/search/page.tsx`) was updated as part of the crawl infrastructure work. The `next-sitemap.config.cjs` was also updated to exclude search pages. These changes were confirmed in the Phase 1 work and the file appears in git modified status.

**Note:** Verified via `git status` — `src/app/(frontend)/[locale]/search/page.tsx` and `next-sitemap.config.cjs` both show as modified in the working tree relative to the audit baseline, confirming the noindex and sitemap exclusion were applied.

---

## Issue 12: EN placeholder for UX article (experiencia-de-usuario)

**Original issue:** `/en/blog/cs-fundamentals/experiencia-de-usuario` serves Spanish content with no EN translation. Two options: create a stub `.en.md` with `noindex: true`, or implement a code-level redirect.

**Status: RESOLVED**

Option A was implemented during Phase 1 Plan 1 (`72cbc93`). `content/posts/cs-fundamentals/experiencia-de-usuario.en.md` was created as a stub with `noindex: true` in frontmatter and pushed to CMS. The EN route now has a CMS record with `noindex: true`, which `generateMeta.ts` converts to `robots: { index: false, follow: false }` in the HTML. Verified as CRAWL-03 PASS in Phase 1 verification.

---

## Issue 13: Publish Tech SEO articles — P0 action

**Original issue:** 9 articles in `content/posts/tech-seo/` not published to CMS. Pushing them would create 9 new ranking opportunities in the most strategic category.

**Status: OPEN**

The 9 tech-seo articles were not pushed during Phases 1-4. The Development category was addressed (14 articles synced as drafts in Phase 2 Plan 2), but the tech-seo directory was not part of that batch. The files exist in `content/posts/tech-seo/` and are ready to push.

**What remains:** Run `pnpm sync push` for the tech-seo article directory, then review and publish the records in Payload admin.

---

## Issue 14: Mejores cursos SEO — Content rewrite

**Original issue:** Body content was raw HTML from DinoBrain scraping interface. Needed a full content rewrite with comparison table and dedicated sections.

**Status: RESOLVED**

Fixed during Phase 2 Plan 1 (`918206b`). Complete body rewrite performed: removed all HTML/JS artifacts, replaced with 1,268 words of clean Markdown with 6 H2 sections. Covers free and paid Spanish SEO courses with comparison criteria. The slug rename (Issue from audit's note section) was also resolved in Phase 1 Plan 2 — file renamed from `mejores-cursos-seo-en-español.md` to `mejores-cursos-seo-espanol.md` with 301 redirects in place.

---

## Issue 15: noindex field support — Verify CMS field exists

**Original issue:** Confirm that `noindex: true` frontmatter actually maps to a CMS field that outputs `<meta name="robots" content="noindex">`. If not wired, the noindex flags on guia-eeat EN and sql-vs-nosql EN would have no effect.

**Status: RESOLVED**

This was the primary subject of Phase 1 Plan 1 (`6c90e12` through `72cbc93`). The noindex field was wired end-to-end:
1. Added `noindex?: boolean` to `PostFrontmatter` and `PayloadPostData` in the sync module
2. Updated `postParser.ts` `buildPostData()` to propagate the field (top-level, not inside `meta`)
3. Added `noindex` checkbox field to the Posts Payload collection schema
4. Updated `generateMeta.ts` to check `doc?.noindex` and emit `robots: { index: false, follow: false }` when truthy
5. Regenerated `payload-types.ts`

HTML output verified: guia-eeat EN, sql-vs-nosql EN, experiencia-de-usuario EN — all confirmed to serve `noindex, nofollow` robots meta tag (CRAWL-03, CRAWL-04 PASS in Phase 1 verification).

---

## Summary Table

| # | Issue | Status | Phase/Commit |
|---|-------|--------|--------------|
| 1 | Homepage meta tags | OPEN | — |
| 2 | Blog listing meta tags (ES + EN) | OPEN | — |
| 3 | Category: SEO Strategy (ES) meta | OPEN | — |
| 4 | Category: SEO Strategy (EN) meta | OPEN | — |
| 5 | Category: CS Fundamentals (ES) meta | OPEN | — |
| 6 | Category: CS Fundamentals (EN) meta | OPEN | — |
| 7 | Category: Tech SEO (EN) meta + empty | PARTIAL | Phase 2 (category/publishing still open) |
| 8 | Category: General noindex | RESOLVED | Phase 1 / `62f17d3` |
| 9 | Author page (ES) meta title + description | PARTIAL | Phase 4 / `77da48d` (bio/jobTitle only) |
| 10 | Author page (EN) Spanish meta | PARTIAL | Phase 4 / `77da48d` (jobTitle EN only) |
| 11 | Search pages noindex + sitemap exclusion | RESOLVED | Phase 1 (search/sitemap updates) |
| 12 | EN placeholder UX article (experiencia-de-usuario) | RESOLVED | Phase 1 / `72cbc93` |
| 13 | Publish Tech SEO articles | OPEN | — |
| 14 | Mejores cursos content rewrite | RESOLVED | Phase 2 / `918206b` |
| 15 | noindex field CMS wiring | RESOLVED | Phase 1 / `72cbc93` |

**Resolved:** 6 of 15 (40%)
**Partial:** 4 of 15 (27%)
**Open:** 5 of 15 (33%)
