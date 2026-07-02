# Auditoría GEO/AEO — juan-tech.com (2026-07-02)

Sitio en vivo verificado con `curl`. Cruzado contra el código en `src/`.
AEO reportado en el informe base: 61/100. Este documento explica de dónde salen los puntos flojos y cómo cerrarlos.

Resumen de lo que encontré:
- `/llms.txt` en producción está roto: devuelve un texto de error, no el llms.txt real.
- `/llms-full.txt` no existe como ruta: responde 200 pero sirve el HTML del homepage.
- El schema orientado a IA sí existe (FAQPage en home, BlogPosting con autor y fechas en el blog). La afirmación "ningún schema IA detectado" del informe base es inexacta; el problema real es de cobertura, no de ausencia.
- Acceso de crawlers IA: todos permitidos por defecto vía `User-Agent: *`, sin directivas explícitas ni bloqueos.

---

## Hallazgo 1 — /llms.txt en producción devuelve el fallback de error (crítico)

**Evidencia**
`curl -sL https://juan-tech.com/llms.txt` devuelve exactamente una línea:

```
Juan Tech Portfolio - LLM Information Not Available
```

`content-type: text/plain`, HTTP 200, `x-vercel-cache: MISS`. Es una respuesta válida a nivel HTTP, pero el contenido es inútil para un LLM.

**Causa**
Ese string es literalmente el `catch` de la ruta `src/app/(frontend)/llms.txt/route.ts`:

```ts
} catch (error) {
  console.error('Error generating llms.txt:', error)
  return 'Juan Tech Portfolio - LLM Information Not Available'
}
```

O sea, en runtime de producción el bloque `try` está lanzando excepción. El `try` hace `getPayload({ config })` + `payload.findGlobal({ slug: 'llm' })` + `payload.find({ collection: 'posts' })`. Alguna de esas llamadas a Payload/DB falla dentro de la ruta cacheada (`unstable_cache`). El builder `src/utilities/llmsTxt.ts` es correcto y está cubierto por tests (`tests/unit/seo/llms-txt.test.ts`), pero nunca llega a ejecutarse porque la data nunca se resuelve. El auditor base reportó "0 secciones, 0 links, sin estructura Markdown" precisamente porque lo que recibió fue esa línea de error, no Markdown.

Esto conecta con el caveat conocido de build/deploy (Payload/DB en Vercel: conexión y `google-auth-library` JWT). Es un fallo de runtime en el entorno de producción, no de lógica.

**Fix propuesto**
1. Reproducir el error: en Vercel, revisar los logs de la function de `/llms.txt` buscando `Error generating llms.txt:`. Eso da el stack real (conexión a DB, global `llm` inexistente, o timeout).
2. Confirmar que el global `llm` de Payload existe y tiene `summary` y `fullContent` poblados en la base de producción. Si el global está vacío pero la query no falla, `buildLlmsTxt` igual devolvería al menos el H1 con `DEFAULT_TITLE` ("Juan Tech Portfolio & Blog"); como NO vemos ni el H1, la query está lanzando excepción antes de llegar al builder.
3. Hacer el fallback resiliente: en vez de devolver una línea muerta, que el `catch` devuelva un llms.txt mínimo válido construido con constantes (H1 + blockquote + links a secciones fijas del sitio). Así, aun con la DB caída, el endpoint sirve algo consumible.
4. Añadir un test de integración/smoke post-deploy que haga `GET /llms.txt` y falle si el body empieza con "Juan Tech Portfolio - LLM Information Not Available" o no contiene `# `.

---

## Hallazgo 2 — /llms-full.txt no existe como ruta (sirve el HTML del homepage)

**Evidencia**
`curl -sIL https://juan-tech.com/llms-full.txt` responde `content-type: text/html; charset=utf-8` y `x-matched-path: /[locale]`. El body es el `<!DOCTYPE html>` completo del homepage (257 KB de HTML/JS). No hay ninguna ruta `llms-full.txt` en el código:

```
grep -rn "llms-full" src/  ->  sin resultados
```

**Causa**
No existe `src/app/(frontend)/llms-full.txt/route.ts`. La petición cae en el catch-all de i18n `/[locale]` y Next renderiza el homepage. Por eso el informe base lo ve como "0 secciones, 0 links": está parseando HTML de una SPA, no Markdown. El endpoint parece existir (200) pero es un falso positivo.

