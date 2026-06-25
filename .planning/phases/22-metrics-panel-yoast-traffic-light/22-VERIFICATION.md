---
status: human_needed
phase: 22
verified: 2026-06-25
score: 6/6 requirements implemented; visual runtime check pending
---

# Phase 22 Verification — Metrics panel + Yoast traffic light

## Success Criteria (goal-backward)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Sidebar muestra volume/difficulty/intent/opportunityScore de keyword-metrics | ✅ code | `KeywordScorePanel.tsx` fetch `/api/keyword-metrics/:id`; render métricas (METRICS-01) |
| 2 | Estado claro "sin datos" / sin keyword sin romper editor | ✅ code | 4 estados (no-keyword CTA / keyword-no-metrics / loading-error / scored); fix M2-03 cerró el "Calculando…" eterno (METRICS-02) |
| 3 | Semáforo verde/ámbar/rojo por 7 checks (title/meta/H1/slug/densidad/primer-párrafo/subtítulos) | ✅ code | `analyzeKeywordChecks` en seoAnalyzer.ts; ●/◐/○ forma+texto+color (SCORE-01) |
| 4 | Feedback accionable por check, sobre seoAnalyzer.ts | ✅ code | mensajes bilingües por check; lógica extiende seoAnalyzer (SCORE-02) |
| 5 | Score global 0-100 ponderado con badge de color | ✅ code | pesos suman 100 (title20/H1 20/meta15/densidad15/slug10/párrafo10/subt10); verde≥80/ámbar50-79/rojo<50 (SCORE-03) |
| 6 | Recálculo en vivo sin publicar (debounce ~300ms) | ✅ code | POST debounced a `/api/seo/keyword-score`; reconstruye árbol con getData() keyed en fields (SCORE-04) |

## Build / tests

- `pnpm exec vitest run`: 768 passed / 89 files (27 analyzer tests).
- `pnpm exec tsc --noEmit`: 114 baseline, 0 nuevos en archivos tocados.
- `payload generate:importmap`: KeywordScorePanel registrado.
- `natural` confirmado server-side only (cliente solo importa tipos; única mención en comentario).

## Code review

REVIEW.md → `status: clean`. 1 High + 4 Medium + 5 Low, todos resueltos (commits 8a94cc9, fe3df7f, 2465bc8). Destacado: H1-01 (extracción de contenido en Pages) corregido con getData(); M3-04 (H1 falso verde) eliminado el fallback al título; M1-02 semántica de match unificada (frase contigua stemmed).

## PENDING — Human visual verification (no automatizable)

Los tests no levantan el form-state real de Payload. Verificar en `pnpm dev` → admin:

1. **Post**: asignar keyword con métricas → métricas + 7 checks + score con color.
2. **Page** (contenido en bloques): editar texto dentro de un block → el semáforo recalcula (densidad/primer-párrafo/subtítulos NO siempre rojo; era el bug H1-01).
3. **Estado sin keyword**: CTA "asigná una keyword".
4. **Estado keyword sin métricas**: "sin datos" + checks igual corren.
5. **Recálculo en vivo**: editar title/meta/content sin guardar → score cambia (~300ms).
6. **i18n**: toggle locale admin es/en.
7. **Accesibilidad**: semáforo legible en escala de grises (forma+texto, no solo color).
8. **Layout** sidebar angosto sin desbordes.

## Verdict

**HUMAN_NEEDED** — 6/6 requisitos implementados y verificados a nivel código/tests; falta confirmación visual en admin corriendo (puntos 1-8).
