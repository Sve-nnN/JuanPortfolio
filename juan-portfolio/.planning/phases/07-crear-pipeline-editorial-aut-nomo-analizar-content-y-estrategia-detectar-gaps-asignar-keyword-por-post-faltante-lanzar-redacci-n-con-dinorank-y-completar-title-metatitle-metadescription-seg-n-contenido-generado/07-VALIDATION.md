---
phase: 07
slug: crear-pipeline-editorial-aut-nomo-analizar-content-y-estrategia-detectar-gaps-asignar-keyword-por-post-faltante-lanzar-redacci-n-con-dinorank-y-completar-title-metatitle-metadescription-seg-n-contenido-generado
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 07 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.mts` |
| **Quick run command** | `pnpm test:int -- tests/unit/scripts/engine-pipeline.test.ts` |
| **Full suite command** | `pnpm test:int` |
| **Estimated runtime** | ~60 seconds (quick), ~300 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:int -- tests/unit/scripts/engine-pipeline.test.ts`
- **After every plan wave:** Run `pnpm test:int`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | PIPE-01 | unit | `pnpm test:int -- tests/unit/scripts/gap-analyzer.test.ts` | ❌ W0 | pending |
| 07-01-02 | 01 | 1 | PIPE-02 | unit | `pnpm test:int -- tests/unit/scripts/keyword-assigner.test.ts` | ❌ W0 | pending |
| 07-02-01 | 02 | 2 | PIPE-03 | integration | `pnpm test:int -- tests/int/scripts/engine-pipeline.int.test.ts` | ❌ W0 | pending |
| 07-02-02 | 02 | 2 | PIPE-04 | unit | `pnpm test:int -- tests/unit/scripts/metadata-guard.test.ts` | ❌ W0 | pending |
| 07-03-01 | 03 | 3 | PIPE-05 | integration | `pnpm test:int -- tests/int/scripts/engine-pipeline.int.test.ts` | ❌ W0 | pending |
| 07-03-02 | 03 | 3 | PIPE-06 | suite | `pnpm test:int` | ✅ | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/scripts/gap-analyzer.test.ts` - stubs for PIPE-01
- [ ] `tests/unit/scripts/keyword-assigner.test.ts` - stubs for PIPE-02
- [ ] `tests/unit/scripts/metadata-guard.test.ts` - stubs for PIPE-04
- [ ] `tests/int/scripts/engine-pipeline.int.test.ts` - command-level dry-run coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Generated draft quality looks coherent in admin/editor | PIPE-03 | Semantic quality cannot be fully guaranteed by automated checks | Run pipeline with `--limit=1`, open generated post in Payload admin, verify structure and readability |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
