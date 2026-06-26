# Phase 27: Colapso de domains/ y leftovers huérfanos (CLEAN-02, CLEAN-03) — Summary

**Completed:** 2026-06-26
**Status:** COMPLETE — all hard gates passed.

## One-liner

Collapsed the abandoned DDD scaffolding (`src/domains/**`, `src/domain/**`), moved the only live module (AdBanner) into `src/collections/AdBanners/`, deleted orphan leftovers, and brought tsc back to the 114 baseline by removing the +2 transient errors from Phase 26.

## Commits

| Hash | Type | Description |
| ---- | ---- | ----------- |
| `a77407f` | refactor(27) | Move AdBanner into `src/collections/AdBanners/index.ts` (git mv, replaces orphan re-export, fixed access imports, repointed payload.config.ts:21) |
| `e70a64b` | chore(27) | Delete dead DDD scaffolding: entire `src/domains/**` (27 files) + `src/domain/**` (6 files) + `src/collections/Users/index.ts.backup` |

## What was done

1. **AdBanner move** — `git mv src/domains/content/ad-banners/domain/AdBanner.ts` → `src/collections/AdBanners/index.ts` (overwrote the orphan re-export). Fixed relative access imports `../../../../access/` → `../../access/` (new depth: `src/collections/AdBanners/index.ts` → `src/access/`). Export name `AdBannersCollection` kept unchanged, so `payload.config.ts:130` and `:175` (`AdBannersCollection.slug`) keep working untouched.
2. **Repoint** — `src/payload.config.ts:21` import changed `from './domains/content/ad-banners/domain/AdBanner'` → `from './collections/AdBanners'`.
3. **Deleted** entire `src/domains/**` tree (27 files remaining after the move) and `src/domain/**` tree (6 files: author/ + caseStudy/). Empty leftover directories also removed from disk.
4. **Deleted** `src/collections/Users/index.ts.backup`.

**Files deleted:** 34 total (27 in `src/domains/**` + 6 in `src/domain/**` + 1 backup).

## Verification gates (all passed)

| Gate | Required | Result |
| ---- | -------- | ------ |
| `pnpm exec vitest run` | green (779+) | **779 passed / 90 test files** ✓ |
| `pnpm exec tsc --noEmit` | exactly 114 | **114** ✓ (was 116 before = baseline 114 + 2 transient; the +2 are gone with Category.ts/User.ts deleted) |
| `grep -rn "plugins/seo" src/` | 0 | **0** ✓ |
| `grep -rn "from '@/domains\|/domains/\|@/domain/\|/domain/" src/` | no live refs | **NONE** ✓ |
| `pnpm payload generate:importmap` | regen if needed | ran — "No new imports found", **no importmap changes** ✓ |
| AdBanners collection loads | tsc + slug usages resolve | ✓ (tsc green, :130/:175 resolve) |

## Deviations from plan

None. Plan executed exactly as written. (Minor mechanical note: `git rm` of the orphan emptied and removed the `AdBanners/` dir on disk, so it was recreated before `git mv`; and empty leftover directories under `src/domains/` were `rm`'d after `git rm -r` since git does not track directories.)

## Self-Check: PASSED

- `src/collections/AdBanners/index.ts` exists, contains real `AdBannersCollection` config ✓
- `src/domains` / `src/domain` absent from disk and `git ls-files` (0 tracked) ✓
- Commits `a77407f` and `e70a64b` present in history ✓
