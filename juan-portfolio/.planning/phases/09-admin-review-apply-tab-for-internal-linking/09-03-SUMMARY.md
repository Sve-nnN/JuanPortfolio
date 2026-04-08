---
phase: 09-admin-review-apply-tab-for-internal-linking
plan: 03
subsystem: tests
tags: [internal-links, tests, vitest, integration]
dependency_graph:
  requires: [internal-links-api, internal-links-types]
  provides: [internal-links-test-coverage]
  affects: []
tech_stack:
  added: []
  patterns: [vi-hoisted-esm-mock, importOriginal-pattern, tmp-fixture-dirs]
key_files:
  created:
    - tests/unit/admin/internal-links-api.test.ts
    - tests/int/admin/internal-links-routes.int.test.ts
  modified:
    - src/app/api/internal-links/apply/route.ts
decisions:
  - Used vi.hoisted() to hoist spawnSync mock before module imports (ESM requirement)
  - Used importOriginal in vi.mock('child_process') to preserve non-mocked exports
  - Changed apply/route.ts to 'import * as childProcess' for mockability (named export binding issue in ESM)
  - Pre-existing test failures (syncKeywords, createPost, engine-pipeline, DinoRankApiClient) confirmed unrelated to Phase 09
metrics:
  duration: "~20 minutes"
  completed: "2026-04-04"
---

# Phase 09 Plan 03: Unit + Integration Tests Summary

One-liner: 24 tests covering mapOpportunityToSuggestion, isPathSafe, escapeRegex, locale isolation, path traversal guard, and markdown link write-back using vi.hoisted ESM mocking.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Unit tests for helpers (14 tests) | 9dff6fd |
| 2 | Integration tests for API routes (10 tests) | 10c1bef |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESM named import prevents spawnSync mocking**
- **Found during:** Task 2
- **Issue:** `import { spawnSync } from 'child_process'` captures a binding that cannot be replaced in Vitest ESM mode
- **Fix:** Changed to `import * as childProcess from 'child_process'` + `childProcess.spawnSync()` + `vi.hoisted()` + `vi.mock('child_process', async (importOriginal) => ...)`
- **Files modified:** `src/app/api/internal-links/apply/route.ts`, `tests/int/admin/internal-links-routes.int.test.ts`
- **Commit:** 10c1bef

## Full Test Suite Status

- New tests: 24 pass (14 unit + 10 integration)
- Pre-existing failures: 70 tests across unrelated files (syncKeywords, createPost, engine-pipeline, DinoRankApiClient) — confirmed pre-existing from other phases
- No regressions introduced

## Self-Check: PASSED

- tests/unit/admin/internal-links-api.test.ts: EXISTS, 14 tests pass
- tests/int/admin/internal-links-routes.int.test.ts: EXISTS, 10 tests pass
- src/app/api/internal-links/_helpers.ts: EXISTS, imported by both routes
