# Codebase Concerns

**Analysis Date:** 2026-06-22

This document captures technical debt, fragile areas, build/deploy caveats, security considerations, and surprises a new contributor will hit. Findings are grouped by severity.

---

## High Severity

### Package manager mismatch: pnpm in CI/Vercel vs npm in scripts

- **Issue:** `package.json` scripts invoke `npm` directly (`"build": "npm run redirects && ... next build"`, `"vercel-build": "npm run build"`, `"reinstall": "rm -rf node_modules && rm pnpm-lock.yaml && npm install"`). The committed lockfile is `pnpm-lock.yaml` (545k) and CI (`.github/workflows/build-validation.yml`) uses `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test:int`.
- **Files:** `package.json`, `pnpm-lock.yaml`, `.github/workflows/build-validation.yml`
- **Impact:** Mixed package managers cause divergent dependency trees. Per project memory, Vercel resolving with npm produced a duplicate `google-auth-library` and a `JWT` type break that required a build fix (`4ade143 fix(build): type JWT from googleapis to fix Vercel build (npm dup of google-auth-library)`). Running `npm install` locally while CI uses pnpm can desync the lockfile and reproduce the duplicate-package class of bug.
- **Fix approach:** Pick one package manager. If pnpm is canonical, replace the `npm run ...` calls inside `package.json` scripts with `pnpm` (or package-manager-agnostic runners) and pin `packageManager` in `package.json`. Verify the Vercel project install command matches.

### Scripts are type-checked during `next build`

- **Issue:** `tsconfig.json` includes `**/*.ts` / `**/*.tsx` repo-wide and only excludes `node_modules` and `docs`. The entire `src/scripts/` tree (content tooling, DinoRank scraping, keyword sync, SEO scripts — 342 `process.exit`/`console.log` occurrences across `src/scripts/*.ts`) is part of the type-check surface that gates `next build`.
- **Files:** `tsconfig.json` (`include`/`exclude`), `src/scripts/**`
- **Impact:** A type error in a non-web content/SEO script breaks the production build and Vercel deploy, even though those scripts never ship to the site. This is the root cause behind the JWT build fix above.
- **Fix approach:** Either move scripts to a separate `tsconfig.scripts.json` excluded from the build, or add `src/scripts` to the build tsconfig `exclude` and type-check it in a dedicated CI step.

### Duplicate nested project tree `juan-portfolio/` committed to git

- **Issue:** A second, near-complete project skeleton lives under `juan-portfolio/` (126 tracked files): its own `.planning/` (MILESTONES, PROJECT, REQUIREMENTS, ROADMAP, STATE), `CLAUDE.md`, `GEMINI.md`, `Dockerfile`, `docker-compose.yml`, `README.md`, `.env.example`, `redirects.json`, `serpapi-response-example.json`, `test-bulk.js`, plus a `claude-seo` git submodule.
- **Files:** `juan-portfolio/` (entire subtree)
- **Impact:** Highly confusing for new contributors — it is unclear which `.planning/`, `CLAUDE.md`, `Dockerfile`, and config are authoritative (root vs nested). Stale duplicate docs drift from reality and can mislead automated agents.
- **Fix approach:** Confirm whether `juan-portfolio/` is dead/legacy. If so, remove it; if it is an intentional submodule or template snapshot, document its purpose in the root `README.md`.

### Tracked secret-adjacent and noise files

- **Issue:** `.DS_Store` is tracked (`git ls-files` confirms) and shows as modified in the working tree. `juan-portfolio/test.env` is tracked (currently an empty blob `e69de29`). `.env` exists locally (correctly untracked) and `.serpapi-cache.json` is untracked but present.
- **Files:** `.DS_Store`, `juan-portfolio/test.env`, `.serpapi-cache.json` (untracked)
- **Impact:** `.DS_Store` is OS noise that pollutes diffs. A tracked `test.env` is a footgun — if anyone populates it with real credentials it will be committed silently. `.serpapi-cache.json` may contain cached API responses and should be confirmed ignored.
- **Fix approach:** `git rm --cached .DS_Store juan-portfolio/test.env`, add `.DS_Store` and `*.env` (except `.env.example`) to `.gitignore`, and add `.serpapi-cache.json` to `.gitignore`.

---

## Medium Severity

### Large block of disabled/excluded tests (CI green is partial)

- **Issue:** `vitest.config.mts` excludes 15 test files. Four are excluded for "SCSS import issues" (`tests/int/frontend/page.int.test.tsx`, `tests/unit/blocks/Content.test.tsx`, `tests/unit/blocks/HeroHome.test.tsx`, `tests/unit/components/RichText.test.tsx`). Eleven more (DinoRank, keyword-sync, SerpApi, account-rotation, create-post, content scripts) are disabled as "pre-existing failures that were blocking the CI job."
- **Files:** `vitest.config.mts` (exclude list)
- **Impact:** Content-generation and SEO tooling (`syncKeywords`, `scrape-dinorank`, `create-post`, `DinoBrainApiAdapter`, `SerpApiAdapter`) has zero CI coverage. Regressions in these scripts ship undetected. The SCSS-related component tests also leave key blocks untested.
- **Fix approach:** Fix the SCSS transform config so component tests run, then triage and re-enable the script suite (or move scripts to their own test command). Track re-enablement as explicit phases.

### Stubbed / unimplemented features

