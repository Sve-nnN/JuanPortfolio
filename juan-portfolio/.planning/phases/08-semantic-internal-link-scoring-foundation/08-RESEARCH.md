---
phase: 08
slug: semantic-internal-link-scoring-foundation
status: complete
date: 2026-04-03
---

# Phase 08 Research

## Objective

Define a production-ready semantic scoring foundation for internal linking that can be reused by upcoming admin workflows.

## Discovery Level

Level 1/2 hybrid:
- Existing linking engine and tests already exist (no greenfield architecture required).
- Embedding/vector ranking introduces a new technical choice area that needs constrained design.

## Existing Assets (Verified)

- `src/scripts/internal-linking/ContentScanner.ts` already computes relevance with lexical signals (`natural.DiceCoefficient`) and cluster weighting.
- `src/scripts/internal-linking/LinkInjector.ts` already performs safe insertion and exclusion checks (code blocks, links, headings).
- `src/scripts/internal-linking/types.ts` already models `LinkOpportunity` and `PostMetadata`.
- Existing tests cover extractor/scanner/injector flows and exclusion behavior.
- `openai` and `@google/generative-ai` dependencies are already available in `package.json`.

## Gaps To Close In This Phase

1. No explicit contract for semantic embedding/vector score attached to opportunities.
2. No provider-agnostic embedding interface for deterministic ranking pipelines.
3. No tests asserting semantic-weight behavior and tie-breaking determinism.
4. Current scanner mixes lexical and semantic logic without clear pluggable scoring boundaries.

## Recommended Architecture

- Keep module location under `src/scripts/internal-linking/` to preserve current conventions.
- Add a dedicated semantic scoring module with pure functions and explicit contracts.
- Introduce an embedding adapter interface with local fallback mode for deterministic tests.
- Keep `LinkInjector` as insertion authority; do not move replacement logic elsewhere.

### Suggested modules

- `src/scripts/internal-linking/semantic/types.ts`
  - `EmbeddingProvider`, `SemanticScore`, `ScoredOpportunity`, `ScoringWeights`.
- `src/scripts/internal-linking/semantic/scorer.ts`
  - Pure ranking pipeline: lexical score + cluster score + semantic vector score.
- `src/scripts/internal-linking/semantic/embedding-provider.ts`
  - Adapter interface + default provider wiring (environment-gated).
- `src/scripts/internal-linking/ContentScanner.ts`
  - Integrate semantic scorer output while preserving existing filters and locale rules.

## Risk Controls

- Preserve deterministic output by sorting with tie-breakers: total score desc, keyword length desc, slug asc.
- Keep semantic provider optional in runtime; fallback to lexical-only when env keys are absent.
- Avoid network calls in tests by stubbing provider outputs.

## Testing Strategy

- Unit tests for semantic scorer weighting and deterministic order.
- Unit tests for adapter fallback behavior when provider is unavailable.
- Integration tests for scanner + injector compatibility using scored opportunities.
- Regression tests for exclusion rules and locale isolation.

## Requirement Mapping

- `LINK-01`: scorer contracts + weighted semantic ranking + deterministic ordering.
- `LINK-02`: anchor detection/replacement remains safe and verified via integration tests.

## Validation Commands

- `pnpm test:int -- tests/unit/internal-linking.test.ts`
- `pnpm test:int -- tests/int/internal-linking.test.ts`
- `pnpm test:int -- tests/int/internal-linking-exclusions.test.ts`