**Fix propuesto**
Decidir una de dos:
- **Opción A (recomendada):** no publicar `/llms-full.txt` hasta que exista de verdad. Un 200 que sirve HTML es peor que un 404, porque contamina lo que el crawler indexa. Si algo (informe, link) lo referencia, quitar la referencia.
- **Opción B:** implementar la ruta real `src/app/(frontend)/llms-full.txt/route.ts` que concatene el contenido Markdown completo de los posts publicados (no solo el resumen), con `Content-Type: text/plain`. Es la versión "full" de la convención: el índice va en `/llms.txt`, el volcado completo en `/llms-full.txt`.

---

## Hallazgo 3 — /llms.txt no cumple del todo la convención llmstxt.org

**Evidencia + Causa**
Aun cuando el Hallazgo 1 se arregle y el builder corra, la estructura que genera `buildLlmsTxt` se desvía de la especificación de llmstxt.org en dos puntos:
1. **Falta el blockquote de resumen.** La spec pide, justo debajo del H1, un `> blockquote` de una frase con el resumen del sitio. El builder salta directo a `## Information`.
2. **Encabezados no estándar.** Usa `## Information` y `## Entity Knowledge Graph (Recent Insights)`. La convención espera secciones H2 temáticas cuyos ítems sean listas de links Markdown `- [título](url): nota`. La sección de posts sí lo hace parcialmente pero los emite como `### título` con sub-bullets (`- **URL**`, `- **Category**`) en vez de un link Markdown por línea. Un parser estricto de llms.txt no extrae bien esos links.

**Fix propuesto — estructura recomendada para /llms.txt**

```markdown
# Juan Tech

> Consultoría de SEO técnico, desarrollo full-stack y optimización de
> rendimiento web. Juan Carlos Angulo construye aplicaciones web de alto
> rendimiento y audita infraestructura para mejorar el crawl budget.

Juan Tech es el portfolio y blog de Juan Carlos Angulo, desarrollador
full-stack y consultor de SEO técnico. Contenido en español e inglés.

## Servicios

- [SEO técnico](https://juan-tech.com/...): auditoría de infraestructura y crawl budget.
- [Desarrollo web](https://juan-tech.com/...): aplicaciones full-stack de alto rendimiento.

## Blog

- [JavaScript SEO](https://juan-tech.com/blog/tech-seo/javascript-seo): cómo indexar apps con JS.
- [Guía de Google Search Console](https://juan-tech.com/blog/seo/guia-google-search-console): configuración y uso.
- [Canibalización SEO](https://juan-tech.com/blog/seo/canibalizacion-seo): detección y resolución.

## Sobre el autor

- [Juan Carlos Angulo](https://juan-tech.com/authors/juan-carlos-angulo): perfil, experiencia y contacto.

## Optional

- [llms-full.txt](https://juan-tech.com/llms-full.txt): volcado completo del contenido del blog.
```

Cambios concretos en `buildLlmsTxt`:
- Añadir el `> blockquote` de una o dos líneas tras el H1 (nuevo campo `tagline`/`summary` corto del global `llm`).
- Renombrar `## Information` a algo temático o dejarlo pero con contenido, no vacío.
- Cambiar la sección de posts para emitir **un link Markdown por post** (`- [título](url): meta.description`) en vez de `### título` con sub-bullets. Eso alinea con la spec y hace los links extraíbles.
- Opcional: sección `## Optional` al final con links secundarios (spec de llmstxt.org).

---

## Hallazgo 4 — Cobertura de schema orientado a IA: parcial, no ausente

**Evidencia**
Contrario a lo que dice el informe base ("ningún schema orientado a IA detectado"), en vivo:

- **Homepage** (`/`): `@graph` con `Organization`, `WebSite` (+ `SearchAction`), `Person`, `ProfessionalService` (+ `ContactPoint`, `PostalAddress`), `ItemList` de clientes, y **`FAQPage` con 6 `Question`/`Answer`**.
- **Blog post** (`/blog/tech-seo/javascript-seo` y otros): `BlogPosting` con `author` (Person, `@id`, url al autor), `datePublished` (`2026-04-20`) y `dateModified` (`2026-06-26`), más `BreadcrumbList`, `WebPage`, `ImageObject`. Autoría y fechas están correctas.

