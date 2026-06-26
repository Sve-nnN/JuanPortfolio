# Requirements: JuanPortfolio — Milestone v1.5 (Limpieza y alineación del admin de Payload)

**Defined:** 2026-06-26
**Core Value:** El admin de Payload solo contiene código vivo y coherente: sin plugins fantasma, sin andamiaje abandonado, sin scripts one-off muertos; accesos endurecidos, assets con una sola fuente, y consistencia visual/bilingüe en el menú y los campos.

**Entrega:** Repo más liviano y legible — eliminado el código muerto del admin verificado en `.planning/admin-audit-v1.5.md`, con las integraciones vivas confirmadas en runtime antes de borrar nada dependiente, accesos de colecciones de métricas restringidos, estrategia de assets unificada, y el menú/labels del admin consistentes.

**Inventario base (recon 2026-06-26):** `.planning/admin-audit-v1.5.md` — los 21 componentes de `src/components/admin/` están vivos; el código muerto está en `src/plugins/seo/` (plugin casero nunca registrado), `src/domains/**` (DDD abandonado), backups/re-exports huérfanos y scripts one-off.

## v1 Requirements

### VERIFY — Verificación runtime de integraciones (gate previo)

- [ ] **VERIFY-01**: Existe un checklist runtime reproducible (doc + pasos en `pnpm dev`) que confirma el estado real de Ahrefs (`/api/domain-rating`), DinoRank (`/api/dinorank/redactar`), Indexing API (`IndexingControl`) y GSC (dashboard/OAuth); cada integración queda marcada funcional / rota / a-conservar antes de borrar código dependiente

### CLEAN — Eliminación de código muerto

- [x] **CLEAN-01**: El plugin SEO casero muerto (`src/plugins/seo/index.ts`, `endpoints/*`, `components/*`, `hooks/*`, `utils/schemaGenerator.ts`) se elimina, conservando y reubicando los 4 módulos vivos (`seoAnalyzer`, `keywordCoverageAudit`, `seoFields`, `keywordScore`) sin romper sus consumidores (API routes, KeywordScorePanel, audit)
- [x] **CLEAN-02**: El árbol `src/domains/**` se colapsa: `ad-banners/domain/AdBanner.ts` se mueve a `src/collections/` y el resto (Category/User/Post duplicados, repos, use-cases, hooks) se elimina, con la config de Payload apuntando al nuevo path
- [x] **CLEAN-03**: Se eliminan los leftovers huérfanos `src/collections/Users/index.ts.backup` y `src/collections/AdBanners/index.ts` (re-export sin consumidores)

### SCRIPT — Limpieza de scripts

- [ ] **SCRIPT-01**: Se eliminan los scripts one-off/debug ya aplicados (p.ej. `fix-test-post-author`, `inspect-test-post`, `fix-user-slugs`, `delete-loop-redirects`, `debug-*`), tras verificar caso a caso los ambiguos; los scripts cableados en `package.json` y su soporte (`scripts/services|seo|sync|...`) se conservan

### SEC — Endurecimiento de accesos

- [ ] **SEC-01**: Las colecciones `keyword-metrics`, `page-metrics` y `gsc-metrics` dejan de tener `access` abierto (`() => true` con TODO "restrict in production"); create/update (y read donde corresponda) se restringen a `authenticated` o al secret del cron

### ASSET — Estrategia de assets

- [ ] **ASSET-01**: Se decide una sola fuente de assets (Vercel Blob o Cloudinary) y se elimina la redundante de la colección Media (botones/endpoint Cloudinary o la config de Blob), sin romper imágenes existentes

### CONSIST — Consistencia del admin

- [ ] **CONSIST-01**: Las 4 colecciones de métricas (`keyword-metrics`, `page-metrics`, `gsc-metrics`, `broken-links`) usan `group: 'SEO'` consistente en el menú lateral
- [ ] **CONSIST-02**: Los labels del admin (colecciones, tabs como "Search Console"/"Internal Links"/"Meta", campos) usan objetos bilingües `{ en, es }` de forma consistente con la localización del proyecto
- [ ] **CONSIST-03**: Los nav links custom (`GSCDashboardLink`, `KeywordCoverageLink`) usan iconos/tokens del design system de Payload en vez de emoji inline y estilos hardcodeados

## Future Requirements

<!-- Diferido. -->

- Refactor profundo de `src/scripts/services|engine` (fuera del foco admin)
- Migración del storage de assets en sí (más allá de elegir la fuente)
- Tests de integración del admin UI

## Out of Scope

<!-- Excluido. -->

- Tocar componentes de `src/components/admin/` que están vivos (no hay muertos ahí)
- Rediseño visual del admin más allá de consistencia de menú/labels/nav
- Cambiar la funcionalidad de las integraciones (solo verificar + no romper)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VERIFY-01 | Phase 25 | Pending |
| CLEAN-01 | Phase 26 | Complete |
| CLEAN-02 | Phase 27 | Complete |
| CLEAN-03 | Phase 27 | Complete |
| SCRIPT-01 | Phase 28 | Pending |
| SEC-01 | Phase 29 | Pending |
| ASSET-01 | Phase 29 | Pending |
| CONSIST-01 | Phase 30 | Pending |
| CONSIST-02 | Phase 30 | Pending |
| CONSIST-03 | Phase 30 | Pending |
</content>
