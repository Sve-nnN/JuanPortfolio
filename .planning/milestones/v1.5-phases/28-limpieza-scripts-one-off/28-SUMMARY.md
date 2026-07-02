# Phase 28 (SCRIPT-01): Limpieza de scripts one-off — Summary

**Completado:** 2026-06-26

## Qué se hizo

Eliminados 12 scripts one-off/debug/setup ya aplicados (grupos A+B) y podadas sus entradas del catálogo TUI (`src/scripts/utils/registry.ts`).

### Scripts borrados (12)

**Grupo A (fixes aplicados + debug):**
fix-test-post-author, inspect-test-post, fix-user-slugs, delete-loop-redirects, debug-content, debug-dino, fix-registry, cleanup-registry, fix-categories

**Grupo B (setup/migración one-off):**
assign-categories, setup-english-simple, setup-english-dinorank-account

### Entradas de registry podadas (3)

Solo 3 de los 12 tenían entrada en el TUI; las demás nunca estuvieron catalogadas:
- `delete-loop-redirects`
- `fix-user-slugs`
- `debug-content`

Confirmado: `grep` de cada uno de los 12 nombres en `registry.ts` → 0 referencias colgantes. `registry.ts` sigue siendo TS válido (tsc sin errores nuevos).

## Verificación de imports (pre-borrado)

`grep -rnE "(from|import).*<name>"` en `src/` (excluyendo el propio archivo y `registry.ts`) → 0 imports vivos para los 12. Ningún script vivo (package.json, grupo C, o soporte) los importa como módulo. Las únicas referencias eran strings en `registry.ts`.

## Scripts saltados

Ninguno. Los 12 candidatos no tenían imports vivos, así que todos se borraron según lo planeado.

## Resultados

- **tsc:** `pnpm exec tsc --noEmit` → **114 errores** (sin cambio, igual que baseline). 0 errores referencian scripts borrados.
- **vitest:** `pnpm exec vitest run` → **776 passed, 0 failed (90 archivos)**.
  - Nota: el conteo bajó de 779 a 776 porque 3 casos de test en `tests/unit/scripts/tui.test.ts` (`buildCommand: scripts sin parámetros`) afirmaban contra las 3 entradas de registry que se podaron. Esos 3 tests quedaron obsoletos al borrar sus scripts; se removieron del array `noParamScripts`. La baja de 3 es exactamente la esperada por la poda, no una regresión.

## Grupo C (intacto)

Confirmado que los 11 scripts del grupo C siguen existiendo: validate-accounts, verify-authors, update-author-profile, identify-short-posts, validate-post, quick-research, search-keyword, test-email, update-seo-metrics, generate-gaps, rewrite-post.

## Archivos tocados

- 12 archivos borrados: `src/scripts/{...}.ts`
- `src/scripts/utils/registry.ts` (3 entradas podadas)
- `tests/unit/scripts/tui.test.ts` (3 casos obsoletos removidos)
