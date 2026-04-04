# Phase 08: Semantic internal-link scoring foundation - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Source:** User request + current codebase

<domain>
## Phase Boundary

Implement the semantic scoring foundation for internal linking, including vector/embedding-aware ranking and safe anchor replacement in markdown content.

This phase does not include the full editor-facing admin tab UX; it delivers the reusable engine contracts and behavior that Phase 09 consumes.
</domain>

<decisions>
## Implementation Decisions

### Locked decisions
- Implement the internal linking system based on the approach from `Sve-nnN/seo-content-engine` and adapt it to this repository.
- Include embeddings/vectors + semantic content signals in ranking logic (not keyword-only matching).
- Automatically detect anchor text in post content and replace it safely with internal links.
- Keep locale-safe behavior (`es` and `en` must not cross-link).

### Claude's discretion
- Choose local vector scoring implementation details and provider adapters using current dependencies.
- Define scoring weight blend between existing keyword/cluster rules and semantic similarity.
- Define persistence format for scoring metadata used by later admin workflows.
</decisions>

<canonical_refs>
## Canonical References

### Existing internal-linking engine
- `src/scripts/build-internal-links.ts` - Current orchestration flow and dry-run/apply behavior.
- `src/scripts/internal-linking/types.ts` - Core contracts for post metadata and link opportunities.
- `src/scripts/internal-linking/ContentScanner.ts` - Current keyword/opportunity scanner and relevance scoring.
- `src/scripts/internal-linking/LinkInjector.ts` - Safe markdown insertion and context exclusions.
- `src/scripts/internal-linking/topicCluster.ts` - Structural pillar/satellite rules.

### Payload admin integration points
- `src/collections/Posts/index.ts` - Post collection tabs and admin UI wiring.
- `src/components/admin/GSCDashboard.tsx` - Existing tabbed admin UI pattern.

### Test baselines
- `tests/unit/internal-linking.test.ts`
- `tests/int/internal-linking.test.ts`
- `tests/int/internal-linking-exclusions.test.ts`

### Planning baseline
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
</canonical_refs>

<specifics>
## Specific Ideas

- Keep current deterministic behavior while adding semantic ranking as a weighted factor.
- Add explicit contracts so the upcoming admin tab can consume scored suggestions without duplicating logic.
- Keep dry-run and apply parity.
</specifics>

<deferred>
## Deferred Ideas

- Full UI execution panel in admin (Phase 09).
- Rollout/audit reporting UX (Phase 10).
</deferred>

---

*Phase: 08-semantic-internal-link-scoring-foundation*
*Context gathered: 2026-04-03*
