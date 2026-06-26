# 03 — Plan de Compilación: De Blog a Ebook

> Estrategia para convertir los 120+ artículos del blog en un ebook cohesivo en 40-60 horas de trabajo.

---

## Fase 1: Inventario (3 horas)

### Mapeo de artículos del blog → Capítulos del ebook

| Capítulo | Artículos fuente del blog | Estado |
|----------|--------------------------|--------|
| Cap 1: Por qué SEO técnico | `non-developers-guide.md`, author-profile.md | ✅ Existe, necesita reescribir |
| Cap 2: Arquitectura web | `xml-sitemap-automation.md`, `robots-txt-best-practices.md` | ✅ 80% existe |
| Cap 3: Renderizado | `ssr-vs-csr-seo.md`, `nextjs-seo-optimization.md` | ✅ 70% existe |
| Cap 4: Auditoría técnica | `technical-seo-guide.md`, `auditoria-seo.md`, `tech-seo-guide.md` | ✅ 90% existe |
| Cap 5: Core Web Vitals | `core-web-vitals-guide.md`, `web-performance-guide.md` | ✅ 80% existe |
| Cap 6: Schema | `schema-markup-guide.md`, `structured-data-seo.md` | ✅ 70% existe |
| Cap 7: Topic Clusters | `estrategia-topic-clusters.md`, `topic-clusters-seo.md`, `canibalizacion-seo.md` | ✅ 80% existe |
| Cap 8: SEO On-Page | `seo-on-page-guia.md`, `redaccion-seo.md`, `seo-copywriting-guide.md` | ✅ 70% existe |
| Cap 9: SEO Internacional | `estrategia-seo.md` (parcial), blog middleware docs | ⚠️ 30% existe |
| Cap 10: Automatización CI/CD | No existe en el blog aún | ❌ Crear desde cero |
| Cap 11: Migraciones | No existe en el blog aún | ❌ Crear desde cero |
| Cap 12: Futuro GEO | `seo-content-strategy.md` (parcial) | ⚠️ 20% existe |
| Apéndices | Varios artículos | ⚠️ 50% existe |

### Total estimado:
- **Contenido existente (adaptable):** 60% del ebook
- **Contenido nuevo (escribir):** 40% del ebook

---

## Fase 2: Extracción y Adaptación (15 horas)

### Reglas de adaptación

1. **Unificar el tono:** Los posts del blog tienen tonos variados. Para el ebook: tono de ingeniero explicando a otro ingeniero. Directo, preciso, sin hype.

2. **Eliminar referencias temporales:** "En 2026" → "Actualmente" (el ebook debe sentirse vigente por 2-3 años).

3. **Reemplazar links internos por referencias a capítulos:** "Ver artículo X" → "Ver Capítulo 7"

4. **Añadir valor incremental:** Cada capítulo debe tener contenido que NO está en el blog:
   - Fragmentos de código nuevos (no publicados)
   - Diagramas y gráficos
   - Casos de estudio expandidos
   - Ejercicios o checklists

5. **Estandarizar fragmentos de código:**
   - Mismo lenguaje: TypeScript para frontend, JSON para schema
   - Mismo formato: 2-space indent, comentarios en inglés técnico
   - Misma estructura: Problema → Código → Explicación

---

## Fase 3: Escritura de Capítulos Nuevos (20 horas)

### Capítulo 10: Automatización de SEO en CI/CD (8h)

Contenido a crear:
- Lighthouse CI: setup y configuración (3h)
- GitHub Actions workflow (2h)
- Playwright tests para SEO (2h)
- Monitoreo continuo con GSC API (1h)

### Capítulo 11: Migraciones (5h)

Contenido a crear:
- Checklist de 20 puntos (1h)
- Script de generación de redirects (2h)
- Caso real: migración WordPress → Payload CMS (2h)

### Capítulo 12: GEO y AI Overviews (4h)

Contenido a crear:
- Investigación de estado del arte (2h)
- Atomic Answer pattern (1h)
- Predicciones 2026-2027 (1h)

### Apéndices (3h)

---

## Fase 4: Edición y Unificación (10 horas)

### Paso 1: Voice & Tone pass (3h)
Leer el ebook completo de corrido. Corregir:
- Inconsistencias de tono entre capítulos
- Repeticiones (el mismo concepto explicado en 2 capítulos)
- Transiciones entre capítulos (añadir "En el capítulo anterior..." y "En el próximo capítulo...")

### Paso 2: Technical review (3h)
- Verificar que todo el código funciona en 2026 (Next.js 15+, Payload 3+)
- Actualizar URLs de documentación oficial
- Verificar que los ejemplos de schema pasan validación

### Paso 3: Beta readers (2h)
- Enviar a 3-5 developers de confianza
- Recoger feedback: ¿qué no se entiende? ¿qué falta? ¿qué sobra?

### Paso 4: Final polish (2h)
- Incorporar feedback de beta readers
- Última pasada de corrección
- Numerar páginas, generar tabla de contenidos automática

---

## Fase 5: Diseño y Maquetación (8 horas)

Ver archivo: [`04-diseno-y-maquetacion.md`](./04-diseno-y-maquetacion.md)

---

## Línea de Tiempo Total

| Semana | Fase | Horas |
|--------|------|-------|
| 1 | Inventario + Extracción capítulos 1-4 | 10h |
| 2 | Extracción capítulos 5-9 | 8h |
| 3 | Escritura capítulos 10-12 | 15h |
| 4 | Edición + Unificación + Beta readers | 10h |
| 5 | Diseño + Maquetación | 8h |
| 6 | Revisión final + Lanzamiento | 5h |
| **Total** | | **56 horas** |
