---
phase: 09-admin-review-apply-tab-for-internal-linking
plan: 01
subsystem: api
tags: [internal-links, api-routes, typescript]
dependency_graph:
  requires: []
  provides: [internal-links-api, internal-links-types]
  affects: []
tech_stack:
  added: []
  patterns: [payload-auth-guard, path-traversal-guard, content-scanner-integration]
key_files:
  created:
    - src/types/admin/internal-links.ts
    - src/app/api/internal-links/_helpers.ts
    - src/app/api/internal-links/route.ts
    - src/app/api/internal-links/apply/route.ts
  modified: []
decisions:
  - Helpers extracted to _helpers.ts for testability (mapOpportunityToSuggestion, isPathSafe, escapeRegex)
  - CONTENT_DIR env override added to both routes for integration test isolation
  - lineNumber in apply route is relative to markdown body (not full file with frontmatter)
metrics:
  duration: "~15 minutes"
  completed: "2026-04-04"
---

# Phase 09 Plan 01: API Routes + Shared Types Contract Summary

One-liner: Auth-guarded GET/POST API routes for internal-link suggestions using ContentScanner with path-traversal guard and markdown write-back.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Define shared API types | e67bfa6 |
| 2 | Implement GET /api/internal-links | 6938c04 |
| 3 | Implement POST /api/internal-links/apply | 6938c04 |

## Deviations from Plan

None - plan executed exactly as written, with helpers extracted to `_helpers.ts` as specified.

## Self-Check: PASSED

- src/types/admin/internal-links.ts: EXISTS
- src/app/api/internal-links/_helpers.ts: EXISTS
- src/app/api/internal-links/route.ts: EXISTS
- src/app/api/internal-links/apply/route.ts: EXISTS
- TypeScript: no errors in all new files
