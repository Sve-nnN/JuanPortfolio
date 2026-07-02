# Template A: Technical SEO Audit Dashboard (EN)

> **Precio:** $29 USD
> **Idioma:** Inglés
> **Páginas de Notion:** 5 bases de datos interconectadas
> **Tiempo de creación:** 5-6 horas

---

## Objetivo del Template

Darle al usuario (developer, SEO consultant, agency) un sistema completo para ejecutar auditorías técnicas de SEO de principio a fin: desde la detección de issues hasta la generación del informe ejecutivo, todo dentro de Notion.

---

## Estructura Completa

### Base de Datos 1: "Issues Database" (Tabla maestra)

**Columnas y su configuración exacta:**

| Columna | Tipo | Opciones/Configuración | Propósito |
|---------|------|------------------------|-----------|
| `Issue ID` | Formula | `concat("SEO-", formatDate(created, "YYYY"), "-", id)` | Identificador único tipo SEO-2026-001 |
| `Title` | Title | — | Descripción breve del issue |
| `Category` | Select | Crawlability / Indexability / Performance / Schema / Content / Security / International | Categoría técnica |
| `Severity` | Select | 🔴 Critical / 🟠 Warning / 🟡 Info / 🟢 Fixed | Prioridad visual |
| `Status` | Select | Open / In Progress / Fixed / Wont Fix / Duplicate | Estado de resolución |
| `URL Affected` | URL | — | Página(s) afectada(s) |
| `Description` | Text | — | Explicación detallada del problema |
| `How to Fix` | Text | — | Instrucciones técnicas de solución |
| `Code Snippet` | Code Block (Text) | — | Fragmento de código relevante (ej: canonical tag, schema markup) |
| `Evidence` | Files & Media | — | Screenshots de GSC, Lighthouse, Screaming Frog |
| `Date Found` | Date | — | Fecha de detección |
| `Date Fixed` | Date | — | Fecha de resolución |
| `Assigned To` | Person | — | Responsable de arreglarlo |
| `Related Issues` | Relation | → Issues Database | Para agrupar issues relacionados |
| `GSC Data` | Text | — | Datos de Search Console relevantes |
| `Impact Estimate` | Select | High / Medium / Low | Impacto estimado en tráfico/rankings |

**Vistas preconfiguradas:**

1. **"All Issues — By Severity"** (Board view agrupado por Severity + filtro Status ≠ Fixed)
2. **"Open — By Category"** (Board view agrupado por Category + filtro Status = Open)
3. **"Fixed This Month"** (Table view filtrado: Status = Fixed, Date Fixed = este mes)
4. **"My Issues"** (Table view filtrado: Assigned To = current user)
5. **"High Impact — Open"** (Table view: Impact = High, Status ≠ Fixed, sorted by Date Found)

---

### Base de Datos 2: "Crawl Log" (Registro de auditorías)

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Audit Name` | Title | — |
| `Date` | Date | — |
| `Tool Used` | Select | Screaming Frog / Sitebulb / Lumar / Manual |
| `Total URLs Crawled` | Number | — |
| `Indexable URLs` | Number | — |
| `Non-Indexable URLs` | Number | — |
| `Issues Found` | Number | Formula: count de issues de esta auditoría |
| `Issues` | Relation | → Issues Database |
| `Audit Report` | Files & Media | PDF del informe exportado |
| `Notes` | Text | — |

---

### Base de Datos 3: "Competitor Analysis" (Opcional pero incluido)

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Competitor` | Title | Nombre del sitio competidor |
| `Domain` | URL | — |
| `DR / DA` | Number | Domain Rating o Domain Authority |
| `Traffic (est.)` | Number | Tráfico estimado (Ahrefs/Semrush) |
| `Keywords Ranking` | Number | — |
| `Top Pages` | Text | URLs principales |
| `Tech Stack` | Multi-select | Next.js / WordPress / Gatsby / etc. |
| `Strengths` | Text | — |
| `Weaknesses` | Text | — |
| `Last Analyzed` | Date | — |

---

