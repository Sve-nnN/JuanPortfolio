# Phase 27: Colapso de domains/ y leftovers huérfanos (CLEAN-02, CLEAN-03) - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Colapsar los árboles de andamiaje DDD abandonados (`src/domains/**` y `src/domain/**`), moviendo el único módulo vivo (AdBanner) a `src/collections/`, y eliminar los leftovers huérfanos (backup + re-export). Resultado: tsc vuelve al baseline 114 (se van los +2 errores transitorios de la fase 26).

</domain>

<decisions>
## Implementation Decisions

- **Mover AdBanner:** `src/domains/content/ad-banners/domain/AdBanner.ts` → `src/collections/AdBanners/index.ts` (reemplaza el re-export huérfano actual). Ajustar imports relativos de access (`../../../../access/` → `../../access/`). AdBanner solo importa payload types + `authenticated`/`authenticatedOrPublished` (sin deps de domains/), así que el move es limpio.
- **Repuntar `src/payload.config.ts`:** línea 21 import `from './domains/content/ad-banners/domain/AdBanner'` → `from './collections/AdBanners'` (y verificar usos en :130 `AdBannersCollection` y :175 `[AdBannersCollection.slug]`). Mantener el nombre export `AdBannersCollection` para no tocar :130/:175, o ajustar ambos.
- **Borrar `src/domains/**` completo** (28 archivos) tras mover AdBanner. Nada más vivo lo importa.
- **Borrar `src/domain/**` completo** (singular: author/caseStudy, 6 archivos). CERO importers fuera de sí mismo → andamiaje muerto.
- **Borrar leftovers (CLEAN-03):** `src/collections/Users/index.ts.backup`. (El re-export `src/collections/AdBanners/index.ts` se sobreescribe con el AdBanner real, no queda huérfano.)

### Claude's Discretion
- Si conviene `src/collections/AdBanners/index.ts` vs `src/collections/AdBanners.ts` (preferir mantener el dir existente → index.ts).

</decisions>

<code_context>
## Existing Code Insights

- `src/payload.config.ts:21,130,175` — único consumidor vivo de AdBanner (export `AdBannersCollection`).
- `src/collections/AdBanners/index.ts` — re-export huérfano actual (nadie lo importa); se reemplaza por la colección real.
- `src/domains/**` (28 files) y `src/domain/**` (6 files) — sin importers vivos salvo AdBanner.
- Tras fase 26 hay +2 errores tsc transitorios en `src/domains/content/categories/domain/Category.ts` y `src/domains/user/domain/User.ts` (import de seoFields ya movido) — se resuelven al borrar `domains/`.
- Baseline tsc objetivo final: 114. Tests: 779.

</code_context>

<specifics>
## Specific Ideas
- Verificación final: tsc == 114 (sin los +2), `grep -rn "plugins/seo" src` == 0, `grep -rn "domains/\|/domain/" src` sin refs vivas, tests verdes, importmap regenerado si aplica.
</specifics>

<deferred>
## Deferred Ideas
- Scripts one-off → fase 28.
</deferred>
