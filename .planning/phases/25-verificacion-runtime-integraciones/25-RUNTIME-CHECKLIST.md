# Checklist runtime de integraciones del admin — v1.5 Fase 25 (GATE)

**Objetivo:** confirmar con credenciales reales qué integraciones funcionan ANTES de borrar código en fases 26-30. Marcá cada una **funcional / rota / a-conservar** y anotá evidencia.

**Setup:** `pnpm dev` → entrá al admin (`/admin`) logueado.

> Regla del gate: ninguna fase 26-30 toca código de una integración marcada **funcional** o **a-conservar**. Solo se considera borrado el código de integraciones marcadas **rota Y sin valor** (decisión tuya).

---

## 1. Ahrefs — Domain Rating

**Qué probar:**
- Entrá al dashboard del admin (`/admin`). Arriba debe verse el card **Domain Rating** (`DomainRatingCard`).
- ¿Muestra un número de DR real o un error/placeholder?
- Opcional (terminal): `curl -s localhost:3000/api/domain-rating` → ¿200 con `domainRating`?

**Código dependiente:** `src/app/api/domain-rating/route.ts`, `src/components/admin/DomainRatingCard.tsx`. (Necesita API key Ahrefs / MCP.)

**Veredicto:** ☐ funcional ☐ rota ☐ a-conservar
**Evidencia:** _________________________

---

## 2. DinoRank — botón "Redactar"

**Qué probar:**
- Abrí un Post en el admin. En el sidebar, el botón **DinoRank** (`DinoRankWriteButton`).
- Tocalo. ¿Dispara la acción contra `/api/dinorank/redactar` y responde, o falla (login/credenciales)?

**Código dependiente:** `src/app/api/dinorank/redactar/route.ts`, `src/components/admin/DinoRankWriteButton.tsx`, `src/scripts/dinorank/*`, `src/scripts/scrape-dinorank.ts`. (Caveat conocido: login de cuenta DinoRank.)

**Veredicto:** ☐ funcional ☐ rota ☐ a-conservar
**Evidencia:** _________________________

---

## 3. Indexing API (Google)

**Qué probar:**
- En un Post o Page, el campo **IndexingControl** (sidebar). Botón "Check Status" / "Request Indexing".
- ¿Devuelve estado de indexación real o error de credenciales?

**Código dependiente:** `src/app/api/seo/indexing/route.ts`, `src/components/admin/IndexingControl.tsx` (Posts/Pages/Categories). (Necesita creds Indexing API.)

**Veredicto:** ☐ funcional ☐ rota ☐ a-conservar
**Evidencia:** _________________________

---

## 4. GSC (Search Console)

**Qué probar:**
- Dashboard admin: card **GSC Summary** (`GSCSummary`) + nav link **GSC Dashboard** (`/admin/gsc-dashboard`).
- ¿Cargan datos? Abrí un Post → tab **Search Console** (`GSCField`): ¿muestra performance?
- Opcional (terminal): `pnpm sync:gsc` → ¿importa datos a `gsc-metrics` o falla por OAuth?

**Código dependiente:** `GSCSummary/GSCDashboard/GSCDashboardLink/GSCField/GSCCell/GSCAnalysis/GSCChart/GSCPerformanceView`, colecciones `gsc-metrics`/`page-metrics`, `src/scripts/seo/sync-gsc.ts`. (Necesita OAuth GSC — caveat de memoria: gsc-* MCP es Juan-only.)

**Veredicto:** ☐ funcional ☐ rota ☐ a-conservar
**Evidencia:** _________________________

---

## Resultado del gate

| Integración | Veredicto | Acción para fases 26-30 |
|-------------|-----------|--------------------------|
| Ahrefs DR | | |
| DinoRank | | |
| Indexing | | |
| GSC | | |

**Firma (Juan):** _______  **Fecha:** _______

> Nota: las fases 26-30 NO tocan ninguno de estos archivos salvo que marques una integración como rota-y-descartable y lo decidas explícitamente. El target de limpieza confirmado por la auditoría (plugin SEO fantasma, `domains/`, backups, scripts one-off) es independiente de estas 4 integraciones.
