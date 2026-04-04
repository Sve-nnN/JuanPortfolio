# Phase 09: Admin review/apply tab for internal linking - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a dedicated "Internal Links" tab to the Posts admin in Payload CMS that fetches semantic link suggestions for the current post, displays them in a table, and lets editors preview and apply each link individually.

This phase wires the Phase 8 semantic scoring engine into the editor workflow. It does not add audit reporting or bulk rollout guardrails (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Data Layer
- Suggestions computed fresh via a Next.js API route (`/api/internal-links?slug=X`) that runs ContentScanner + SemanticScorer server-side
- Fetch triggered on tab open (lazy) — only runs when the editor opens the "Internal Links" tab
- API is scoped by the post's `slug` field (same key used for URLs)
- Auth via Payload's cookie header (`useAuth()` hook) — consistent with all other admin component fetches

### Tab UI Layout
- Tab name: `Internal Links` — matches existing tab naming style (e.g., "Search Console")
- Suggestion list rendered as a table with columns: Target Post, Keyword, Confidence %, Context snippet
- Per-row actions: "Preview" button (shows inline diff) + "Apply" button (applies the link)
- Loading: spinner while fetching; "No suggestions found" when empty; error message on API failure

### Apply Behavior
- "Apply" POSTs to API route → writes to markdown file → runs `pnpm sync push --post=<file>` — preserves content-as-markdown as source of truth
- "Preview" shows an inline before/after diff in a `<pre>` block below the table row (no modal)
- Success feedback: row turns green with "Applied ✓" badge and apply button disabled; stays on tab
- Only suggestions matching the current post's locale are shown — no cross-locale display

### Claude's Discretion
- Choice of diff rendering approach (simple string split vs. character-level)
- Error retry UX if sync push fails
- Whether to expose a "Refresh" button for re-fetching suggestions after applying

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/admin/GSCDashboard.tsx` — 'use client' tabbed admin component using `useConfig()` + `useAuth()` + fetch pattern; direct model for the new tab component
- `src/components/admin/GSCField.tsx` — `type: 'ui'` field pattern for embedding admin components in a tab
- `src/scripts/internal-linking/ContentScanner.ts` — existing scanner that produces `LinkOpportunity[]` including `semantic.score`
- `src/scripts/internal-linking/types.ts` — `LinkOpportunity`, `PostMetadata`, `SemanticScore` contracts
- `src/scripts/internal-linking/semantic/scorer.ts` — semantic scoring layer from Phase 8

### Established Patterns
- Admin components: placed in `src/components/admin/`, export named component, registered via `admin.components.Field` string reference in collection config
- Tab fields: `type: 'ui'` with `admin.components.Field` pointing to the component
- Client components: `'use client'` directive, `useConfig()` for serverURL, `useAuth()` for token
- API routes: placed in `src/app/(payload)/api/` or standard Next.js `src/app/api/`

### Integration Points
- New tab added to `src/collections/Posts/index.ts` tabs array (after "Search Console")
- New API route: `src/app/api/internal-links/route.ts` — reads slug param, runs scanner, returns `LinkOpportunity[]`
- New admin component: `src/components/admin/InternalLinksTab.tsx`

</code_context>

<specifics>
## Specific Ideas

- Keep the component pattern close to GSCDashboard.tsx — same fetch lifecycle, loading/error states, and auth approach
- The diff preview should show the affected sentence/line, with the proposed anchor wrapped
- Apply flow: POST to `/api/internal-links/apply` with `{ slug, filePath, keyword, targetUrl }` body

</specifics>

<deferred>
## Deferred Ideas

- Bulk selection and multi-apply (more complex UX, belongs in a polish phase if needed)
- Audit log of applied links (Phase 10)
- Confidence threshold filter slider (can be added as a follow-up if the basic table works well)

</deferred>
