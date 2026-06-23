# Coding Conventions

**Analysis Date:** 2026-06-22

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` at the component root (`src/components/JsonLd.tsx`, `src/components/RelatedPosts.tsx`) or a `PascalName/index.tsx` folder when the component has co-located assets (`src/components/Card/index.tsx`, `src/components/PayloadRedirects/index.tsx`).
- shadcn/ui primitives live lowercase under `src/components/ui/` (`button.tsx`, `card.tsx`, `select.tsx`, `pagination.tsx`).
- Client-only components carry a `.client.tsx` suffix when colocated with server siblings (`src/components/home/ClientsCarousel.client.tsx`).
- Utilities are `camelCase.ts` (`src/utilities/cloudinaryUrl.ts`, `src/utilities/estimateReadingTime.ts`, `src/utilities/getPostUrl.ts`); schema generators live in `src/utilities/schema/` as `generateXxxSchema.ts`.
- Scripts under `src/scripts/` are `kebab-case.ts` (`scrape-dinorank.ts`, `fetch-redirects.ts`, `audit-urls.ts`) with PascalCase classes/services inside (`DinoRankApiClient.ts`).

**Functions:**
- `camelCase` for functions and helpers (`getPostUrl`, `generateSchema`, `getFallbackBySlug`).
- Schema/factory helpers prefixed `generate*` (`generateMeta`, `generateSchema`, `generateWebSiteSchema`).

**Variables:**
- `camelCase` for locals and props (`localePrefix`, `hasCloudinaryImage`, `sanitizedDescription`).
- `SCREAMING_SNAKE_CASE` for module-level constants and env-derived values (`SITE`, `TEST_DIR`).

**Types:**
- `PascalCase` interfaces/types (`CardPostData`, `LinkingConfig`, `LinkOpportunity`).
- Domain types are imported from generated `@/payload-types` (`import type { Post } from '@/payload-types'`).
- Component prop shapes are declared inline as `React.FC<{ ... }>` or as an exported `type` (see `CardPostData` in `src/components/Card/index.tsx`).

## Code Style

**Formatting (Prettier — `.prettierrc.json`):**
- `singleQuote: true`
- `semi: false` (no semicolons)
- `trailingComma: "all"`
- `printWidth: 100`
- Note: some script/test files still use semicolons (`tests/int/internal-linking.test.ts`); Prettier config is the source of truth — prefer no-semi for new code.

**Editor defaults (`.editorconfig`):**
- 2-space indentation, UTF-8, LF line endings, trailing whitespace trimmed, final newline inserted.

**Prettier ignore (`.prettierignore`):**
- `**/payload-types.ts` (generated), `**/docs/**`, `tsconfig.json`, build/dist/node_modules.

**Linting (`.eslintrc.json`):**
- Extends `next/core-web-vitals` and `next/typescript`; parser `@typescript-eslint/parser`.
- `@typescript-eslint/no-explicit-any`: **off** (`any` is permitted and used liberally, e.g. in `vitest.setup.ts`, test mocks).
- `@typescript-eslint/no-unused-vars`: `warn`.
- `react-hooks/exhaustive-deps`: `warn`; `react-hooks/rules-of-hooks`: `error`.
- `@next/next/no-html-link-for-pages`: off.
- Run with `npm run lint` / `npm run lint:fix` (wraps `next lint`).

## TypeScript Usage

- `strict: true` (`tsconfig.json`), `target: ES2022`, `module: esnext`, `moduleResolution: bundler`, `noEmit: true`, `isolatedModules: true`.
- Project is ESM (`"type": "module"` in `package.json`).
- Path aliases: `@/*` → `./src/*`, plus `@payload-config` → `src/payload.config.ts` and `payload-types` → `src/payload-types.ts`.
- Generated types live in `src/payload-types.ts` (run `npm run generate:types`); never edit by hand.
- `allowJs: true` and `resolveJsonModule: true` are enabled.

## Import Organization

Observed order (e.g. `src/components/Card/index.tsx`):
1. Directives (`'use client'`) first when present.
2. Internal utilities via alias (`@/utilities/ui`, `@/utilities/useClickableCard`).
3. Third-party/framework (`next/link`, `next/image`, `react`).
4. `import type` for type-only imports (`import type { Post } from '@/payload-types'`).
5. Internal components and constants via alias (`@/components/Media`, `@/constants/fallbackImages`).

**Path aliases:**
- Always prefer `@/...` over deep relative paths in `src/`.
- Tests use relative paths back into `src/` (`../../../src/components/Card`) or the `@/` alias (resolved by `vite-tsconfig-paths`).

## Component Patterns

- Server Components by default; opt into client with `'use client'` at the top of the file (`src/components/Card/index.tsx`).
- Components typed as `export const Name: React.FC<{ ...props }>`; props destructured at the top of the body, with inline defaults (`locale = 'es'`).
- Class merging via `cn()` from `@/utilities/ui` (clsx + tailwind-merge).
- Styling with Tailwind CSS (`tailwind.config.js`); component variants via `class-variance-authority`.
- UI primitives follow the shadcn/ui pattern under `src/components/ui/` and are composed by higher-level components.
- Locale-aware URLs computed in-component (`localePrefix`, `getPostUrl(doc, locale)`); Spanish (`es`) is the default/prefixless locale, English (`en`) is prefixed `/en`.
- Images go through Cloudinary helpers with deterministic fallbacks (`getFallbackBySlug`) to avoid broken images.

## Error Handling

- Scripts and setup use try/catch with `console.error` and `process.exit(1)` on fatal init failure (`tests/vitest.global.setup.ts`).
- Build/SEO code favors defensive guards and fallbacks (null checks, `?? `, deterministic fallback assets) over throwing in the render path.

## Logging

- No logging framework; `console.log` / `console.error` used directly in scripts and setup.

## Comments

- Inline comments explain *why*, often referencing SEO audit issue numbers (`#18`, `#19`) and the "SEO audit jun-2026" wave (see `vitest.config.mts` exclude block, `tests/unit/seo/schema-generators.test.ts`).
- JSDoc-style block comments used on regression suites and non-obvious helpers; not enforced project-wide.

## Module Design

- Named exports are the norm (`export const Card`, `export type CardPostData`); avoid default exports except for Next.js pages/route handlers and config files.
- One primary component/service per file; co-locate via `PascalName/index.tsx` folders when assets are needed.
- Generated artifacts (`payload-types.ts`, importmap) are produced via `npm run generate:types` / `generate:importmap`, not authored manually.

## Commit Message Conventions

Conventional Commits, verified from `git log`:
- Format: `type(scope): subject` — lowercase type, lowercase scope in parens, imperative subject.
- Types in use (frequency, last ~80 commits): `fix` (dominant), `feat`, `test`, `chore`, `docs`, `perf`, `ci`.
- Common scopes: `seo`, `vercel`, `build`, `ci`, `ts`, `test`, `perf`, `repo`, `scripts`, `gitflow`, `hosting`, `deployment`, `milestone`, `performance`.
- Examples: `fix(seo): emit FAQPage JSON-LD from embedded post FAQ blocks`, `test: make sitemaps assertions host-agnostic`, `feat(perf): add Speculation Rules API for hover-intent prefetching`.
- Merge commits summarize audit waves: `Merge SEO audit wave 3 (jun-2026): #35 #37 #38 #48 #49 #50 + CI unblock`.
- Branch flow (`GITFLOW.md`): feature branches → `develop` → `main`; branch-name validation enforced via `.github/workflows/validate-branch-name.yml`.

---

*Convention analysis: 2026-06-22*
