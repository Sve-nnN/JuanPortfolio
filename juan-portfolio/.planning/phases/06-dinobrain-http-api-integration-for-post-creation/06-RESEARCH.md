# Phase 6: DinoBrain HTTP API Integration for Post Creation — Research

**Researched:** 2026-04-01
**Domain:** HTTP API porting, account registry migration, content generation pipeline
**Confidence:** HIGH — primary source is the battle-tested external repo read directly via GitHub API

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Replace Playwright BrainState machine with pure HTTP `DinoBrainApiAdapter` from `seo-content-engine` repo (branch `release/v1.3-milestone`)
- New files land in `src/scripts/dinorank/` subfolder
- CLI flags: `--country`, `--language`, `--site-type`, `--domain`, `--words`
- Account registry gains 6 new fields: `createdLanguage`, `createdCountry`, `createdDomain`, `createdProjectType`, `assignedClientId`, `cooldownUntil`
- Cooldown duration: 5 minutes after each generation
- `jsdom` + `turndown` are used for HTML-to-Markdown conversion
- Account selection is scored (language=10pts, country=6pts, domain=4pts, siteType=3pts)

### Claude's Discretion
- Whether to keep `--playwright` flag for fallback or remove the BrainState block entirely
- Whether `scrape-dinorank.ts` shares the new `DinoRankApiClient` or stays independent
- How to handle the `engine-prompts.ts` that already exists in `src/scripts/config/` (already in sync with source)

### Deferred Ideas (OUT OF SCOPE)
- None explicitly deferred; scope is fully specified above
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRAIN-01 | `pnpm create-post` generates complete post body via HTTP (no Playwright for content generation) | DinoBrainApiAdapter.generate() full flow documented |
| BRAIN-02 | DinoBrain parameters (country, language, site type, domain, word count) accepted as CLI flags and forwarded to API | CLI flag table + body param mapping documented |
| BRAIN-03 | Account registry carries new fields: createdLanguage, createdCountry, createdDomain, createdProjectType, assignedClientId, cooldownUntil | Full AccountEntry diff documented, migration strategy defined |
| BRAIN-04 | Existing `pnpm test:int` suite passes with no regressions | Impact analysis per existing test file documented |
| BRAIN-05 | CLAUDE.md / README updated to document new CLI flags | Flags documented; update scope minimal |
</phase_requirements>

---

## Summary

Phase 6 ports the `DinoBrainApiAdapter` and `DinoRankApiClient` from the standalone `seo-content-engine` repo into the blog monorepo, replacing the fragile Playwright BrainState machine in `create-post.ts`. The external repo is on branch `release/v1.3-milestone` and represents the canonical, battle-tested implementation; the blog simply needs to host a copy adapted to its file layout.

The core HTTP flow is: login → GET dinobrain page (extract credits) → POST `generaContenido.php` → poll `controlIA.php` until `finalizado` → POST `obtieneContenidoGenerado.php` → JSDOM parse + Turndown convert. Both `jsdom@27.0.1` and `turndown@^7.2.2` are already present in `package.json`, so no new production dependencies are needed.

The blog's existing `accountRegistry.ts` at `src/scripts/utils/accountRegistry.ts` lacks the 6 DinoBrain-specific fields. The external repo's version is a superset — a targeted field addition plus a signature change to `registerAccount()` (adds `profile?: AccountRegistrationProfile` param) is the only schema migration required. Existing registry entries in `content/dinorank-accounts-registry.json` will be backward-compatible because all new fields are optional.

