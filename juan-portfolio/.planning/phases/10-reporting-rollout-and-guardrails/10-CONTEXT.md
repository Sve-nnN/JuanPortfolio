# Phase 10: Reporting, rollout, and guardrails - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an audit-file output to the internal linking CLI, verify locale isolation in the bulk apply path with explicit test coverage, write an operational runbook, and close out the v1.1 milestone.

This phase does not add new linking logic — it makes the existing system auditable, safe for rollout, and documented.

</domain>

<decisions>
## Implementation Decisions

### Audit Report Format
- Audit output format: Markdown file written to `content/linking-run-YYYY-MM-DD.md` — human-readable and version-controlled
- Written automatically on every non-dry-run apply (no opt-in flag needed — always audit when modifying)
- Report includes: changed posts (slug + links added count), skipped matches (slug + reason), locale summary (ES vs EN link counts), errors
- Locale guardrail is already enforced in ContentScanner.isDifferentLocale() — this phase adds explicit integration test for cross-locale rejection in the bulk apply path (the code path used by `build-internal-links.ts`)

### Operational Notes & Milestone Close-Out
- Operational notes written to `content/linking-ops-2026.md` — runbook covering how to run the linker, how to interpret audit reports, when to re-run
- VERIFICATION.md (10-VERIFICATION.md) includes explicit re-run commands that verify: locale isolation, audit file creation, link counts
- Write `.planning/milestones/v1.1-ROADMAP.md` entry when phase completes — matches v1.0 pattern from Phase 5

### Claude's Discretion
- Date format for audit filename (ISO: YYYY-MM-DD)
- Whether to add a `--no-audit` flag as an escape hatch for the auto-written audit file
- Structure of the operational runbook (can mirror CLAUDE.md's command format)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/scripts/build-internal-links.ts` — current CLI with dry-run, locale filter, console output; needs audit file write added after apply
- `src/scripts/internal-linking/types.ts` — `LinkingResult` type has `linksAdded`, `modifiedPosts`, `skipped`, `errors` — already structured for an audit file
- `content/strategy-audit-2026.md` — reference pattern for audit/summary markdown files

### Established Patterns
- Audit markdown files: exist in `content/` (strategy-audit-2026.md)
- Milestone docs: `.planning/milestones/v1.0-ROADMAP.md` — same pattern for v1.1
- Test locale isolation: `tests/int/internal-linking-exclusions.test.ts` — existing locale isolation tests; extend for bulk apply path

### Integration Points
- `build-internal-links.ts` near the end of `main()` — write audit file after `injector.applyLinks()` returns
- New test file: `tests/int/internal-linking-bulk-locale.int.test.ts` for cross-locale bulk apply guardrail
- `content/linking-ops-2026.md` — new runbook file

</code_context>

<specifics>
## Specific Ideas

- The audit file filename includes date: `content/linking-run-2026-04-04.md`
- Re-use `LinkingResult` fields directly for audit content — no new data structures
- VERIFICATION.md should be a runbook for CI/human verification: list commands + expected outputs

</specifics>

<deferred>
## Deferred Ideas

- Automated scheduled re-run (cron/CI trigger)
- Dashboard view of linking audit history
- Slack/email notification on bulk apply completion

</deferred>
