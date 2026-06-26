# Phase 26: Retirada del plugin SEO fantasma (CLEAN-01) - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminar el plugin SEO casero nunca registrado (`src/plugins/seo/`), reubicando los 4 módulos vivos a `src/utilities/seo/` y actualizando sus consumidores. Sin tocar el plugin SEO oficial (`@payloadcms/plugin-seo`) ni las integraciones del gate (fase 25).

</domain>

<decisions>
## Implementation Decisions

- **Reubicar a `src/utilities/seo/`** (convención: `src/utilities/` ya existe). Los 4 módulos vivos:
  - `utils/seoAnalyzer.ts` (+ `.test.ts`) → `src/utilities/seo/seoAnalyzer.ts`
  - `utils/keywordCoverageAudit.ts` (+ `.test.ts`) → `src/utilities/seo/keywordCoverageAudit.ts`
  - `fields/seoFields.ts` → `src/utilities/seo/seoFields.ts`
  - `types/keywordScore.ts` → `src/utilities/seo/keywordScore.ts`
- **Borrar** todo lo demás de `src/plugins/seo/`: `index.ts`, `endpoints/*`, `components/*` (SEOHead, SEOAnalysisField, SEOScoreField, CharacterCounter), `hooks/*`, `utils/schemaGenerator.ts`.
- **Actualizar consumidores VIVOS** (imports):
  - `src/app/api/seo/keyword-score/route.ts`
  - `src/app/api/seo/keyword-coverage/route.ts`
  - `src/components/admin/KeywordScorePanel.tsx`
  - `src/components/admin/KeywordCoverageView.tsx`
  - `src/scripts/audit-keywords.ts`
  - `src/collections/Categories.ts`
  - `src/collections/Users/index.ts`
- **Consumidores muertos** (NO actualizar, se borran en fase 27/CLEAN-03): `src/domains/user/domain/User.ts`, `src/domains/content/categories/domain/Category.ts`, `src/collections/Users/index.ts.backup`, y `src/plugins/seo/components/SEOHead.tsx` (se borra en esta fase). Pueden generar errores TS transitorios hasta la fase 27 — verificación final de tsc verde se hace tras 27.

### Claude's Discretion
- Mantener test files junto a los módulos reubicados; ajustar paths de import en los tests + `vitest.config.mts` si hace falta.

</decisions>

<code_context>
## Existing Code Insights

- `src/plugins/seo/index.ts` NO se registra (config usa `@payloadcms/plugin-seo` en `src/plugins/index.ts`).
- 4 módulos vivos confirmados por `.planning/admin-audit-v1.5.md` §anexo.
- Consumidores vivos: 7 archivos (arriba). `natural` server-side debe seguir confinado (el cliente importa solo tipos de keywordScore).
- Tests: `seoAnalyzer.test.ts` (27) + `keywordCoverageAudit.test.ts` (7+); `vitest.config.mts` incluye `src/**/*.test.ts`.
- Baseline tsc: 114 errores preexistentes. Tests: 775+.

### HALLAZGO para fase 27
- Existen DOS árboles de andamiaje: `src/domains/**` (content, user) Y `src/domain/**` (author, caseStudy). La auditoría solo cubrió `domains/`. Fase 27 debe auditar ambos.

</code_context>

<specifics>
## Specific Ideas
- No tocar `@payloadcms/plugin-seo` ni `src/plugins/index.ts` (registro oficial).
- Mantener `natural` fuera del bundle del admin.
</specifics>

<deferred>
## Deferred Ideas
- Borrado de `domains/`/`domain/` y backups → fase 27.
</deferred>