**Primary recommendation:** Port DinoRankApiClient and DinoBrainApiAdapter as-is to `src/scripts/dinorank/`, extend `accountRegistry.ts` in-place (it's already a shared module), and wire into `create-post.ts` by removing the BrainState Playwright block entirely — no fallback flag needed since the HTTP path is strictly superior and all test doubles are already defined.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jsdom` | `27.0.1` (already installed) | Parse DinoRank HTML response to extract `#textodelcontenido` | Node environment DOM parsing; already in devDependencies |
| `turndown` | `^7.2.2` (already installed) | Convert extracted HTML to Markdown | Same library already used in create-post.ts today |
| Native `fetch` | Node 18+ built-in | All HTTP calls to DinoRank API | No extra deps; same pattern already in scrape-dinorank.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@clack/prompts` | already installed | CLI spinners and log output in DinoBrain flow | Already used in create-post.ts |
| `vitest` | already installed | Unit + integration tests | All new test files |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsdom for HTML parsing | node-html-parser / cheerio | jsdom already installed and matches source repo exactly |
| turndown for Markdown | marked / remark | turndown already installed and in use in the codebase |

**Installation:**
```bash
# No new packages required — jsdom and turndown are already in package.json
# Verify:
# jsdom: 27.0.1  ✅
# turndown: ^7.2.2  ✅
# playwright: still needed for e2e tests — do NOT remove
```

---

## Architecture Patterns

### Target Directory Structure
```
src/scripts/
├── dinorank/
│   ├── DinoRankApiClient.ts     # NEW — ported from seo-content-engine
│   └── DinoBrainApiAdapter.ts  # NEW — ported from seo-content-engine
├── config/
│   └── engine-prompts.ts       # ALREADY EXISTS — matches source exactly, no change needed
├── utils/
│   └── accountRegistry.ts      # MODIFIED — add 6 new fields + profile param to registerAccount
├── create-post.ts               # MODIFIED — remove BrainState block, wire adapter, add CLI flags
└── scrape-dinorank.ts           # NO CHANGE — stays independent (lower regression risk)
```

### Pattern 1: DinoRankApiClient (HTTP Layer)

**What:** Stateful cookie-jar HTTP client for dinorank.com. Manages PHPSESSID, CSRF, login, GET, POST, logout, and session file persistence.

**Key differences between blog's inline client (scrape-dinorank.ts) and the external repo's standalone client:**

| Feature | Blog inline client | External DinoRankApiClient to port |
|---------|-------------------|------------------------------------|
| `post()` retry | No retry | 3 retries on socket errors |
| `login()` `permanecer` | `permanecer=si` (sticky) | `permanecer=no` (short-lived, 20-30 min) |
| Session file persistence | None | Saves/clears cookies to `content/dinorank-kw-session.json` |
| `extractContentCredits()` | Not present | Parses 4 regex patterns (ES/EN variants) |
| `public email` field | `public email` | `public email` (same) |
| `completeOnboarding()` | Present (blog has it in scrape-dinorank.ts inline) | NOT in external DinoRankApiClient (it's on the scrape-dinorank.ts side) |

**The external repo's `DinoRankApiClient` does NOT have `completeOnboarding()` — that stays in `scrape-dinorank.ts`. The ported client only needs: `login()`, `get()`, `post()`, `logout()`, `extractContentCredits()`, `getCookieHeader()`.**

```typescript
// Source: seo-content-engine/src/services/DinoRankApiClient.ts (release/v1.3-milestone)
export class DinoRankApiClient {
  constructor(public email: string, public pass: string, sessionFile?: string)
  async login(language?: string): Promise<'ok' | 'device_conflict' | 'failed'>
  async get(url: string, referer?: string): Promise<string>
  async post(url: string, body: string, referer: string, maxRetries?: number): Promise<string>
  async logout(): Promise<void>
  extractContentCredits(html: string): number
  getCookieHeader(): string
}
```

### Pattern 2: DinoBrainApiAdapter (Content Generation)

**What:** Orchestrates the full DinoBrain generation lifecycle — account selection, login, HTTP calls, HTML extraction, cooldown management, and auto-provisioning.

**Critical `generate()` flow:**
```
1. loadRegistry() → filter contentCredits > 0
2. normalizeLanguage(data?.language) → 'es' | 'en'
3. If clientId: try dedicated accounts → legacy unassigned → provision
4. If language='en' (no clientId): try EN-profile accounts → provision → fallback general
5. Else: tryLoginWithAvailableAccounts (scored by profile) → provision
6. api.get(dinoBrainReferer) → extractContentCredits — throw if 0
7. Build context string from WRITING_INSTRUCTIONS + language/country rules + SERP data
8. POST /ajax/generaContenido.php with all params
9. Parse response: plain numeric ID (new API) OR JSON {status:'OK', message:id} (legacy)
10. Poll /ajax/controlIA.php every pollingDelay ms (default 20s) until 'finalizado' — max 40 attempts
11. POST /ajax/obtieneContenidoGenerado.php
12. extractBodyContent() → JSDOM parse #textodelcontenido → strip noise → remove H1 (becomes title) → Turndown → clean
13. finally: api.logout() + markAccountCooldown(email) via updateAccount
```

### Pattern 3: Account Scoring Algorithm

**Scoring is purely additive — higher score = preferred:**
```
language match:  +10 pts
country match:   +6 pts
domain match:    +4 pts
siteType match:  +3 pts
```

**Tie-breaking order:** score desc → contentCredits desc → lastUsed asc (oldest first)

**Cooldown check:** `getCooldownRemainingMs()` compares `cooldownUntil` ISO string to `Date.now()`. If ALL ready accounts fail login, wait for shortest cooldown and retry.

### Pattern 4: Account Registry Extension

**Current `AccountEntry` (blog):**
```typescript
{ email, password, keywords, content, kwCredits, contentCredits, createdAt, expiresAt, lastUsed }
```

**Extended `AccountEntry` (after migration):**
```typescript
{
  // existing fields (unchanged)
  email, password, keywords, content, kwCredits, contentCredits,
  createdAt, expiresAt, lastUsed,
  // new optional fields
  createdLanguage?: 'es' | 'en'
  createdCountry?: string      // 2-char uppercase, e.g. 'ES'
  createdDomain?: string       // lowercase, no www prefix
  createdProjectType?: string  // 'nicho'|'negociolocal'|'ecommerce'|'producto'
  assignedClientId?: string    // optional client binding
  cooldownUntil?: string       // ISO datetime string
}
```

**`registerAccount()` signature change:**
```typescript
// Current:
registerAccount(email: string, pass: string): AccountEntry

// New (backward-compatible — profile is optional):
registerAccount(email: string, pass: string, profile?: AccountRegistrationProfile): AccountEntry
```

The existing 2 entries in `content/dinorank-accounts-registry.json` lack the new fields. Since all fields are optional, no JSON migration is required — `loadRegistry()` returns them as-is and the adapter handles missing fields gracefully (returns 0 for undefined cooldown, 0 for scoring comparisons with undefined).

### Pattern 5: HTML Extraction via JSDOM + Turndown

```typescript
// Source: DinoBrainApiAdapter.extractBodyContent()
const container = doc.querySelector('#textodelcontenido') ?? doc.body
// Remove UI noise selectors
// Extract and remove H1 → returns as title
// td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' })
// td.remove(['script', 'style', 'button'])
// markdown = td.turndown(container.innerHTML.trim())
// Clean HTML comments and 3+ consecutive blank lines
```

**Key detail:** `await import('jsdom')` and `await import('turndown')` are used as dynamic imports inside `extractBodyContent()`. This works in the Node ESM context of tsx scripts.

### Anti-Patterns to Avoid

- **Sharing `DinoRankApiClient` with scrape-dinorank.ts:** The blog's scrape-dinorank.ts has its own inline client with slightly different headers (Sec-Ch-Ua, Sec-Fetch-* headers, `permanecer=si`). Merging would risk regression in the keyword research flow. Keep them independent.
- **Using the `login()` session file path from external repo (`content/dinorank-kw-session.json`):** This already exists in the blog. The external DinoRankApiClient defaults to `content/dinorank-kw-session.json`. Accept that default — no path conflict.
- **Removing `playwright` dependency:** Playwright is still required for `pnpm test:e2e`. Only remove the Playwright _import_ from `create-post.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML-to-Markdown | Custom regex stripper | `turndown` | Already tested in source; handles edge cases (tables, code blocks, nested elements) |
| DinoRank DOM parsing | Regex on raw HTML | `jsdom` | DinoRank HTML has nested divs; `#textodelcontenido` selector is clean and proven |
| Cookie management | Parse Set-Cookie headers manually | `DinoRankApiClient.mergeCookies()` | Existing implementation handles date values in cookie attributes correctly via `headers.getSetCookie()` |
| Account scoring | Custom sort logic | Port `scoreAccountForProfile()` verbatim | Scoring weights are calibrated; changing them changes account preference behavior |

---

## Common Pitfalls

### Pitfall 1: `permanecer=si` vs `permanecer=no`
**What goes wrong:** Blog's scrape-dinorank.ts uses `permanecer=si` (sticky login). External DinoRankApiClient uses `permanecer=no` (short-lived sessions ~20-30 min). The DinoBrain flow generates content then immediately logs out, so short-lived is correct.
**Why it happens:** Copied from legacy code that needed persistent sessions for keyword research.
**How to avoid:** Port the external client exactly — `permanecer=no` in the login body.

### Pitfall 2: `generaContenido.php` response format changed
**What goes wrong:** New DinoRank API returns a plain integer ID string (`"304927"`), not `{"status":"OK","message":"304927"}`. Code that only handles JSON will throw.
**Why it happens:** DinoRank silently changed the response format.
**How to avoid:** Port the dual-format parser: test `/^\d+$/.test(trimmed)` first, fall back to JSON parse.

### Pitfall 3: `contentCredits` check vs `kwCredits` check
**What goes wrong:** `DinoBrainApiAdapter.generate()` filters `contentCredits > 0`, not `kwCredits > 0`. Both fields track different limits.
**Why it happens:** The two credit types serve different endpoints.
**How to avoid:** Filter on `contentCredits` for DinoBrain, on `kwCredits` for keyword research.

### Pitfall 4: `createDinoRankAccount` signature mismatch
**What goes wrong:** The blog's `scrape-dinorank.ts` exports `createDinoRankAccount()` with no parameters. The external adapter calls `createDinoRankAccount({ language, country, domain, projectType })`.
**Why it happens:** The blog's version was pre-profile-aware.
**How to avoid:** The ported `DinoBrainApiAdapter` must import `createDinoRankAccount` from `scrape-dinorank.ts`. The blog's `createDinoRankAccount` needs to be updated to accept an optional profile (see Plan 06-02 scope). The external repo's scrape-dinorank.ts has the updated signature — port that function body.

### Pitfall 5: `registerAccount()` signature used in scrape-dinorank.ts
**What goes wrong:** `scrape-dinorank.ts` calls `registerAccount(email, password)` (2 args). After adding the `profile` parameter, this call site still works (profile is optional), but TypeScript strict mode must be satisfied.
**Why it happens:** Shared module — two callers with different needs.
**How to avoid:** Make `profile` optional with `profile?: AccountRegistrationProfile`. All existing calls remain valid.

### Pitfall 6: `jsdom` dynamic import in test environment
**What goes wrong:** `extractBodyContent()` uses `await import('jsdom')` and `await import('turndown')`. In Vitest, dynamic imports of packages already in node_modules work fine — but if mocked incorrectly they can return undefined.
**Why it happens:** Dynamic imports skip static analysis.
**How to avoid:** Don't mock `jsdom` or `turndown` in unit tests; they're fast enough to use real implementations. The external repo's tests confirm this approach.

### Pitfall 7: `content/dinorank-kw-session.json` path collision
**What goes wrong:** The external `DinoRankApiClient` defaults its session file to `content/dinorank-kw-session.json`. Blog's `scrape-dinorank.ts` also uses `content/dinorank-kw-session.json` as `KW_SESSION_FILE`.
**Why it happens:** Same DinoRank account sessions used across both scripts.
**How to avoid:** This is actually fine — sharing the session file means that if scrape-dinorank logged in, DinoBrainApiAdapter sees the same session. The DinoRankApiClient constructor accepts a custom path if isolation is needed.

---

## Code Examples

### DinoBrain HTTP Endpoints (Verified)
```typescript
// Source: seo-content-engine/src/services/DinoBrainApiAdapter.ts (release/v1.3-milestone)

// 1. Init session (GET)
const dinoBrainReferer = language === 'en'
  ? 'https://dinorank.com/en/dinobrain/'
  : 'https://dinorank.com/dinobrain/'
const brainHtml = await api.get(dinoBrainReferer, dinoBrainReferer)
const credits = api.extractContentCredits(brainHtml)

// 2. Start generation (POST)
// URL: https://dinorank.com/ajax/generaContenido.php
const genBodyParams = new URLSearchParams({
  t: String(Date.now()),
  keyword,
  imagenes: 'no',
  contexto: context,           // WRITING_INSTRUCTIONS + language/country rules + SERP data
  exclusiones: CONTENT_EXCLUSIONS,
  numPalabras: String(numPalabras),  // default 2000
  keyword_idioma: 'Spanish' | 'English',
  idioma: 'es' | 'en',
})
// Conditionally add country:
if (country) {
  genBodyParams.set('keyword_pais', country)  // e.g. 'ES'
  genBodyParams.set('pais', country)
}

// 3. Poll for completion (POST)
// URL: https://dinorank.com/ajax/controlIA.php
const pollBody = `t=${Date.now()}&idContenido=${idContenido}`
// Response: string containing 'finalizado' or '100%' when done; progress text otherwise
// Max 40 attempts, 20s interval (pollingDelay injectable for tests)

// 4. Retrieve content (POST)
// URL: https://dinorank.com/ajax/obtieneContenidoGenerado.php
const finalBody = `t=${Date.now()}&id=${idContenido}&modo=undefined&keyword=${encodeURIComponent(keyword)}`
// Response: raw HTML with #textodelcontenido div
```

### generaContenido.php Response Parsing (Dual Format)
```typescript
// Source: seo-content-engine/src/services/DinoBrainApiAdapter.ts
const trimmed = genRes.trim()
if (/^\d+$/.test(trimmed)) {
  idContenido = trimmed  // New API: plain integer
} else {
  const genData = JSON.parse(trimmed)
  if (genData.status !== 'OK') throw new Error(`Error al iniciar generación: ${genRes}`)
  idContenido = genData.message  // Legacy: JSON with status/message
}
```

### Account Registry Migration Helper
```typescript
// Migration function — backfills missing optional fields to existing entries
// All new fields are optional, so loadRegistry() works unchanged for existing entries.
// No migration script needed; the typed interface handles undefined gracefully.
```

### CLI Flag Parsing Addition to create-post.ts
```typescript
// New flags to parse from process.argv:
// --country=ES   → forwarded as KeywordData.country
// --language=es  → forwarded as KeywordData.language
// --site-type=nicho  → forwarded as KeywordData.clientSiteType
// --domain=juan-tech.com  → forwarded as KeywordData.targetURL (or new field)
// --words=2000   → forwarded as KeywordData.avgWordCount override
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Playwright BrainState machine | Pure HTTP DinoBrainApiAdapter | seo-content-engine v1.3 | Removes 300MB+ Playwright binary dependency for content generation; 10x faster; no UI fragility |
| `permanecer=si` (sticky session) | `permanecer=no` (short-lived) | seo-content-engine v1.3 | Reduces device_conflict risk on generation sessions |
| No cooldown | 5-minute per-account cooldown | seo-content-engine v1.3 | Prevents rate-limiting on rapid successive generations |
| No account scoring | Profile-based scoring (lang/country/domain/siteType) | seo-content-engine v1.3 | Better content targeting per market |

**Deprecated/outdated:**
- `BrainState` enum and `generateContentWithDinoBrain()` Playwright function in `create-post.ts`: replaced entirely by `DinoBrainApiAdapter.generate()`
- `createDinoRankAccount()` without profile parameter in blog: to be updated to accept optional profile
- `dinorank-state.json`: still used by old state machine pattern; no longer needed for content generation (registry.json is the single truth)

---

## Open Questions

1. **Should `scrape-dinorank.ts` adopt the ported `DinoRankApiClient`?**
   - What we know: The blog's inline client works correctly for keyword research. The external client has retry logic and session file persistence but uses slightly different headers.
   - What's unclear: Whether the header differences (`Sec-Fetch-*`, `permanecer`) matter for kresearch.php.
   - Recommendation: Keep independent for Phase 6 to avoid any regression risk. Consolidation is a separate refactor.

2. **Where does `createDinoRankAccount` with profile live?**
   - What we know: `DinoBrainApiAdapter` imports `createDinoRankAccount` from `scrape-dinorank.ts`. The external repo's version accepts a `DinoRankAccountProfile` param.
   - What's unclear: Whether updating `scrape-dinorank.ts`'s `createDinoRankAccount` signature affects any existing test.
   - Recommendation: Update `scrape-dinorank.ts` to add optional profile parameter (backward-compatible). Check `tests/unit/scripts/dinorank-onboarding.test.ts` for callsite assumptions.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (jsdom environment) |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `pnpm test:int -- tests/unit/scripts/DinoBrainApiAdapter.test.ts` |
| Full suite command | `pnpm test:int` |

### New Tests Required

#### Unit: `tests/unit/scripts/DinoRankApiClient.test.ts`
Port directly from `seo-content-engine/tests/unit/DinoRankApiClient.test.ts`. Covers:
- `login()`: returns `'ok'`, `'device_conflict'`, `'failed'`; uses `permanecer=no`; visits `/en/` URLs when language is `'en'`; saves session file
- `logout()`: no-op when no cookies; calls `cierra.php`; clears session file; preserves other accounts
- `extractContentCredits()`: 4 regex patterns (ES/EN variants); returns 0 on no match
- Session file: creates, merges, clears correctly

Mock: `global.fetch = vi.fn()`. Use `tmpdir()` for isolated session file per test.

#### Unit: `tests/unit/scripts/DinoBrainApiAdapter.test.ts`
Port directly from `seo-content-engine/tests/unit/DinoBrainApiAdapter.test.ts`. Covers:
- Throws when no accounts with credits
- Accepts plain numeric ID (new API format)
- Accepts JSON ID (legacy format)
- Extracts content from `#textodelcontenido`; removes UI noise; promotes H1 to title
- Falls back to `doc.body` when container not found
- Uses fallback title `Post sobre {keyword}` when H1 missing
- Polls correctly: multiple `controlIA.php` calls before `finalizado`
- Tries next account when first login fails
- Marks account cooldown after generation (`updateAccount` called with `cooldownUntil`)
- Calls `logout()` in finally block (even on error)

Mock: `vi.mock('../../src/scripts/dinorank/DinoRankApiClient')`, `vi.mock('../../src/scripts/utils/accountRegistry')`.
Note: Do NOT mock `jsdom` or `turndown` — use real implementations (already installed, fast).

#### Unit: `tests/unit/scripts/accountRegistry.test.ts` (new file, extends existing coverage)
Covers new fields in `AccountEntry`:
- `registerAccount()` with `profile` param: sets `createdLanguage`, `createdCountry`, `createdDomain`, `createdProjectType`, `assignedClientId`
- `registerAccount()` without `profile` param: backward-compatible, new fields absent/undefined
- `updateAccount()` with `cooldownUntil`: persists correctly
- `loadRegistry()`: filters accounts with `kwCredits === -1` and expired `expiresAt` (existing behavior unchanged)

Mock: `vi.mock('fs')` with `existsSync`, `readFileSync`, `writeFileSync`.

### Integration: `tests/unit/scripts/create-post.test.ts` — Existing Tests Must Pass
This file tests exported pure functions: `randomStr`, `randomPassword`, `parseKeywords`, `processContent`, `assemblePost`, `getActiveAccount`, `registerAccount`, `incrementPostCount`, `CATEGORY_LABELS`.

**Impact analysis:**
- `getActiveAccount`, `registerAccount`, `incrementPostCount` — these are state helpers on the old `DinoRankState` type. After Phase 6, if these are removed from `create-post.ts`, these tests will break.
- **Resolution:** Keep the `DinoRankState` type and the three state helper functions exported from `create-post.ts` even after the migration, OR move them and update the import in the test. Either approach is valid; keeping them is simpler.
- All other functions (`parseKeywords`, `processContent`, `assemblePost`) are unaffected.

### Integration: `tests/unit/scripts/scrape-dinorank.test.ts` — Must Pass Without Change
This file mocks `create-post` module (`vi.mock('../../../src/scripts/create-post', ...)`). After Phase 6, `create-post.ts` still exports `randomStr`, `randomPassword` — the mock remains valid.

### Integration: `tests/unit/scripts/dinorank-onboarding.test.ts` — Review Required
Check if any test calls `createDinoRankAccount()` and asserts on its signature. If so, the optional profile parameter addition is backward-compatible and won't break.

### What Can Be Tested Without Real DinoRank API (Mocked)
Everything in unit tests — all three new test files use `vi.mock` for the HTTP client and `global.fetch = vi.fn()`. The `extractBodyContent` method uses real JSDOM + Turndown (both installed), so HTML parsing tests run without any network calls.

### What Requires Real DinoRank API (NOT automated)
- End-to-end `pnpm create-post` smoke test in VERIFICATION plan (06-05)
- Verifying credit extraction regex matches live DinoRank HTML structure

### Phase Gate
Full suite `pnpm test:int` must be green before `/gsd:verify-work` on Phase 6.

### Wave 0 Gaps
- [ ] `tests/unit/scripts/DinoRankApiClient.test.ts` — covers login, logout, session, extractContentCredits
- [ ] `tests/unit/scripts/DinoBrainApiAdapter.test.ts` — covers generate() flow, account selection, HTML extraction
- [ ] `tests/unit/scripts/accountRegistry.test.ts` — covers new fields, backward-compat

*(Test infrastructure: Vitest already configured; no new framework setup needed)*

---

## Sources

### Primary (HIGH confidence)
- `seo-content-engine` repo `release/v1.3-milestone` branch read via `gh api` — all service code, test code, and account registry read directly
- `src/scripts/utils/accountRegistry.ts` — current blog registry module read directly
- `content/dinorank-accounts-registry.json` — current registry data read directly
- `src/scripts/create-post.ts` — current Playwright-based implementation read directly
- `src/scripts/scrape-dinorank.ts` lines 110–240 — blog's existing DinoRankApiClient read directly
- `package.json` — confirmed `jsdom@27.0.1` and `turndown@^7.2.2` already installed

### Secondary (MEDIUM confidence)
- `src/scripts/config/engine-prompts.ts` — confirmed present and matching source repo content

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json; no new deps needed
- Architecture: HIGH — read full source of both DinoRankApiClient and DinoBrainApiAdapter directly
- HTTP endpoints: HIGH — documented verbatim from adapter source
- Account scoring: HIGH — algorithm read directly from source
- Pitfalls: HIGH — all identified from comparing blog inline client vs ported client + test suite review
- Test strategy: HIGH — external test files read in full; blog test files read for impact analysis

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (DinoRank API endpoints could change; revalidate if generation fails)
