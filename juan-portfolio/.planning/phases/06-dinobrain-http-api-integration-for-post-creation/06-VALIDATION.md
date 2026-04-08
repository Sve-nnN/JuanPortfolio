---
phase: 6
slug: dinobrain-http-api-integration-for-post-creation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm test:int -- tests/unit/scripts/` |
| **Full suite command** | `pnpm test:int` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:int -- tests/unit/scripts/`
- **After every plan wave:** Run `pnpm test:int`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | BRAIN-01 | unit | `pnpm test:int -- tests/unit/scripts/DinoRankApiClient.test.ts` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 1 | BRAIN-01 | unit | `pnpm test:int -- tests/unit/scripts/DinoRankApiClient.test.ts` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 1 | BRAIN-02 | unit | `pnpm test:int -- tests/unit/scripts/DinoBrainApiAdapter.test.ts` | ❌ W0 | ⬜ pending |
| 6-02-02 | 02 | 1 | BRAIN-02 | unit | `pnpm test:int -- tests/unit/scripts/DinoBrainApiAdapter.test.ts` | ❌ W0 | ⬜ pending |
| 6-03-01 | 03 | 2 | BRAIN-03 | unit | `pnpm test:int -- tests/unit/scripts/create-post.test.ts` | ✅ | ⬜ pending |
| 6-04-01 | 04 | 2 | BRAIN-04 | unit | `pnpm test:int -- tests/unit/scripts/accountRegistry.test.ts` | ❌ W0 | ⬜ pending |
| 6-05-01 | 05 | 3 | BRAIN-05 | integration | `pnpm test:int` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/scripts/DinoRankApiClient.test.ts` — stubs for BRAIN-01 HTTP client
- [ ] `tests/unit/scripts/DinoBrainApiAdapter.test.ts` — stubs for BRAIN-02 adapter
- [ ] `tests/unit/scripts/accountRegistry.test.ts` — stubs for BRAIN-04 schema extension

*Existing infrastructure (vitest, jsdom, turndown already in package.json) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full pipeline dry-run (no real API call) | BRAIN-05 | Requires DinoRank account credentials | Run `pnpm create-post -- --keyword="test" --dry-run` and verify HTTP calls logged without Playwright launch |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