**Causa**
El schema base está bien implementado. Los huecos son de **cobertura**, no de existencia:
1. `FAQPage` solo vive en el homepage. Los posts del blog no tienen `FAQPage` propio aunque el informe base indica que hay 131 H2/H3 en forma de pregunta repartidos en el contenido: ese contenido pregunta/respuesta no está marcado como `FAQPage` en las páginas donde vive.
2. No hay `HowTo` en ningún lado, pese a que hay contenido tipo guía (guía de GSC, etc.) que califica.
3. `services` devuelve **HTTP 404**: no hay páginas de servicio individuales que puedan portar `Service`/`FAQPage` específicos; todo cuelga del `ProfessionalService` del home.

**Fix propuesto**
1. **FAQPage en los posts** que ya tienen preguntas como H2/H3: inyectar un bloque `FAQPage` por post derivado de esos encabezados pregunta + su primer párrafo de respuesta. Es lo de mayor impacto AEO: convierte los 131 encabezados-pregunta en respuestas citables/extraíbles.
2. **HowTo** en los posts tipo tutorial paso a paso (guía de GSC y similares).
3. Considerar promover `BlogPosting` con más señales: `wordCount`, `articleSection`, `keywords`, `inLanguage` (ya hay hreflang, conviene reflejarlo en el schema).
4. Mantener el `FAQPage` del home; está correcto.

---

## Hallazgo 5 — Acceso de crawlers IA: permitido por defecto, sin directivas explícitas

**Evidencia**
`https://juan-tech.com/robots.txt` completo:

```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://juan-tech.com/sitemap.xml
Sitemap: https://juan-tech.com/pages-sitemap.xml
Sitemap: https://juan-tech.com/posts-sitemap.xml
Sitemap: https://juan-tech.com/categories-sitemap.xml
Sitemap: https://juan-tech.com/authors-sitemap.xml
```

**Estado por crawler IA** (todos vía el comodín `User-Agent: *`, no hay bloques específicos):

| Crawler | Propósito | Estado |
|---|---|---|
| GPTBot | ChatGPT (indexación/training) | Permitido (implícito) |
| OAI-SearchBot | ChatGPT Search | Permitido (implícito) |
| ChatGPT-User | Navegación en vivo de ChatGPT | Permitido (implícito) |
| ClaudeBot | Claude | Permitido (implícito) |
| anthropic-ai | Anthropic (training) | Permitido (implícito) |
| PerplexityBot | Perplexity | Permitido (implícito) |
| Google-Extended | Gemini / AI Overviews (training) | Permitido (implícito) |
| CCBot | Common Crawl | Permitido (implícito) |
| Bingbot / Bing | Copilot | Permitido (implícito) |

**Causa**
No hay ningún `User-agent:` específico para bots de IA. Todo se resuelve por el comodín. Para visibilidad en IA esto es bueno (nada bloqueado), pero no hay declaración explícita ni control granular (por ejemplo, permitir buscadores de IA y bloquear solo los de training puro si algún día se quisiera).

**Fix propuesto**
El estado actual es aceptable y no urge. Si se quiere ser explícito (mejora menor, señal clara para auditorías):
- Añadir bloques `User-agent:` nombrados para `GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` con `Allow: /`, dejando `Disallow: /admin` y `/api/`.
- Si en algún momento se quiere excluir training conservando visibilidad en búsqueda IA: bloquear solo `CCBot`, `anthropic-ai`, `Google-Extended` y `GPTBot`, dejando `OAI-SearchBot`, `ChatGPT-User` y `PerplexityBot` permitidos. No es lo recomendado para un portfolio que busca exposición.

---

## Prioridad de remediación

1. **Crítico —** Arreglar `/llms.txt` (Hallazgo 1). Ahora mismo el activo GEO principal sirve un mensaje de error. Empezar por los logs de Vercel.
2. **Alto —** Decidir y arreglar `/llms-full.txt` (Hallazgo 2): quitarlo o implementarlo real.
3. **Alto —** `FAQPage`/`HowTo` en los posts del blog (Hallazgo 4): mayor palanca de citabilidad AEO.
4. **Medio —** Alinear la estructura de `buildLlmsTxt` con llmstxt.org (Hallazgo 3): blockquote + links Markdown por post.
5. **Bajo —** Directivas explícitas de crawlers IA en robots.txt (Hallazgo 5): opcional.