### Base de Datos 4: "Schema Types Inventory"

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Page URL` | URL | — |
| `Schema Type` | Select | Article / BlogPosting / FAQPage / Product / LocalBusiness / Organization / Person / BreadcrumbList / WebPage / Other |
| `Implementation` | Select | JSON-LD / Microdata / RDFa |
| `Status` | Select | Valid / Errors / Missing |
| `Validation URL` | URL | Link al Schema Validator |
| `Notes` | Text | — |
| `Issues` | Relation | → Issues Database |

---

### Base de Datos 5: "Redirect Map"

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Source URL` | URL | — |
| `Destination URL` | URL | — |
| `Type` | Select | 301 / 302 / 307 / 308 |
| `Status` | Select | Active / Planned / Deprecated |
| `Date Implemented` | Date | — |
| `Notes` | Text | — |

---

### Páginas de Documentación Incluidas

1. **"How to Use This Template"** — Guía de 5 pasos con GIFs
2. **"Technical SEO Checklist"** — 50+ items pre-cargados cubriendo:
   - Robots.txt & Sitemaps (8 items)
   - Crawlability & Indexability (10 items)
   - Core Web Vitals — LCP, CLS, INP (9 items)
   - Schema.org & Structured Data (7 items)
   - Canonical & Redirects (6 items)
   - HTTPS & Security (5 items)
   - Hreflang & International SEO (5 items)
   - Content & On-Page (6 items)
3. **"Google Search Console Setup"** — Guía de conexión GSC → Notion
4. **"SEO Tools Reference"** — Lista de herramientas (gratuitas y pagas) con enlaces
5. **"Report Template"** — Template de informe ejecutivo que se puede duplicar para cada cliente

---

## Datos Pre-cargados de Ejemplo

El template incluye 15 issues de ejemplo para que el usuario entienda cómo funciona:

1. Missing meta description — /blog/example — Severity: Warning
2. LCP > 4s — /products/page — Severity: Critical
3. Missing canonical tag — /category/old — Severity: Warning
4. Schema validation errors — /contact — Severity: Critical
5. Mixed content (HTTP images on HTTPS) — /blog/post-1 — Severity: Critical
6. Orphaned page (no internal links) — /landing-page — Severity: Info
7. Missing hreflang tags — /en/* pages — Severity: Warning
8. Duplicate title tags — /blog/1 y /blog/2 — Severity: Warning
9. Slow TTFB (>600ms) — /* — Severity: Warning
10. Broken internal links — 3 URLs — Severity: High
11. XML sitemap not found — — Severity: Critical
12. Robots.txt blocking CSS — — Severity: Critical
13. Missing alt text — 15 images — Severity: Info
14. No FAQ schema on FAQ page — /faq — Severity: Info
15. Redirect chain detected — /old → /middle → /new — Severity: Warning

---

## Fórmulas y Automatizaciones

| Fórmula | Ubicación | Código |
|---------|-----------|--------|
| Issue ID auto-generado | Issues DB | `concat("SEO-", formatDate(prop("Date Found"), "YYYY"), "-", prop("ID"))` |
| Días abierto | Issues DB | `dateBetween(now(), prop("Date Found"), "days")` |
| Alerta de issue crítico > 7 días | Issues DB | `if(and(prop("Severity") == "🔴 Critical", prop("Status") != "Fixed", toNumber(prop("Days Open")) > 7), "⚠️ ESCALATE", "")` |
| Total issues abiertos | Rollup en Crawl Log | `count(issues where Status ≠ Fixed)` |
| Progress % | Formula | `round((count(issues where Status=FIXED) / count(issues)) * 100) / 100` |

---

## Lo que recibe el comprador

1. **Enlace de duplicación de Notion** — Un solo clic para copiar todo el workspace a su cuenta
2. **Video guía de 7 minutos** — Recorrido completo del template, cómo personalizarlo
3. **PDF de 12 páginas** — "Technical SEO Audit Guide" con la metodología de auditoría
4. **Actualizaciones de por vida** — Si se añaden nuevas features, el comprador recibe la actualización
