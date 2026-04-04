status: passed

# Phase 09 Verification

## Summary

Phase 09 implemented the "Internal Links" admin tab for the Payload CMS Posts collection. All three plans were executed successfully.

## Plans Executed

| Plan | Name | Status | Key Commits |
|------|------|--------|-------------|
| 09-01 | API Routes + Shared Types | DONE | e67bfa6, 6938c04 |
| 09-02 | Admin UI Component + Posts Tab | DONE | 31aa270 |
| 09-03 | Unit + Integration Tests | DONE | 9dff6fd, 10c1bef |

## Artifacts Created

### New Files
- `src/types/admin/internal-links.ts` — LinkSuggestion, SuggestionsResponse, ApplyLinkBody, ApplyLinkResponse types
- `src/app/api/internal-links/_helpers.ts` — mapOpportunityToSuggestion, isPathSafe, escapeRegex
- `src/app/api/internal-links/route.ts` — GET handler with auth guard, locale scoping, ContentScanner integration
- `src/app/api/internal-links/apply/route.ts` — POST handler with auth guard, path traversal guard, markdown write-back + sync
- `src/components/admin/InternalLinksTab.tsx` — Client component with fetch lifecycle, Preview/Apply per-row, inline diff, Applied badge
- `tests/unit/admin/internal-links-api.test.ts` — 14 unit tests for helpers
- `tests/int/admin/internal-links-routes.int.test.ts` — 10 integration tests for API routes

### Modified Files
- `src/collections/Posts/index.ts` — Added "Internal Links" tab after "Search Console"

## Test Results

- Unit tests: 14/14 pass
- Integration tests: 10/10 pass
- Total new tests: 24
- Pre-existing failures in other test files are unrelated to Phase 09

## TypeScript

All new files compile without errors under strict mode.

## Requirements Coverage

- LINK-03: GET /api/internal-links returns locale-scoped suggestions — IMPLEMENTED
- LINK-04: POST /api/internal-links/apply writes link to markdown and triggers sync — IMPLEMENTED

## Pending (Human Verification)

The following requires manual visual verification in the browser:
1. Run `pnpm dev` and open http://localhost:3000/admin
2. Navigate to any post → confirm "Internal Links" tab appears after "Search Console"
3. Click the tab → verify spinner, then table of suggestions (or empty state)
4. Click "Preview" → inline diff expands/collapses
5. Click "Apply" → button shows loading → turns to "Applied" on success
6. Click "Refresh" → suggestions reload