- **Issue:** Several features are placeholders. GSC integration endpoint returns "implementation pending" (`// TODO: Implement Google Search Console API integration`). SEO analyzer reports `internalLinksCount: 0` with `// TODO: Implement link counting`.
- **Files:** `src/plugins/seo/endpoints/gsc-integration.ts:18`, `src/plugins/seo/utils/seoAnalyzer.ts:357`
- **Impact:** The GSC endpoint advertises functionality it does not provide (returns 200 with a pending message). The SEO analyzer's internal-link metric is always 0, which can mislead content scoring. Note: a separate working GSC sync exists via `npm run sync:gsc` (`src/scripts/seo/sync-gsc.ts`), so the dead endpoint is redundant.
- **Fix approach:** Either implement the endpoint or remove it to avoid a false API surface. Wire `internalLinksCount` to the existing internal-linking index (`src/scripts/internal-linking/`).

### `any` / type-escape density

- **Issue:** 87 occurrences of `: any`, `as any`, `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` across `src/`. The GSC endpoint is fully `any`-typed (`(config: GSCConfig): any`, `req: any, res: any`) with a file-level `eslint-disable @typescript-eslint/no-explicit-any`.
- **Files:** `src/plugins/seo/endpoints/gsc-integration.ts`, plus 80+ others across `src/`
- **Impact:** Erodes the value of `strict: true` in `tsconfig.json`. Type escapes hide real errors and make refactors riskier.
- **Fix approach:** Triage the highest-traffic offenders (Payload hooks, SEO plugin, scripts) and replace `any` with generated `payload-types` or explicit interfaces.

### Git submodules in dirty state

- **Issue:** `.agent/skills` is a submodule showing as modified (` m`) in `git status`, and `juan-portfolio/claude-seo` is a committed gitlink (`160000`).
- **Files:** `.agent/skills`, `juan-portfolio/claude-seo`
- **Impact:** Submodule pointer drift is easy to commit accidentally and confuses CI/clones. New contributors who do not `git submodule update --init` get empty/wrong skill content.
- **Fix approach:** Decide whether `.agent/skills` changes should be committed upstream, document submodule init in the README, and reconcile the `juan-portfolio/claude-seo` pointer.

---

## Low Severity

### Large uncommitted working-tree changes (DIRTY tree)

- **Issue:** The working tree carries substantial uncommitted edits and many untracked files. Modified: `content/keywords.md` (+622/-128 lines), `src/scripts/dinorank/DinoRankApiClient.ts`, `src/scripts/scrape-dinorank.ts`, two frontend components. Untracked: `plan.md`, `content/extract_keywords.py`, `content/fix_links.py`, `content/process_links.py`, `content/link_script.cjs`, `content/scripts/`, `content/productos/`, `content/gaps-de-contenido.md`, `content/keywords_map.json`, `src/scripts/generate-gaps.ts`, `src/scripts/quick-research.ts`, plus scratch dirs `tmp-test-sync/` and `tmp-unit-test-content/`.
- **Files:** see `git status`
- **Impact:** Per project workflow notes, the tree is intentionally dirty — **stage only your own files**, never `git add -A`, or you will sweep unrelated Python content-tooling and scratch dirs into a commit. The `tmp-*` dirs and loose `.py`/`.cjs` scripts at repo root are working artifacts that should not be committed.
- **Fix approach:** When committing, stage explicit paths. Move ad-hoc Python content scripts into a documented `content/scripts/` location (and ignore the `tmp-*` dirs).

### Many scripts gated by required env vars (no central validation)

- **Issue:** 94 `process.env` reads across `src/`. Scripts run via `tsx -r dotenv/config` and silently depend on env vars (Mongo URI, Vercel Blob token, Resend, Anthropic/Gemini keys, SerpApi, DinoRank, GSC service-account email/key). No detected non-null assertions or a single env-validation module.
- **Files:** `package.json` script entries, `src/scripts/**`, `next.config.js` (`NEXT_PUBLIC_SERVER_URL` drives image `remotePatterns`)
- **Impact:** Missing env vars surface as runtime failures deep in a script run rather than a clear startup error. CI/Vercel must keep secrets in sync (per project memory).
- **Fix approach:** Add a small env-schema validator (e.g. zod) run at script/app startup that fails fast with a clear list of missing keys.

### SEO regression surface is broad and easy to break

- **Issue:** SEO output is wired across many independent pieces: sitemaps (`next-sitemap.config.cjs` + `postbuild`), per-route `revalidate` (`src/app/(frontend)/[locale]/blog/page.tsx` = 3600, `.../blog/page/[pageNumber]/page.tsx` = 600, `sitemap/page.tsx`, `llms.txt/route.ts`), JSON-LD/@graph, hreflang/i18n metadata, OG images, and redirects fetched at build (`npm run redirects` → `src/scripts/fetch-redirects.ts`, output `redirects.json`).
- **Files:** `next-sitemap.config.cjs`, `redirects.json`, `src/app/(frontend)/**`, recent commits `d87a86d` (FAQPage JSON-LD), `ccc2deb` (OG image sizing)
- **Impact:** Recent history shows frequent SEO fixes (FAQPage emission, OG image 1200x630, sitemap host-agnostic, es-first hreflang order). These are interdependent and lack full test coverage (see excluded SCSS/component tests), so changes risk silent SEO regressions. There is a documented post-deploy sitemap action required after deploys.
- **Fix approach:** Keep the host-agnostic sitemap tests green, add JSON-LD/hreflang snapshot tests, and document the post-deploy sitemap submission step in the README.

### `redirects.json` is build-generated but committed

- **Issue:** `redirects.json` is produced by `npm run redirects` (runs before `build` and `dev`) yet is also committed to the repo.
- **Files:** `redirects.json`, `src/scripts/fetch-redirects.ts`, `package.json`
- **Impact:** The committed file can drift from the source of truth (the redirects plugin/DB), and a build with no network access reuses stale data silently.
- **Fix approach:** Decide if it should be generated-only (gitignored) or committed-and-validated; document which.

---

*Concerns audit: 2026-06-22*
