---
phase: 23-coverage-audit
reviewed: 2026-06-26
depth: deep
files_reviewed: 7
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: clean
resolved:
  warnings: [WR-01, WR-02, WR-03, WR-04]
  info: [IN-03, IN-04]
deferred:
  info: [IN-01, IN-02]
---

# Phase 23: Keyword Coverage Audit — Code Review

**Status:** clean por severidad (0 Critical/High); 4 Warnings + 4 Info abiertas (se corrigen las 4 Warnings + IN-03/IN-04 por afectar correctness/consistencia del audit).

## Confirmado OK
- `natural` default-import (30bc0ac) seguro en tsc (esModuleInterop) y runtime (tsx/webpack/vitest); stemming es/en con regresión cubierta. Sin regresión Fase 22.
- Paridad de extracción con keyword-score (posts richText / pages blocks), null-safe.
- N/A bucketing correcto (listados no fallan por checks de contenido; ámbar = warning, no cambia bucket). Tests 4-6.
- `natural` server-side only; vista importa solo tipos + CHECK_LABELS.
- Endpoint auth-gated, 500 genérico, GET read-only.

## Warnings (a corregir)
- **WR-01** `KeywordCoverageView.tsx:63-86` — race stale sin AbortController al toggle es/en o refresh rápido; posible setState tras unmount. Fix: AbortController + ignorar respuestas superseded.
- **WR-02** `keywordCoverageAudit.ts:184-189` — `limit: 1000` por colección trunca en silencio; subreporta cobertura al crecer. Fix: paginar o exponer flag `truncated` en reporte + vista + script.
- **WR-03** `audit-keywords.ts:163-164` — exit 1 siempre porque listados (users/categorías) rara vez tienen keyword → CI permanentemente rojo. Fix: contar solo gaps de post/page para el exit code (listados siguen en el reporte).
- **WR-04** `keywordCoverageAudit.ts:145-152` — relación colgante / id sin poblar se bucketea como `noKeyword` (falso positivo). Fix: estado `unresolvedKeyword` distinto.

## Info
- IN-01 `score` engañoso para listados (5 checks N/A → score bajo); hoy no se muestra. (deferred)
- IN-02 title-N/A diverge de la fuente del analyzer (meta.title||title); no alcanzable hoy. (deferred)
- IN-03 `KeywordCoverageLink.tsx:24` link hardcoded en español; vista es bilingüe. (corregir)
- IN-04 `KeywordCoverageView.tsx:56,67` `${serverURL}` puede ser undefined; usar fallback relativo. (corregir)
