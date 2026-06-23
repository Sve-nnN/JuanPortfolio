# Testing Patterns

**Analysis Date:** 2026-06-22

## Test Framework

**Runner:**
- Vitest `4.0.3` — config: `vitest.config.mts`
- Plugins: `@vitejs/plugin-react` (JSX/React), `vite-tsconfig-paths` (resolves `@/*` aliases in tests).
- Environment: `jsdom` (`environment: 'jsdom'`), `globals: true` (no need to import `describe/it/expect`, though most files import them explicitly).
- Timeouts: `testTimeout: 30000`, `hookTimeout: 30000`.

**Component testing:**
- `@testing-library/react` `16.3.0` + `@testing-library/jest-dom` `6.9.1` (matchers loaded in `vitest.setup.ts`).
- `jsdom` `27.0.1`.

**E2E:**
- Playwright `1.56.1` — config: `playwright.config.ts`, `testDir: ./tests/e2e`, Chromium-only (`Desktop Chrome`).
- Coverage: `@vitest/coverage-v8` `4.0.3` (available; no enforced thresholds configured).

**Run Commands:**
```bash
npm run test:int     # vitest run --config ./vitest.config.mts (unit + int)
npm run test:e2e     # playwright test --config=playwright.config.ts
npm test             # runs test:int then test:e2e
```
- No watch-mode script defined; run `vitest --config ./vitest.config.mts` directly for watch.

## Test File Organization

**Location (separate `tests/` tree, not co-located):**
```
tests/
├── unit/        # unit tests (*.test.ts / *.test.tsx)
│   ├── components/ blocks/ utilities/ utils/ seo/ scripts/ sync/ internal-linking/ admin/
├── int/         # integration tests (*.int.test.ts / *.test.ts)
│   ├── admin/ frontend/ scripts/ seo/ utilities/
├── e2e/         # Playwright specs (*.e2e.spec.ts / *.spec.ts)
├── vitest.global.setup.ts   # Payload bootstrap helper (see note below)
```

**Naming:**
- Unit/int Vitest files: `*.test.ts` / `*.test.tsx` (some int files use `.int.test.ts`).
- Playwright files: `*.spec.ts` / `*.e2e.spec.ts`.

**Vitest include glob:**
- `tests/unit/**/*.test.{ts,tsx}` and `tests/int/**/*.test.{ts,tsx}`.
- E2E is excluded from Vitest (`**/e2e/**`) and run by Playwright instead.

## Test Setup

**`vitest.setup.ts`** (loaded via `setupFiles`):
- Imports `@testing-library/jest-dom` matchers.
- `afterEach(cleanup)` to unmount React trees.
- Global mocks for Next.js: `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`, `useLocale`), `next/image` (renders plain `<img>`), `next/link` (renders plain `<a>`).

**`tests/vitest.global.setup.ts`:**
- Bootstraps a real Payload instance (`getPayload({ config })`) onto `global.payload` and destroys it on teardown.
- NOTE: this file is **not currently wired into `vitest.config.mts`** (no `globalSetup` entry). Most active tests rely on the mocks in `vitest.setup.ts` and filesystem fixtures rather than a live Payload/Mongo connection.

## Test Structure

**Suite organization (`tests/unit/components/Card.test.tsx`):**
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

