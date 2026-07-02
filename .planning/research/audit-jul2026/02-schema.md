# Auditoría de datos estructurados (JSON-LD) — juan-tech.com

Fecha: 2026-07-02
Alcance: HTML real del sitio en producción (curl). Páginas inspeccionadas: home ES (`/`), home EN (`/en`), post (`/blog/tech-seo/javascript-seo` + `/en/...` + 2 posts adicionales), ficha de autor (`/authors/juan-carlos-angulo` ES/EN).
Validación de sintaxis: los 10 bloques JSON-LD capturados parsean como JSON válido (`json.loads` OK). Ninguno tiene error de sintaxis.

Nota sobre el validador MCP: la herramienta `schema-org-validate-jsonld` de mcp-hub no estaba disponible en este contexto (ToolSearch deshabilitado). La validación se hizo de forma manual contra las reglas de Google y schema.org.

---

## 1. Inventario exacto por página

### Home ES (`https://juan-tech.com/`) — 4 bloques `<script type="application/ld+json">`

| # | @type real | Propiedades presentes | Faltantes / observaciones |
|---|-----------|----------------------|---------------------------|
| 0 | `Organization` (dentro de `@graph`) | @id, name, url, founder(@id ref), logo, description, sameAs[2], contactPoint(email, telephone, contactType) | name = "Juan Tech" (inconsistente con "Juan-Tech" en otros nodos); logo = favicon.svg (SVG, no raster); contactPoint.email = `juancarlosanguloabud@gmail.com` (Gmail, distinto de `hola@juan-tech.com`); sin `image`; description en inglés en página ES |
| 1 | `WebSite` (dentro de `@graph`) | @id, name, url, publisher(@id ref), potentialAction(SearchAction) | Correcto y completo |
| 2 | `@graph` con **3 nodos**: `FAQPage` + `Person` + `ProfessionalService` | FAQPage: mainEntity[6 Question/Answer]. Person: @id, name, url, jobTitle, description, email, address(PostalAddress), worksFor, sameAs[2], knowsAbout[11]. ProfessionalService: @id, name, url, description, areaServed, knowsAbout[3] | Los nodos Person y ProfessionalService llevan un `@context` anidado redundante dentro del `@graph`. ProfessionalService sin `provider`/`address`/`aggregateRating` |
| 3 | `ItemList` (top-level) | name, itemListElement[6 ListItem → Organization con name/url/logo] | Único bloque con @type de primer nivel. `name` = "He trabajado con empresas increíbles" (en español también en /en) |

### Home EN (`/en`) — 4 bloques
Idéntica estructura a ES. Diferencias: Person.url → `/en/authors/...`; textos de descripción en inglés; la 6ª Question del FAQPage está en inglés ("Who is the best technical SEO expert..."); pero las 5 primeras Questions del FAQPage y el `name` del ItemList siguen en español (mezcla de idioma en /en).

### Post (`/blog/tech-seo/javascript-seo`) — 3 bloques
| # | @type real | Notas |
|---|-----------|-------|
| 0 | `Organization` (@graph) | Mismo nodo global que la home (viene del layout) |
| 1 | `WebSite` (@graph) | Mismo nodo global |
| 2 | `@graph` con `BlogPosting` + `BreadcrumbList` | **BlogPosting SIN `headline`, SIN `name`, SIN `description`** en este post concreto. Presentes: url, image (fallback genérico), publisher(Organization+logo), @id, datePublished, dateModified, author(Person @id ref), mainEntityOfPage |

BreadcrumbList del post: 4 ListItem (Inicio → Blog → SEO Técnico → post). El 4º ListItem no tiene `name` (solo `item`). Correcto para el último nivel pero conviene añadir `name`.

### Posts con datos completos (contraste)
`/blog/seo/guia-google-search-console` y `/blog/seo/canibalizacion-seo`: el `BlogPosting` SÍ trae `headline`, `name`, `description`, `image`, `datePublished`, `dateModified`, `author`, `mainEntityOfPage`. **Confirmado: el fallo de headline NO es sistémico del código, es dato faltante del post javascript-seo.**

### Ficha de autor (`/authors/juan-carlos-angulo` y `/en/...`) — 0 bloques válidos
**La página devuelve HTTP 500** (ES y EN). Renderiza la página de error de Next (`__next_error__`, "This page could..."). No emite Person, ProfilePage ni BreadcrumbList. El índice `/authors` (200) sí funciona; el fallo es exclusivo de la ruta `[slug]`.

---

## 2. Por qué el crawler marca "Unknown, Unknown, Unknown, ItemList"

**Hallazgo:** 3 de 4 bloques se leyeron como "Unknown".

**Evidencia (JSON-LD real):**
- Bloque 0: `{"@context":"...","@graph":[{"@type":"Organization",...}]}`
- Bloque 1: `{"@context":"...","@graph":[{"@type":"WebSite",...}]}`
- Bloque 2: `{"@context":"...","@graph":[{"@type":"FAQPage",...}, {...Person}, {...ProfessionalService}]}`
- Bloque 3: `{"@context":"...","@type":"ItemList",...}`

