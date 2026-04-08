# Phase 6 — Context: DinoBrain HTTP API Integration for Post Creation

## Summary

Replace the Playwright-based DinoBrain automation in `create-post.ts` (BrainState state machine) with the pure HTTP `DinoBrainApiAdapter` already battle-tested in the standalone `seo-content-engine` repo (branch `release/v1.3-milestone`). Add first-class parameters for country, language, site type, domain, and word count. Extend the DinoRank accounts registry schema to support the new fields required by the adapter.

---

## Source Repo Reference

- **Repo:** `https://github.com/Sve-nnN/seo-content-engine`
- **Branch:** `release/v1.3-milestone`
- **Key files to port:**

| Source file | Role | Target in blog |
|---|---|---|
| `src/services/DinoRankApiClient.ts` | HTTP client (login, get, post, logout, cookie jar, extractContentCredits) | `src/scripts/dinorank/DinoRankApiClient.ts` |
| `src/services/DinoBrainApiAdapter.ts` | Content generation via HTTP; account selection, cooldown, provision | `src/scripts/dinorank/DinoBrainApiAdapter.ts` |
| `src/utils/accountRegistry.ts` | loadRegistry / saveRegistry / updateAccount / deleteAccount / registerAccount helpers | Merge into / extend `src/scripts/utils/registry.ts` or new `src/scripts/dinorank/accountRegistry.ts` |
| `src/config/engine-prompts.ts` | `WRITING_INSTRUCTIONS`, `CONTENT_EXCLUSIONS` constants | `src/scripts/config/engine-prompts.ts` (already partially present) |

---

## Current State (Blog)

### `src/scripts/create-post.ts`
- Uses a **Playwright** browser (`BrainState` state machine: `NEEDS_LOGIN`, `OVERLAY_VISIBLE`, `BRAIN_INPUT_EMPTY`, etc.)
- Flow: open DinoRank URL → handle overlays → type keyword → wait for generation → scrape result
- Account registry path: `content/dinorank-accounts-registry.json`
- Current account fields: `email`, `password`, `kwCredits`, `contentCredits`, `keywords[]`, `content[]`, `lastUsed`
- Playwright dependency is expensive (binary, slow), fragile to UI changes

### `src/scripts/scrape-dinorank.ts`
- Already pure HTTP (DinoRankApiClient-like logic inline) for **keyword research**
- Shares `content/dinorank-accounts-registry.json`

---

## Target State

### New HTTP adapter flow
```
create-post.ts
  └─ DinoBrainApiAdapter.generate(keyword, KeywordData)
       ├─ loadRegistry() → pick best account (scored by language/country/domain/siteType)
       ├─ DinoRankApiClient.login(language)   POST /ajax/login.php
       ├─ api.get(dinoBrainReferer)            GET /en/dinobrain/ or /dinobrain/
       ├─ api.post /ajax/generaContenido.php  (keyword, context, numPalabras, idioma, pais...)
       ├─ poll /ajax/controlIA.php            until 'finalizado'
       ├─ api.post /ajax/obtieneContenidoGenerado.php
       ├─ extractBodyContent() → JSDOM + TurndownService → Markdown
       └─ api.logout()  POST /ajax/cierra.php
```

### New CLI flags for `pnpm create-post`
| Flag | Default | Forwarded to |
|---|---|---|
| `--country=ES` | `es` (from keyword metadata) | `keyword_pais`, `pais` in body params |
| `--language=es` | `es` | `keyword_idioma`, `idioma`, selects DinoBrain URL |
| `--site-type=nicho` | `nicho` | `toProjectType()` → account scoring |
| `--domain=juan-tech.com` | (none) | `normalizeDomain()` → account scoring |
| `--words=2000` | `2000` | `numPalabras` body param |

### New account registry fields
| Field | Type | Purpose |
|---|---|---|
| `createdLanguage` | `'es' \| 'en'` | Language of DinoRank project at creation time |
| `createdCountry` | `string` (2-char) | Country code at creation time |
| `createdDomain` | `string` | Domain the account was created for |
| `createdProjectType` | `string` | `nicho`, `negociolocal`, `ecommerce`, `producto` |
| `assignedClientId` | `string?` | Optional client binding |
| `cooldownUntil` | `ISO string?` | After a generation, account is cooled 5 min |

---

## DinoBrain HTTP Endpoints

| Method | URL | Purpose |
|---|---|---|
| `GET` | `/dinobrain/` (ES) or `/en/dinobrain/` (EN) | Init session, extract content credits |
| `POST` | `/ajax/generaContenido.php` | Start generation. Body: `keyword`, `contexto`, `exclusiones`, `numPalabras`, `keyword_idioma`, `idioma`, `keyword_pais`, `pais`, `imagenes`, `t` |
| `POST` | `/ajax/controlIA.php` | Poll for completion. Body: `idContenido`, `t` |
| `POST` | `/ajax/obtieneContenidoGenerado.php` | Retrieve generated HTML. Body: `id`, `modo`, `keyword`, `t` |

---

## Key Design Decisions to Make at Plan Time

1. **Where to put the ported files**: new `src/scripts/dinorank/` subfolder vs inline in existing scripts.
2. **Account registry migration**: existing entries lack `createdLanguage` etc — need migration helper that backfills defaults (`es`, no country, no domain) without breaking existing scrape-dinorank logic.
3. **`jsdom` + `turndown` dependencies**: already in `package.json`? If not, add them. The `extractBodyContent` method requires both.
4. **`BrainState` Playwright block removal**: decide whether to keep it behind a `--playwright` flag for fallback or remove entirely.
5. **Sharing `DinoRankApiClient`**: `scrape-dinorank.ts` has its own inline HTTP client. Should they share `DinoRankApiClient` from the new `src/scripts/dinorank/` layer, or stay independent (less risk of regression)?

---

## Test Coverage Required

- Unit: `DinoBrainApiAdapter` — mock `DinoRankApiClient`, test account selection scoring, cooldown logic, provision fallback
- Unit: `DinoRankApiClient` — mock `fetch`, test login responses, cookie merge, logout
- Unit: account registry helpers — test `loadRegistry` expiry filtering, `updateAccount`, `registerAccount` with new fields
- Integration: `create-post` end-to-end with `--provider=anthropic` mocked — confirm `DinoBrainApiAdapter.generate()` is called with correct params

---

## Dependencies to Verify

```
jsdom           (extractBodyContent JSDOM parsing)
turndown        (HTML → Markdown conversion)
```

Check `package.json` — if absent, add to `devDependencies` (CLI scripts, not frontend bundle).

---

## Files That Will Change

1. `src/scripts/create-post.ts` — remove BrainState Playwright block, add CLI flags, wire adapter
2. `src/scripts/dinorank/DinoRankApiClient.ts` — NEW (ported)
3. `src/scripts/dinorank/DinoBrainApiAdapter.ts` — NEW (ported + adapted to blog context)
4. `src/scripts/dinorank/accountRegistry.ts` — NEW or MERGED (registry helpers with new fields)
5. `src/scripts/config/engine-prompts.ts` — add/verify `WRITING_INSTRUCTIONS`, `CONTENT_EXCLUSIONS`
6. `content/dinorank-accounts-registry.json` — schema migration (add missing fields to existing entries)
7. `CLAUDE.md` — document new CLI flags
8. Tests: add/update unit tests for all new modules

> This is 8 files — larger than the 3-file rule in CLAUDE.md. Plan accordingly by splitting into 5 sub-plans (06-01 through 06-05), each touching at most 2-3 files.
