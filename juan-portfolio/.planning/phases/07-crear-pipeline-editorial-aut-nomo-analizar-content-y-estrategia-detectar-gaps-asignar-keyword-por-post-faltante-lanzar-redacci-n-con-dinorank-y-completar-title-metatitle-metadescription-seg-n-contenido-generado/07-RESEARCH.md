---
phase: 07
slug: crear-pipeline-editorial-aut-nomo-analizar-content-y-estrategia-detectar-gaps-asignar-keyword-por-post-faltante-lanzar-redacci-n-con-dinorank-y-completar-title-metatitle-metadescription-seg-n-contenido-generado
status: complete
date: 2026-04-02
---

# Phase 07 Research

## Objective

Build an autonomous editorial pipeline that:
- audits local content and strategy docs,
- detects missing post opportunities (gaps),
- assigns one keyword per missing post,
- triggers DinoRank drafting,
- completes title/metaTitle/metaDescription from generated content.

## Existing Assets (Verified)

- `src/scripts/create-post.ts`
  - already supports DinoBrain HTTP generation and CLI flags (`--keyword`, `--country`, `--language`, `--site-type`, `--domain`, `--words`).
- `src/scripts/engine.ts`
  - already provides `research`, `automate`, `sync` commands.
- `src/scripts/services/ContentFlywheelService.ts`
  - already orchestrates research -> generation -> frontmatter -> sync -> internal links.
- `content/keywords.md`, `content/keywords_backlog.md`
  - keyword sources are already markdown-table based.
- `src/scripts/utils/markdownTable.ts`
  - robust parser/updater for keyword rows.

## Gaps To Close In This Phase

1. No deterministic gap detector that compares strategy backlog vs existing `content/posts/**` coverage.
2. No explicit assignment artifact that maps each missing post to one selected keyword.
3. No dedicated command that executes autonomous mode over missing-post set (currently mostly one-keyword flow).
4. Metadata completion is present via LLM frontmatter generation, but there is no explicit enforcement/report ensuring `title`, `metaTitle`, `metaDescription` are non-empty and length-safe after generation.

## Recommended Architecture

- Keep current stack and conventions (no new libraries required).
- Add a small domain module under `src/scripts/engine/` for pipeline-specific logic.
- Keep orchestration entrypoint in `src/scripts/engine.ts`.
- Persist machine-readable run artifacts under `content/`:
  - `content/pipeline-gaps.json`
  - `content/pipeline-assignments.json`
  - `content/pipeline-runs/<timestamp>.json`

### Module split

- `src/scripts/engine/gap-analyzer.ts`
  - scan `content/posts/**/*.md`
  - read strategy sources (`content/content-plan.md`, `content/keywords_backlog.md`, optionally `content/keywords.md`)
  - output normalized missing-post candidates.

- `src/scripts/engine/keyword-assigner.ts`
  - assign best keyword per missing post using deterministic scoring.
  - prevent duplicate assignment in same run.

- `src/scripts/engine/metadata-guard.ts`
  - validate generated frontmatter fields.
  - repair or regenerate metadata if missing/invalid.

- `src/scripts/engine.ts` (extend)
  - add subcommand (for example `pipeline`) with `--dry-run` and `--limit`.

## Data Contracts (Suggested)

```ts
export interface GapCandidate {
  slug: string
  category: string
  locale: 'es' | 'en'
  source: 'content-plan' | 'keywords-backlog' | 'keywords'
  rationale: string
}

export interface KeywordAssignment {
  slug: string
  category: string
  locale: 'es' | 'en'
  keyword: string
  keywordSource: 'keywords-backlog' | 'keywords'
  score: number
}

export interface MetadataStatus {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  metaDescriptionLength: number
  valid: boolean
}
```

## Proposed Requirement IDs For Phase 07

- `PIPE-01`: gap analysis produces deterministic candidate list from content and strategy inputs.
- `PIPE-02`: keyword assignment maps one keyword per missing post candidate.
- `PIPE-03`: autonomous execution command can run drafting for missing posts (dry-run and real modes).
- `PIPE-04`: generated posts end with non-empty `title`, `metaTitle`, `metaDescription`.
- `PIPE-05`: metadata guard enforces length bounds and reports invalid items.
- `PIPE-06`: integration/unit tests verify analyzer, assigner, and metadata guard behavior.

## Risks And Pitfalls

- Existing workspace has many unrelated unstaged changes; phase work must isolate file ownership.
- Some old scripts/services duplicate behavior (`services/*` vs legacy scripts).
- Slug/category derivation from markdown tables can break if malformed rows are not normalized.
- Autonomy must avoid creating posts for already-existing bilingual pairs.

## Test Strategy

- Unit tests for pure logic modules:
  - gap detection
  - assignment scoring and dedupe
  - metadata guard
- Integration test for command-level dry-run output.
- Keep runtime under 60s for quick checks.

## Validation Architecture

- Existing framework: Vitest (`pnpm test:int`).
- Quick sampling command: `pnpm test:int -- tests/unit/scripts/engine-pipeline.test.ts`.
- Full sampling command: `pnpm test:int`.
- Add focused test files before wiring command behavior.

## Discovery Level

Level 0 (skip external discovery):
- All required capabilities already exist in repo (DinoRank HTTP adapter, markdown keyword parsers, engine CLI, sync workflows).
- No new third-party dependency is required.
