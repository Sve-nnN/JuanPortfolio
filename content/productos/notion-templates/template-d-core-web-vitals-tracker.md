# Template D: Core Web Vitals Monitoring Tracker (EN/ES)

> **Precio:** $19 USD
> **Idioma:** Bilingüe (campos en inglés, documentación en inglés y español)
> **Páginas de Notion:** 2 bases de datos
> **Tiempo de creación:** 3-4 horas

---

## Objetivo

Un dashboard ligero y práctico para monitorear Core Web Vitals por URL, detectar degradaciones de performance, y mantener un log de acciones de optimización. Diseñado para developers que necesitan trackear performance como parte de su workflow.

---

## Base de Datos 1: "CWV Monitor"

### Columnas

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Page URL` | Title | — |
| `Page Type` | Select | Home / Blog Post / Product / Category / Landing / Other |
| `Device` | Select | Mobile / Desktop |
| `LCP (ms)` | Number | Largest Contentful Paint |
| `LCP Status` | Formula | `if(prop("LCP") <= 2500, "✅ Good", if(prop("LCP") <= 4000, "⚠️ Needs Improvement", "🔴 Poor"))` |
| `CLS` | Number | Cumulative Layout Shift |
| `CLS Status` | Formula | `if(prop("CLS") <= 0.1, "✅ Good", if(prop("CLS") <= 0.25, "⚠️ Needs Improvement", "🔴 Poor"))` |
| `INP (ms)` | Number | Interaction to Next Paint |
| `INP Status` | Formula | `if(prop("INP") <= 200, "✅ Good", if(prop("INP") <= 500, "⚠️ Needs Improvement", "🔴 Poor"))` |
| `TTFB (ms)` | Number | Time to First Byte |
| `TTFB Status` | Formula | `if(prop("TTFB") <= 800, "✅ Good", if(prop("TTFB") <= 1800, "⚠️ Needs Improvement", "🔴 Poor"))` |
| `Performance Score` | Number | Lighthouse score (0-100) |
| `Data Source` | Select | CrUX (Field) / Lighthouse (Lab) / GSC / Manual |
| `Date Measured` | Date | — |
| `Previous LCP` | Number | Para comparar con medición anterior |
| `LCP Delta` | Formula | `prop("LCP") - prop("Previous LCP")` — negativo = mejora, positivo = empeoró |
| `Previous CLS` | Number | — |
| `CLS Delta` | Formula | — |
| `Previous INP` | Number | — |
| `INP Delta` | Formula | — |
| `Health Score` | Formula | Puntaje compuesto: 3 puntos si LCP Good, 2 si CLS Good, 2 si INP Good, etc. |

### Vistas

1. **"All URLs — By Status"** — Agrupado por Health Score (Poor / Needs Improvement / Good)
2. **"Mobile — Needs Work"** — Filtro: Device = Mobile, cualquier métrica en Poor o Needs Improvement
3. **"Performance Over Time"** — Calendar view por Date Measured
4. **"LCP Trends"** — Table view: sorted by LCP Delta ASC (mejoras primero)

---

## Base de Datos 2: "Optimization Action Log"

### Columnas

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Action` | Title | Descripción de la optimización |
| `Page URL` | Relation | → CWV Monitor |
| `Metric Affected` | Multi-select | LCP / CLS / INP / TTFB / Score |
| `Category` | Select | Images / JavaScript / CSS / Fonts / Server / Third-Party / HTML / Other |
| `Before Value` | Number | Valor de la métrica antes |
| `After Value` | Number | Valor de la métrica después |
| `Improvement` | Formula | `prop("Before Value") - prop("After Value")` |
| `Improvement %` | Formula | `round((prop("Before Value") - prop("After Value")) / prop("Before Value") * 10000) / 100` |
| `Code Change` | Code Block (Text) | Fragmento de código o config |
| `Date Applied` | Date | — |
| `Verified` | Checkbox | Si la mejora fue verificada con nueva medición |
| `Notes` | Text | — |

### Vistas

1. **"Optimizations — By Category"** — Board agrupado por Category
2. **"Biggest Wins"** — Table: sorted by Improvement % DESC
3. **"Pending Verification"** — Filtro: Verified = false

---

## Datos Pre-cargados

10 ejemplos de URLs con datos de CWV realistas:

| URL | LCP | CLS | INP | Score |
|-----|-----|-----|-----|-------|
| / | 2.1s | 0.05 | 85ms | 92 |
| /blog/post-1 | 3.8s | 0.12 | 210ms | 68 |
| /products | 1.8s | 0.02 | 45ms | 97 |
| /category/tech | 4.5s | 0.08 | 180ms | 55 |
| /about | 1.5s | 0.01 | 60ms | 99 |
| /blog/post-2 | 3.2s | 0.18 | 340ms | 62 |
| /landing/sale | 5.1s | 0.22 | 420ms | 41 |
| /contact | 1.2s | 0.03 | 50ms | 98 |
| /blog/post-3 | 2.9s | 0.07 | 120ms | 78 |
| /search | 3.5s | 0.10 | 250ms | 65 |

5 ejemplos de acciones de optimización pre-cargadas:

1. Comprimí imágenes hero de PNG a WebP — LCP: 4.5s → 2.1s (mejora: 53%)
2. Añadí `width` y `height` explícitos a imágenes del blog — CLS: 0.22 → 0.05 (mejora: 77%)
3. Cambié font-display de `swap` a `optional` — LCP: 3.8s → 2.9s (mejora: 24%)
4. Implementé code splitting para bundle de analytics — INP: 420ms → 180ms (mejora: 57%)
5. Migré imágenes a CDN — TTFB: 1200ms → 350ms (mejora: 71%)

---

## Documentación Incluida

1. **"Core Web Vitals: Guía de Campo"** (ES) — Explicación práctica de cada métrica
2. **"Core Web Vitals: Field Guide"** (EN) — Lo mismo en inglés
3. **"Optimization Checklist"** — 30 acciones concretas con fragmentos de código para Next.js
4. **"How to Connect GSC Data"** — Guía para importar datos de Core Web Vitals desde Search Console
5. **"Threshold Reference Card"** — Tarjeta rápida con los umbrales oficiales de Google (imprimible)
