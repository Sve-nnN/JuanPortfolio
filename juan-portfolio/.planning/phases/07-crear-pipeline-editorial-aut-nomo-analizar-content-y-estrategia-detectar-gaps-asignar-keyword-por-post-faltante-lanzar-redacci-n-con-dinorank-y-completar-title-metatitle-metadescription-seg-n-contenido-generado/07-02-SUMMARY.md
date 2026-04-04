---
phase: 07-crear-pipeline-editorial-aut-nomo-analizar-content-y-estrategia-detectar-gaps-asignar-keyword-por-post-faltante-lanzar-redacci-n-con-dinorank-y-completar-title-metatitle-metadescription-seg-n-contenido-generado
plan: 02
subsystem: scripts/engine-orchestration
tags: [pipeline, cli, artifacts]
key_files:
  created:
    - src/scripts/engine/pipeline.ts
    - tests/int/scripts/engine-pipeline.int.test.ts
  modified:
    - src/scripts/engine.ts
metrics:
  completed: "2026-04-02"
  tasks: 2
  files: 3
---

# Phase 7 Plan 2 Summary

Implemented executable orchestration and CLI command wiring for the autonomous editorial pipeline.

## Delivered

- Added pipeline orchestrator `src/scripts/engine/pipeline.ts`:
  - reads strategy/keyword markdown tables
  - scans existing posts (`content/posts/**/*.md`) with locale awareness
  - composes analyzer + assigner
  - supports `dryRun`, `limit`, `locale`, `provider`, `strictMetadata`
  - writes machine artifacts:
    - `content/pipeline-gaps.json`
    - `content/pipeline-assignments.json`
- Extended CLI entrypoint `src/scripts/engine.ts`:
  - added `pipeline` command with options:
    - `--dry-run`
    - `--limit`
    - `--locale`
    - `--provider`
    - `--strict-metadata`
- Added integration tests `tests/int/scripts/engine-pipeline.int.test.ts`:
  - dry-run flow
  - option parsing/wiring through CLI

## Validation

- `pnpm exec vitest run --config ./vitest.config.mts tests/int/scripts/engine-pipeline.int.test.ts`
- Result: `1 test file passed, 4 tests passed`
- Command smoke on workspace data:
  - `pnpm tsx src/scripts/engine.ts pipeline --dry-run --limit 1 --locale en --provider openai`
  - Result: `Pipeline completed. Assignments: 1`

## Result

The pipeline is now invokable through one CLI command with deterministic, auditable outputs.
