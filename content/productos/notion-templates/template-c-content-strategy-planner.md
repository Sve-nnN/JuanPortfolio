# Template C: Content Strategy Planner — Topic Clusters Edition (EN)

> **Precio:** $35 USD
> **Idioma:** Inglés
> **Páginas de Notion:** 4 bases de datos interconectadas
> **Tiempo de creación:** 4-5 horas

---

## Objetivo

Darle al usuario un sistema completo para planificar, ejecutar y monitorear una estrategia de contenido basada en topic clusters. Desde la investigación de keywords hasta el seguimiento de performance de cada artículo publicado.

---

## Base de Datos 1: "Keyword Research Database"

### Columnas

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Keyword` | Title | — |
| `Language` | Select | EN / ES / Other |
| `Search Intent` | Select | Informational / Commercial / Transactional / Navigational |
| `Volume` | Number | — |
| `KD (Keyword Difficulty)` | Number | 0-100 |
| `CPC` | Number | Si aplica |
| `Traffic Potential` | Number | TP estimado |
| `Cluster` | Relation | → Content Clusters DB |
| `Target URL` | URL | URL actual o propuesta |
| `Status` | Select | Opportunity / In Content / Published / Ranking / Deprioritized |
| `SERP Features` | Multi-select | AI Overview / Featured Snippet / PAA / Video / Image Pack / Local Pack / None |
| `Current Position` | Number | Posición actual en Google |
| `Target Position` | Number | 1-10 |
| `Top Competitor URL` | URL | — |
| `Competitor Word Count` | Number | — |
| `PAA Questions` | Text | Preguntas de "People Also Ask" |
| `Related Keywords` | Text | Keywords semánticamente relacionadas |
| `Notes` | Text | — |

### Vistas preconfiguradas

1. **"Opportunities — By Intent"** — Board view: Status = Opportunity, agrupado por Intent
2. **"Ranking Tracker"** — Table view: Status = Published/Ranking, sorted by Current Position ASC
3. **"High Volume, Low KD"** — Table view: Volume > 500, KD < 20

---

## Base de Datos 2: "Content Clusters"

### Columnas

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Cluster Name` | Title | — |
| `Type` | Select | Pillar Page / Satellite Page / Standalone |
| `Parent Cluster` | Relation | → Content Clusters DB (self-referential) |
| `Primary Keyword` | Relation | → Keyword Research DB |
| `Description` | Text | — |
| `Status` | Select | Planned / Research / Drafting / In Review / Published / Needs Update |
| `Target Word Count` | Number | — |
| `Actual Word Count` | Number | — |
| `Author` | Person | — |
| `Due Date` | Date | — |
| `Published Date` | Date | — |
| `Last Updated` | Date | — |
| `URL` | URL | — |
| `Internal Links From` | Number | Cuántas páginas enlazan a esta |
| `Internal Links To` | Number | Cuántas páginas enlaza esta |
| `Organic Traffic (30d)` | Number | — |
| `Avg Position` | Number | — |
| `Backlinks` | Number | — |
| `Needs Refresh` | Formula | `if(dateBetween(now(), prop("Last Updated"), "months") > 6, "🔴 REFRESH", "✅")` |

### Vistas

1. **"Cluster Map"** — Board agrupado por Parent Cluster → visualiza la arquitectura pillar-satellite
2. **"Editorial Calendar"** — Calendar view por Due Date
3. **"Content Pipeline"** — Board view agrupado por Status (Kanban editorial)
4. **"Needs Refresh"** — Table view filtrado: Needs Refresh = 🔴 REFRESH

---

## Base de Datos 3: "Internal Linking Matrix"

### Columnas

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Source Page` | Relation | → Content Clusters DB |
| `Target Page` | Relation | → Content Clusters DB |
| `Anchor Text` | Text | — |
| `Link Type` | Select | Contextual / Navigation / Footer / Sidebar |
| `Relevance` | Select | High / Medium / Low |
| `Status` | Select | Implemented / Planned / Removed |
| `Date Added` | Date | — |

---

## Base de Datos 4: "Content Performance Tracker"

### Columnas

| Columna | Tipo | Configuración |
|---------|------|---------------|
| `Page` | Relation | → Content Clusters DB |
| `Month` | Date | — |
| `Organic Clicks` | Number | — |
| `Impressions` | Number | — |
| `CTR` | Formula | `round(prop("Clicks") / prop("Impressions") * 10000) / 100` |
| `Avg Position` | Number | — |
| `Keywords in Top 10` | Number | — |
| `Keywords in Top 3` | Number | — |
| `Backlinks Gained` | Number | — |
| `Notes` | Text | — |

---

## Páginas de Documentación Incluidas

1. **"How to Use the Content Strategy Planner"** — Guía completa
2. **"Topic Cluster Methodology"** — Explicación de la estrategia pillar-satellite con ejemplos
3. **"Keyword Research Guide"** — Framework de 4 pasos para keyword research
4. **"Internal Linking Best Practices"** — Reglas y patrones de enlazado
5. **"Content Refresh Schedule Template"** — Cómo mantener el contenido actualizado
6. **"SEO Content Brief Template"** — Brief editorial listo para escritores

---

## Automatizaciones y Fórmulas

| Fórmula | Propósito |
|---------|-----------|
| `Needs Refresh` | Alerta automática si el contenido tiene >6 meses |
| `CTR auto-calculado` | Cálculo automático del CTR desde clicks/impressions |
| `Content Gap Detector` | Vista que cruza keywords sin URL asignada (oportunidades) |
| `Cluster Health Score` | Rollup que promedia la posición de todas las páginas del cluster |