**Causa:** El analizador lee el `@type` de **primer nivel** del objeto. Los bloques 0, 1 y 2 no tienen `@type` en la raíz: envuelven las entidades dentro de un array `@graph`, así que `obj["@type"]` es `undefined` → "Unknown". El bloque 3 (ItemList) sí tiene `@type` en la raíz → se reconoce. **El JSON-LD es válido**; es una limitación del crawler frente a contenedores `@graph`. No es un error de schema, pero sí revela dos problemas reales de arquitectura (ver Fix).

**Consecuencia para el score AEO:** el informe dice "ningún schema orientado a IA detectado". Es un **falso negativo**: existe un `FAQPage` con 6 pares Q&A (incluida la pregunta de entidad "¿Quién es el mejor experto en SEO técnico...?"), pero el crawler no lo vio por el mismo motivo `@graph` = "Unknown". El sitio SÍ tiene schema orientado a IA.

**Fix propuesto:**
1. **Consolidar** los bloques dispersos. Hoy hay 3 emisores distintos generando 3-4 `<script>` separados: Organization + WebSite (layout global), FAQPage+Person+ProfessionalService (`src/components/JsonLd.tsx`), ItemList (`src/blocks/FeaturedClients/Component.tsx`). Unificar todo en **un solo `@graph`** por página con referencias `@id` cruzadas mejora la detección y elimina nodos duplicados.
2. **Limpiar el `@context` anidado** de Person y ProfessionalService dentro del `@graph` del bloque 2 (redundante; `@context` debe ir solo en la raíz del contenedor). Se generan en `JsonLd.tsx` (`homeSchemas`) — al empujarlos con `pushSchema` se elimina el `@context` del contenedor externo pero se conserva el anidado de cada nodo interno.

---

## 3. Ficha de autor rota (HTTP 500) — CRÍTICO

**Hallazgo:** `/authors/juan-carlos-angulo` y `/en/authors/juan-carlos-angulo` devuelven 500. La entidad `Person` (referenciada por `@id #person` desde Organization.founder, BlogPosting.author y Person.url en toda la web) apunta a una **URL canónica caída**.

**Evidencia:** `curl -o /dev/null -w "%{http_code}"` → `500` en ambos idiomas. HTML contiene `__next_error__`. El índice `/authors` responde 200, así que el fallo está en `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` en runtime (no en el listado).

**Causa:** Excepción en el render del componente `AuthorPage` (probable acceso a datos: mapeo de `user.experience` / `user.education` / `avatar.cloudinaryUrl` / `generateMeta(user)`), o en la generación de `personSchema` con datos incompletos del usuario. Requiere revisar los logs de Vercel/función para el stack exacto — no es determinable solo desde el HTML.

**Fix propuesto:**
- Arreglar el crash del componente (blindar accesos opcionales; envolver en guardas los `.map` de education/experience/expertise; validar `avatar`).
- Una vez estable, envolver la salida en **`ProfilePage`** con `mainEntity` → `Person`, siguiendo la guía de Google de perfiles de autor (EEAT). Hoy emite Person + BreadcrumbList sueltos; `ProfilePage` es el tipo recomendado para páginas de perfil.
- Verificar que `Person.@id` (`/#person`) y la `url` coincidan exactamente con las referencias del resto del sitio.

---

## 4. BlogPosting: ¿author, datePublished, dateModified?

**Hallazgo:** Sí, en posts con datos completos el `BlogPosting` es correcto y rico.

**Evidencia (post con datos OK):**
```json
{"@type":"BlogPosting","@id":"...","headline":"Optimiza tu web con Google Search Console - Guía Completa",
 "name":"...","description":"...","image":"...","datePublished":"...","dateModified":"...",
 "author":{"@type":"Person","@id":"https://juan-tech.com/#person","name":"Juan Carlos Angulo","url":".../authors/juan-carlos-angulo"},
 "publisher":{"@id":".../#organization","@type":"Organization","name":"Juan Tech","logo":{"@type":"ImageObject","url":".../favicon.svg"}},
 "mainEntityOfPage":{"@type":"WebPage","@id":"..."}}
```
`author` (Person con @id), `datePublished` y `dateModified` presentes y en ISO 8601. **Correcto.**

**Causa del caso roto (javascript-seo):** el post no tiene `title` ni `meta` poblados en el locale ES. En `src/utilities/generateSchema.ts`, `title = meta?.title || doc.title`; si ambos son vacíos, `headline`/`name`/`description` quedan `undefined` y `JSON.stringify` los omite. El mismo dato vacío hace que `<title>` y `og:title` del post caigan a "Juan Carlos Angulo" y que el H1 muestre "Javascript Seo" (derivado del slug). Es un **bug de contenido del post**, no del código de schema.

