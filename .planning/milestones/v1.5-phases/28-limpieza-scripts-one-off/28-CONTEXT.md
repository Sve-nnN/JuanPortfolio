# Phase 28: Limpieza de scripts one-off (SCRIPT-01) - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminar los scripts one-off/fix/debug/setup ya aplicados (grupos A+B), incluyendo podar sus entradas del catálogo TUI (`src/scripts/utils/registry.ts`). Conservar los scripts cableados en package.json, su soporte (`scripts/services|seo|sync|internal-linking|engine|dinorank`), y las utilidades ocasionales del grupo C.

</domain>

<decisions>
## Implementation Decisions

**Borrar (grupo A — fixes aplicados + debug):**
`fix-test-post-author`, `inspect-test-post`, `fix-user-slugs`, `delete-loop-redirects`, `debug-content`, `debug-dino`, `fix-registry`, `cleanup-registry`, `fix-categories`

**Borrar (grupo B — setup/migración one-off):**
`assign-categories`, `setup-english-simple`, `setup-english-dinorank-account`

**Conservar (grupo C — utilidades ocasionales):** validate-accounts, verify-authors, update-author-profile, identify-short-posts, validate-post, quick-research, search-keyword, test-email, update-seo-metrics, generate-gaps, rewrite-post. NO tocar.

**Por cada script borrado:**
1. `git rm src/scripts/<name>.ts`
2. Podar su entrada en `src/scripts/utils/registry.ts` (id/baseCommand/examples) para que el TUI no apunte a archivos inexistentes.
3. Antes de borrar, confirmar que ningún script VIVO (package.json o grupo C o soporte) lo importa como módulo. Las únicas refs conocidas son entradas string en registry.ts.

### Claude's Discretion
- Si algún script A/B resulta importado por un script vivo (no esperado), NO borrarlo y reportarlo.

</decisions>

<code_context>
## Existing Code Insights

- Scripts cableados en package.json (NO tocar): audit-keywords, audit-urls, create-post, export-keywords-csv, fetch-redirects, fix-internal-links, populate-keywords, scrape-dinorank, seo/sync-gsc, syncContent, syncKeywords, utils/tui.
- `src/scripts/utils/registry.ts` cataloga scripts para el TUI `pnpm utils` con `id`/`baseCommand`/`examples` (refs string, no imports).
- Candidatos A+B: imports vivos = 0 (solo refs en registry.ts), confirmado por grep.
- Verificación: `pnpm exec tsc --noEmit` == 114 (sin cambios), tests 779 verdes, `pnpm utils` (registry) sin entradas colgantes a archivos borrados.

</code_context>

<specifics>
## Specific Ideas
- No tocar el grupo C ni el soporte bajo `scripts/{services,seo,sync,internal-linking,engine,dinorank}`.
</specifics>

<deferred>
## Deferred Ideas
- Accesos + assets → fase 29 (PAUSA antes, gate 25 pendiente).
</deferred>