describe('Card component', () => {
  const mockDoc: any = { /* fixture */ }
  it('renders the card with all props', () => {
    render(<Card doc={mockDoc} relationTo="posts" showCategories />)
    expect(screen.getByText('Test Post')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/blog/tech/test-post')
  })
})
```

**Patterns:**
- Per-file `vi.mock(...)` overrides on top of the global mocks (e.g. `Card.test.tsx` re-mocks `next/navigation`).
- Inline fixtures typed as `any` or the real prop type (`CardPostData`); no shared factory layer.
- Assertions use Testing Library queries (`getByText`, `getByRole`, `queryByText`) + jest-dom matchers (`toBeInTheDocument`, `toHaveAttribute`).

**Env-sensitive modules:**
- Some suites set env before importing the module under test, then use dynamic `await import(...)` so the import runs after env is set (`tests/unit/seo/schema-generators.test.ts` sets `NEXT_PUBLIC_SERVER_URL` then `await import('@/utilities/generateSchema')`). Replicate this pattern for any module that reads `process.env` at import time.

## Integration Tests

- Live under `tests/int/`; exercise multi-module flows (internal linking, SEO metrics, scrape pipelines).
- Use real filesystem temp dirs created/cleaned in hooks (`tests/int/internal-linking.test.ts` creates `tmp-test-content-for-linking` in `beforeEach`, removes it in `afterAll`).
- Helpers like `createMockFile` write fixtures to disk via `fs/promises`.

## Mocking

- Framework: Vitest `vi` (`vi.mock`, `vi.fn`).
- Next.js navigation/image/link mocked globally in `vitest.setup.ts`; override per-file when a test needs specific behavior.
- External services (DinoRank, SerpApi, GSC, Payload) are tested with adapter-level mocks / fixtures (see `tests/unit/seo/`, `tests/unit/scripts/`).

## Excluded / Flaky / Disabled Tests

Defined in the `exclude` array of `vitest.config.mts`:

**SCSS import issues (temporarily excluded):**
- `tests/int/frontend/page.int.test.tsx`
- `tests/unit/blocks/Content.test.tsx`
- `tests/unit/blocks/HeroHome.test.tsx`
- `tests/unit/components/RichText.test.tsx`

**Pre-existing failing non-web tooling tests (disabled to unblock CI — "SEO audit jun-2026"):** content-generation scripts (DinoRank, keyword-sync, SerpApi, account rotation, create-post), e.g.:
- `tests/int/scripts/createPost.int.test.ts`, `tests/int/syncContent.int.test.ts`
- `tests/unit/scripts/account-rotation.test.ts`, `accountRegistry.test.ts`, `create-post.test.ts`, `DinoBrainApiAdapter.test.ts`, `scrape-dinorank-retry.test.ts`, `syncKeywords-logic.test.ts`, `syncKeywords.test.ts`
- `tests/unit/seo/SerpApiAdapter.real.test.ts`, `tests/unit/seo/syncKeywords.test.ts`, `tests/unit/syncKeywords.test.ts`

These cover content-generation scripts, not the website; re-enable once the script suite is fixed.

## What Is Covered

- **Components:** Card, CMSLink, Pagination, JsonLd, AnimateOnScroll, FAQ block (`tests/unit/components/`, `tests/unit/blocks/`).
- **SEO (heavy coverage):** schema generators, sitemaps/robots, metadata/listings, llms.txt, OG images, middleware locale, URL prefixing, GSC/SerpApi adapters (`tests/unit/seo/`).
- **Utilities:** cloudinary URLs, generateMeta, generateSchema, getPostUrl, markdown tables (`tests/unit/utilities/`, `tests/unit/utils/`).
- **Internal linking engine:** keyword extraction, content scanning, link injection, semantic scoring, i18n (`tests/unit/internal-linking/`, `tests/int/internal-linking*`).
- **E2E:** smoke, routes, frontend, navbar search, SEO structural integrity (`tests/e2e/`).

## CI Setup

**Workflow:** `.github/workflows/build-validation.yml` (triggers on push + PR to `main` and `develop`).

**`build` job (Node 20.x, pnpm v10):**
1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm build` with `PAYLOAD_SECRET`, `DATABASE_URI`, `NEXT_PUBLIC_SERVER_URL` injected (Payload needs these to prerender at build time).
4. `pnpm generate:types --dry-run || true` (non-blocking type check).

**`tests` job (Node 20.x, pnpm v10):**
1. `pnpm install --frozen-lockfile`
2. `pnpm test:int` (Vitest only; Playwright E2E is not run in this CI job).
3. Same Payload/server env vars injected.

- pnpm store is cached via `actions/cache` keyed on `pnpm-lock.yaml`.
- `NEXT_PUBLIC_SERVER_URL` defaults to `https://juan-tech.com`; tests are written host-agnostically to honor the CI-provided value (`fix(seo): make sitemaps assertions host-agnostic`).
- Additional workflows: `validate-branch-name.yml` (branch naming) and several `gemini-*.yml` (automated triage/review).

## Local Environment Notes

- Node pinned to `20.11.0` (`.node-version`); `engines.node: ^20`.
- Package manager is pnpm (`packageManager: pnpm@9.15.4`); CI uses pnpm v10. Vercel build has known npm-vs-pnpm caveats (see memory: build & deploy caveats).
- Stray `tmp-test-sync/` and `tmp-unit-test-content/` dirs in the working tree are test-fixture scratch output, not committed test sources.

---

*Testing analysis: 2026-06-22*