**Fix propuesto:**
- Rellenar `title` (y `meta.title`/`meta.description`) del post `javascript-seo` en ES (y revisar EN). Corrige de un golpe: `headline`/`name`/`description` del BlogPosting, el `<title>`, el `og:title` y el H1.
- Endurecer `generateSchema.ts`: si `title` está vacío, usar `doc.title` con fallback al slug title-cased para no emitir un BlogPosting sin `headline` (propiedad requerida por Google para Article).
- Mejora recomendada para todos los posts: `image` como `ImageObject` con `width`/`height` (hoy es string), y añadir `inLanguage`, `wordCount`, `articleSection`/`keywords`. Evitar la imagen fallback genérica (`fallback-image-48`) cuando el post tiene hero real.

---

## 5. FAQPage: dónde aplica y prioridad

**Hallazgo:** Ya existe `FAQPage` en la home (6 Q&A) — generado en `src/components/JsonLd.tsx` (bloque `allFaqItems` + `expertFaq`). También se inyecta en posts que embeben un bloque FAQ (`extractFaqsFromLexical` → `generateFAQSchema`, `page.tsx` del post).

**Prioridad: INFO (no crítico).** juan-tech.com es un sitio comercial (consultoría). Desde agosto 2023 Google **restringe los rich results de FAQ a sitios de gobierno y salud**, así que este FAQPage **no generará rich result en Google**. Sin embargo, **sí aporta a citación por IA/LLM (GEO/AEO)**, que es justo lo que el sitio prioriza (su propio `knowsAbout` incluye "Generative Engine Optimization"). Mantenerlo es correcto por AEO; no esperar rich result de Google.

**Corrección al informe:** la recomendación "añadir FAQPage" ya está cumplida. El problema no es ausencia de FAQPage sino (a) que el crawler no lo detectó por el `@graph` = "Unknown", y (b) la mezcla de idioma en /en (5 preguntas en español, 1 en inglés).

**Fix propuesto:**
- No añadir más FAQPage esperando beneficio de Google; el existente cubre el ángulo AEO.
- Traducir las Questions/Answers del FAQPage en `/en` (hoy 5 de 6 están en español dentro de la versión inglesa).
- Considerar `Speakable` en posts para reforzar AEO.

---

## 6. Schemas de alto impacto que faltan (por página)

| Página | Schema faltante / a mejorar | Prioridad | Componente probable |
|--------|-----------------------------|-----------|---------------------|
| Ficha de autor | **ProfilePage** (envolviendo Person) — hoy la página está en 500 y no emite nada | CRÍTICO | `authors/[slug]/page.tsx` |
| Home | Consolidar Organization + WebSite + Person + ProfessionalService + FAQ en **un `@graph`** con `@id` cruzados; añadir `WebPage`/`@id` de la home | Media | layout + `JsonLd.tsx` |
| Organization (global) | Unificar `name` a "Juan-Tech"; `logo` como `ImageObject` raster (PNG/JPG); alinear `contactPoint.email` con `hola@juan-tech.com` | Media | emisor de Organization (layout) |
| Posts | `image` como `ImageObject` (width/height), `inLanguage`, `wordCount`, `articleSection`; `name` en el último ListItem del breadcrumb | Media | `generateSchema.ts` |
| ProfessionalService | `aggregateRating`/`review` **solo si hay reseñas reales** (no inventar); `address`/`areaServed` más específico | Baja | `JsonLd.tsx` |
| Global | `BreadcrumbList` en home no es necesario; ItemList de clientes es válido pero de bajo valor SEO (no es rich result) | Baja | `FeaturedClients/Component.tsx` |

**No recomendado / evitar:**
- No fabricar `AggregateRating`/`Review` sin reseñas verificables (violación de políticas de Google).
- No usar `HowTo` (rich results retirados sept-2023) ni `FAQPage` esperando rich result en Google (restringido a gov/salud).

---

## Resumen de prioridades

1. **CRÍTICO — Ficha de autor en HTTP 500** (ES y EN). Rompe la URL canónica de la entidad Person referenciada en toda la web. Arreglar el crash y añadir `ProfilePage`.
2. **ALTO — Post `javascript-seo` sin title/meta**: BlogPosting sin `headline` (requerido por Google) + `<title>`/`og:title`/H1 rotos. Rellenar contenido y endurecer el fallback de `generateSchema.ts`.
3. **MEDIO — Consolidar en un `@graph` único** con `@id` cruzados y limpiar `@context` anidado. Resuelve el falso "Unknown" del crawler y la fragmentación en 3-4 script tags.
4. **MEDIO — Consistencia de entidad Organization** (name, logo raster, email de contacto).
5. **INFO — FAQPage** ya existe; correcto para AEO, sin rich result en Google. Traducir las Q&A en `/en` y arreglar la mezcla de idioma.
</content>
</invoke>
