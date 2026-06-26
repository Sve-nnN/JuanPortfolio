---
phase: 23-coverage-audit
plan: 02
subsystem: seo-admin
tags: [payload-admin, seo, keyword-coverage, audit]
requires:
  - src/plugins/seo/utils/keywordCoverageAudit.ts (plan 23-01 shared core)
provides:
  - GET /api/seo/keyword-coverage (authenticated audit endpoint)
  - Payload admin view at /admin/keyword-coverage
  - afterNavLinks entry "Cobertura de keywords"
affects:
  - src/payload.config.ts
tech-stack:
  added: []
  patterns:
    - server endpoint runs the analyzer; client view fetches JSON (natural stays server-side)
    - admin custom view + afterNavLinks, theme CSS vars, bilingual es/en
key-files:
  created:
    - src/app/api/seo/keyword-coverage/route.ts
    - src/components/admin/KeywordCoverageView.tsx
    - src/components/admin/KeywordCoverageLink.tsx
  modified:
    - src/payload.config.ts
    - src/app/(payload)/admin/importMap.js (generated)
decisions:
  - "View imports TYPES only from the core + CHECK_LABELS from the dependency-light types file; runtime analyzer never enters the client bundle (T-23-SC)"
  - "Endpoint is GET (read of current state, no body); ?locale=es|en, default es"
  - "Section 2 shows failingChecks as red pills and amberChecks as warning pills; N/A checks omitted so listings are never penalized on content checks"
metrics:
  duration: ~20m
  completed: 2026-06-26
---

# Phase 23 Plan 02: Keyword Coverage Admin View Summary

Authenticated `/api/seo/keyword-coverage` GET endpoint that runs the shared coverage core server-side, plus a bilingual Payload admin view (nav-linked) that renders the two coverage lists with counts and an on-demand refresh, keeping `natural` out of the client bundle.

## What Was Built

- **Task 1 — Endpoint** (`src/app/api/seo/keyword-coverage/route.ts`): GET route mirroring the `keyword-score` auth gate (`payload.auth` → 401 if no user). Reads `?locale=es|en` (default `es`), calls `runKeywordCoverageAudit(payload, { locale })`, returns the report JSON; try/catch returns 500 without leaking internals. The server runs the core so `natural` never crosses to the client (key_link + T-23-SC).
- **Task 2 — View + nav link** (`KeywordCoverageView.tsx`, `KeywordCoverageLink.tsx`): `'use client'` view using `useConfig()` serverURL, `useState`/`useEffect`, fetch with `cache: 'no-store'` + `credentials: 'include'`. Header with bilingual title, es/en toggle and a Refresh button (AUDIT-03). Four MetricCards (total / sin keyword / fallando / ok). Section 1 "Páginas sin keyword" (AUDIT-01). Section 2 "Páginas con checks fallando" with red failing-check pills + amber warning pills, page links to the admin edit URL (AUDIT-02). Imports `import type` only from the core; check names from `CHECK_LABELS` (dependency-light types). Nav link with 🎯 icon to `/admin/keyword-coverage`.
- **Task 3 — Registration** (`src/payload.config.ts`): added `KeywordCoverage` view at `/keyword-coverage`, appended `KeywordCoverageLink` to `afterNavLinks`, regenerated the admin import map.

## Commits

| Task | Commit | Description |
| ---- | ------ | ----------- |
| 1 | `89ac904` | feat(23): add authenticated /api/seo/keyword-coverage endpoint |
| 2 | `5329801` | feat(23): add KeywordCoverage admin view + nav link |
| 3 | `1d03f19` | feat(23): register KeywordCoverage view + nav link in payload config |

## Verification Results

- **`payload generate:importmap`**: regenerated; import map now contains 4 `KeywordCoverage` references (view + link, both name + path entries).
- **`pnpm exec tsc --noEmit`**: 114 errors total = pre-existing baseline; **0 errors in touched files** (route, view, link, config). No new errors.
- **`pnpm exec vitest run`**: **90 files / 774 tests passed**, green, no regressions.
- **`pnpm build`**: skipped (≈14min/flaky here, per execution note); relied on tsc + importmap + tests.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Compliance

- **T-23-04 / T-23-05** (info disclosure / privilege): endpoint requires `payload.auth` user, returns 401 otherwise; only `locale` is read from the query.
- **T-23-SC** (analyzer in client bundle): view uses `import type` for `KeywordCoverageReport`/`CoverageRow` and a value import only of `CHECK_LABELS` (no `natural`). Verified no `import { runKeywordCoverageAudit` in the client file.

## Checkpoint — Human Visual Verification Required (Task 4)

This plan has a `checkpoint:human-verify` for the admin UI, which cannot be verified headlessly. Tasks 1-3 are fully implemented and pass tsc/tests/importmap. Juan must visually confirm:

1. Run the dev server and log into the Payload admin.
2. The "Cobertura de keywords" link (🎯) appears in the nav; clicking it (or visiting `/admin/keyword-coverage`) loads the view.
3. The counts summary renders (total / sin keyword / fallando / ok).
4. "Páginas sin keyword" lists pages with no `primaryKeyword`.
5. "Páginas con checks fallando" lists keyworded pages with their failing check names (red pills) and warnings (amber pills).
6. Listings (categorías / autores/Users) are NOT shown as failing on content checks (density / first paragraph / subheadings / H1).
7. The es/en toggle switches all labels and refetches.
8. The Refresh (↻) button reloads data (no stale snapshot — AUDIT-03).
9. Styling fits the admin theme (borders/bg/text via theme CSS vars), consistent with GSCDashboard.
10. Spot-check the lists match `pnpm audit:keywords` output (same shared core).

Resume signal: type "approved" or describe rendering/data issues.

## Self-Check: PASSED

- FOUND: src/app/api/seo/keyword-coverage/route.ts
- FOUND: src/components/admin/KeywordCoverageView.tsx
- FOUND: src/components/admin/KeywordCoverageLink.tsx
- FOUND commit 89ac904, 5329801, 1d03f19
