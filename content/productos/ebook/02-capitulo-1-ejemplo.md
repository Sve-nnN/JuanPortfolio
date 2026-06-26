# 02 — Capítulo 1 de Muestra (Gratuito)

> Este capítulo completo se ofrece gratis como lead magnet. Los lectores lo descargan, ven la calidad, y compran el ebook completo. También sirve como contenido para el blog.

---

# Capítulo 1: Por qué el SEO técnico es cosa de developers

**Tiempo de lectura:** 12 minutos
**Incluye:** 2 fragmentos de código, 1 diagrama, 1 caso real

---

## La brecha entre SEOs y developers

Imagina esta escena: eres developer. Has pasado 3 meses construyendo una web app con Next.js. Es rápida, bonita, bien testeada. La lanzas a producción y... silencio. Google no la encuentra. O la encuentra pero muestra "No information available" en los resultados. O peor: indexa la página de login en vez del homepage.

Le preguntas al consultor SEO de la empresa. Te dice: "Hay que optimizar el robots.txt, mejorar los meta tags, implementar canonical y revisar el renderizado del lado del servidor."

Tú piensas: "Eso suena a código. ¿Por qué no lo hago yo directamente?"

**Exactamente.** Esa es la tesis de este libro.

El SEO técnico no es marketing. Es ingeniería de software aplicada a la visibilidad en buscadores. Los mejores SEOs técnicos que conozco son developers que aprendieron cómo funciona Google. No marketers que aprendieron un poco de HTML.

### ¿Por qué existe esta brecha?

| El/La SEO típico/a | El/La Developer típico/a |
|---------------------|--------------------------|
| Sabe de keywords, contenido, backlinks | Sabe de arquitectura, rendimiento, código |
| Usa herramientas no-code (SEMrush, Ahrefs) | Usa terminal, git, CI/CD |
| Diagnostica problemas pero no los implementa | Implementa soluciones pero no diagnostica SEO |
| Habla de "posicionamiento" y "autoridad" | Habla de "renderizado" y "performance" |
| Su output es un informe PDF | Su output es un pull request |

**El problema:** El SEO recomienda. El developer implementa. Entre ambos hay una capa de traducción donde se pierde precisión.

**La solución:** El developer aprende SEO técnico y elimina al intermediario.

---

## Cómo Google ve tu sitio (la versión para ingenieros)

Google funciona en tres etapas. No es magia: es un pipeline de datos.

### Etapa 1: Crawling (Rastreo)

```
Googlebot → GET / → HTML → Extrae links → GET /blog → HTML → Extrae links → ...
```

Googlebot es básicamente un **web scraper a escala planetaria**. Entra a tu sitio, lee el HTML, extrae todos los `<a href>`, los pone en una cola, y los visita uno por uno.

**Lo que puede salir mal (y cómo arreglarlo con código):**

| Problema | Síntoma | Solución técnica |
|----------|---------|------------------|
| `robots.txt` bloquea recursos | Google no ve tu CSS/JS | `Allow: /` para archivos críticos |
| JavaScript renderiza el contenido | Googlebot ve una página vacía | Server-Side Rendering (SSR) |
| Enlaces en JavaScript (`onClick`) | Googlebot no los sigue | Usar `<a href>` reales |
| Crawl budget desperdiciado | URLs infinitas (filtros, paginación) | `noindex` en variantes, canonical |

### Etapa 2: Indexing (Indexación)

Una vez que Googlebot descarga tu página, la procesa y la guarda en un índice. El índice es básicamente una **base de datos invertida gigante**: para cada palabra, Google sabe qué páginas la contienen.

**Lo que puede salir mal:**

```html
<!-- Esto NO se indexa -->
<meta name="robots" content="noindex">

<!-- Esto confunde a Google -->
<link rel="canonical" href="/pagina-a">
<link rel="canonical" href="/pagina-b">  <!-- ¿Cuál es la canónica? -->
```

### Etapa 3: Ranking (Clasificación)

Con la página en el índice, Google aplica **200+ señales** para decidir dónde posicionarla. Algunas son de contenido (relevancia, calidad), otras son técnicas (velocidad, seguridad, schema).

Las señales técnicas que **tú controlas directamente con código:**

| Señal | Qué mide | Cómo se optimiza |
|-------|----------|------------------|
| Core Web Vitals | Experiencia de usuario | Capítulo 5 |
| Schema.org | Comprensión del contenido | Capítulo 6 |
| HTTPS | Seguridad | next.config.js |
| Mobile-friendly | Responsive design | Tailwind/CSS |
| Canonical | Evitar duplicados | `<link rel="canonical">` |
| Hreflang | Internacionalización | Capítulo 9 |

---

## El ciclo de vida de una página web en Google

```
[Deploy] → [Googlebot visita] → [Indexada] → [Rankea] → [Tráfico]
                                                         ↓
                                              [Monitorizar y mejorar]
```

Cada etapa tiene su propio "time to X":

- **Time to First Crawl:** 4 horas a 4 semanas (depende de autoridad del dominio)
- **Time to Index:** Minutos a días
- **Time to Rank:** Semanas a meses
- **Time to Stable Position:** 3-6 meses

---

## Caso real: Cómo una mala configuración de robots.txt eliminó un sitio del índice

En 2025, un cliente me contactó porque su sitio había desaparecido de Google. De 5,000 visitas/día a 50.

**Diagnóstico (5 minutos):**

```txt
# robots.txt del cliente
User-agent: *
Disallow: /wp-content/
Disallow: /wp-includes/
Disallow: /  ← ESTO BLOQUEA TODO EL SITIO
```

Esa última línea —añadida por error durante una migración— le decía a Googlebot: "No rastrees nada". Google, obedientemente, dejó de rastrear el sitio. Sin rastreo no hay indexación. Sin indexación no hay ranking. Sin ranking no hay tráfico.

**Solución (1 línea de código):**

```txt
User-agent: *
Allow: /
Disallow: /wp-admin/
Sitemap: https://ejemplo.com/sitemap.xml
```

**Resultado:** En 48 horas, Google volvió a rastrear. En 2 semanas, el tráfico se recuperó al 80%. En 1 mes, volvió al 100%.

**Moraleja:** Una línea en un archivo de texto puede destruir o salvar tu presencia en Google. El SEO técnico no es opcional: es infraestructura crítica.

---

## Lo que aprenderás en este libro

- Cómo piensa Google — realmente, sin analogías de marketing
- Cómo auditar tu sitio con herramientas de developer
- Cómo implementar cada señal técnica de SEO con código (Next.js, TypeScript)
- Cómo automatizar el SEO en tu pipeline de CI/CD
- Cómo prepararte para el futuro: AI Overviews, GEO, LLMs

Si escribes código y quieres que tu trabajo sea visible en Google, este libro es para ti.

---

**[CTA] ¿Quieres seguir leyendo?**
Consigue el libro completo (12 capítulos, 200+ páginas, código real) en [enlace de Gumroad].
