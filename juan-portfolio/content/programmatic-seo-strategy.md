# Estrategia de SEO Programático: Autoridad Técnica y Escalabilidad

Esta estrategia define el marco para generar páginas de alto valor técnico a escala, reforzando la autoridad de **JuanPortfolio** en Desarrollo y SEO Técnico.

## 1. Diagnóstico de Viabilidad (Feasibility Index)
- **Puntaje Total:** 88/100
- **Veredicto:** **Strong Fit**. El nicho técnico permite la parametrización de datos (benchmarks, complejidad, sintaxis) que son altamente buscados pero raramente comparados bajo una lente de SEO.

---

## 2. Playbook A: "Tech-Battle SEO" (Comparativas de Arquitectura)
**Objetivo:** Capturar tráfico de decisión técnica (Commercial Intent).

### Estructura de la Página
- **Patrón de URL:** `/development/vs/[tecnologia-a]-vs-[tecnologia-b]-seo`
- **Variables:** Next.js, Remix, Astro, PayloadCMS, Strapi, Sanity, Contentful.
- **Secciones Únicas (Data-Driven):**
    - **SEO Performance Score:** Comparativa de LCP y TTFB base.
    - **Rendering Support:** Tabla de compatibilidad (SSR, SSG, ISR, RSC).
    - **Developer Experience (DX):** Curva de aprendizaje y facilidad de configuración SEO.
    - **Verdict (Use Case Winner):** Una opinión fuerte basada en experiencia (E-E-A-T) que define qué tecnología usar según el escenario (ej: "Usa Next.js si necesitas SSR dinámico; usa Astro para contenido estático").
- **Diferenciador:** No es una comparativa de "características" genérica; es un análisis de **rastreabilidad y performance** con un veredicto de experto.

---

## 3. Playbook B: "Polyglot Reference" (Algoritmos para Ingenieros)
**Objetivo:** Capturar tráfico educativo y de referencia (Informational Intent).

### Estructura de la Página
- **Patrón de URL:** `/cs-fundamentals/reference/[algoritmo]-en-[lenguaje]`
- **Variables:** 
    - **Algoritmos:** QuickSort, MergeSort, BFS, DFS, Dijkstra.
    - **Lenguajes:** TypeScript, Go, Rust, Python.
- **Secciones Únicas (Data-Driven):**
    - **Code Block:** Implementación optimizada y "idiomática".
    - **Big O Complexity:** Tiempo y Espacio específicos para ese lenguaje.
    - **SEO Context:** ¿Por qué este algoritmo es relevante en buscadores? (ej. BFS para crawling).

---

## 4. Estrategia de Datos y Automatización

### Fuentes de Datos
1. **Propiedades Técnicas:** Documentación oficial y repositorios de GitHub.
2. **Benchmarks:** Datos de pruebas locales (Lighthouse CLI / k6).
3. **Editorial:** "Juan's Insight" (Bloque de contenido generado o curado manualmente para evitar "Thin Content").

### Reglas de Calidad (Quality Gates)
- **No Indexación de Combinaciones Irrelevantes:** No generar `BubbleSort en Rust` si no hay demanda; priorizar lo que los ingenieros realmente usan.
### Automatización de Interlinking (Link Juice Distribution)
Para maximizar la autoridad tópica y distribuir el "Link Juice", aplicaremos reglas estrictas de enlazado interno dinámico:
1. **Vertical Siloing (Hacia Arriba):** Cada página pSEO (Spoke) debe incluir un enlace contextual en el primer párrafo hacia su **Pillar Page** (Hub).
2. **Horizontal Interlinking (Entre Hermanos):** Implementar un módulo dinámico de "Otras Implementaciones" o "Comparativas Relacionadas".
    - *Ejemplo Algoritmos:* Si estás en `MergeSort en Python`, el módulo debe enlazar a `MergeSort en TypeScript`, `MergeSort en Go`, etc.
    - *Ejemplo Batallas:* Si estás en `Next.js vs Astro`, enlazar a `Next.js vs Remix` y `Astro vs SvelteKit`.
3. **Cross-Entity Linking (Hacia Afuera):** Enlazar desde el código o el análisis técnico hacia conceptos fundamentales (ej: de un algoritmo hacia su página de `Big O Notation`).

---

## 5. Casos de Éxito de Referencia
- **Canva (Plantillas):** Escalabilidad masiva basada en intención de búsqueda + variable.
- **G2 / Capterra:** Comparativas de software que dominan las SERPs mediante tablas de datos.
- **Learn X in Y minutes:** Referencias técnicas rápidas y consistentes.

---

## 6. Próximos Pasos (Accionables)
1. [ ] **Fase 1:** Crear el `Collection` de Payload para "Comparisons" y "Algorithms".
2. [ ] **Fase 2:** Definir el dataset inicial para los primeros 10 enfrentamientos (ej. Next.js vs Astro).
3. [ ] **Fase 3:** Implementar el template de frontend en Next.js con soporte para `JsonLd` dinámico.
