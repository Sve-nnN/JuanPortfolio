# Auditoría de código — Bugs y errores (JuanPortfolio)

Fecha: 2026-07-02
Alcance: bugs reales de comportamiento (no estilo, no SEO). Diagnóstico con evidencia, sin arreglar.

Baseline verificado:
- `tsc --noEmit`: **112 errores, todos en `tests/`** (0 en `src/`, 0 en `scripts/`). Baseline conocido 114 → nada nuevo se rompió en producción.
- Vitest: **776/776 verdes** en corrida limpia. (En la primera corrida hubo 5 fallas `ETIMEDOUT` de `execSync`/`spawnSync npx tsx` en tests de integración bajo carga; son flakes ambientales de spawn de subproceso, no fallas lógicas — desaparecieron al re-correr.)

---

## BUG-01 — Revalidación de posts apunta a una URL que no existe

**Bug:** Al publicar/actualizar un post, el hook revalida `/blog/{slug}`, pero la ruta real del post es `/blog/[category]/[slug]`. No existe ninguna ruta plana `/blog/[slug]` (verificado: solo hay `/blog`, `/blog/[category]`, `/blog/[category]/[slug]`, `/blog/page/[pageNumber]`). El path revalidado matchea a lo sumo `/blog/[category]` (tratando el slug del post como categoría), nunca la página real del post.

**Archivo:línea:** `src/collections/Posts/hooks/revalidatePost.ts:14`, `:22`, `:34`

**Escenario de fallo concreto:** Editás el cuerpo de un post publicado en `/blog/desarrollo-web/mi-post` → el hook llama `revalidatePath('/blog/mi-post')` → la caché ISR de la URL real (`/blog/desarrollo-web/mi-post`) NO se invalida. El cambio recién aparece cuando expira la ventana ISR de 3600s. La edición se siente "no aplicada" hasta 1h después. Ídem al despublicar (`:22`) y al borrar (`:34`).

**Severidad:** medio (regresión de UX editorial; el `revalidateTag('posts-sitemap')` sí funciona, pero la página del post no se refresca).

**Fix propuesto:** Construir el path con la categoría real del doc, igual que hace la página: derivar `categorySlug` de `doc.categories?.[0]` (con fallback `'general'`) y revalidar `/blog/${categorySlug}/${doc.slug}`. Considerar además revalidar la variante `/en/...` si aplica.

---

## BUG-02 — `triggerCWVScan` escanea PSI sobre una URL 404

**Bug:** El hook de Core Web Vitals construye `postUrl = ${serverUrl}/blog/${doc.slug}` (mismo error de path que BUG-01: falta el segmento de categoría). Dispara PageSpeed Insights contra una URL que en producción no resuelve al post (matchea `/blog/[category]` o 404).

**Archivo:línea:** `src/collections/Posts/hooks/triggerCWVScan.ts:24`

**Escenario de fallo concreto:** Post publicado → hook llama `fetchPageMetrics('https://juan-tech.com/blog/mi-post')` → PSI mide una página equivocada (categoría) o falla; las métricas guardadas para el post no corresponden a su página real. El comentario en `:24` ("Assuming default blog path structure") delata el supuesto incorrecto.

**Severidad:** medio (datos de CWV incorrectos/inútiles; agravado por el float sin await en serverless, ver BUG-07).

**Fix propuesto:** Igual que BUG-01, incluir la categoría en la URL. Idealmente centralizar la construcción de URL de post en un helper compartido para que hook y página no diverjan.

---

## BUG-03 — `revalidatePost` accede a `previousDoc._status` sin optional chaining

**Bug:** `revalidatePost` lee `previousDoc._status` sin `?.` (línea 21), mientras que el hook hermano `revalidatePage` sí usa `previousDoc?._status` (`Pages/hooks/*.ts:21`). Inconsistencia defensiva: si `previousDoc` llega `undefined` en una operación `create`, `previousDoc._status` lanza `TypeError` y rompe el guardado del post.

**Archivo:línea:** `src/collections/Posts/hooks/revalidatePost.ts:21`

**Escenario de fallo concreto:** Creación de post (no update) donde Payload no provee `previousDoc` → `Cannot read properties of undefined (reading '_status')` en el `afterChange`, abortando la creación. En Payload reciente `previousDoc` suele venir poblado en create, por eso no se dispara siempre; pero la asimetría con `revalidatePage` (que sí se blinda) indica que el caso se consideró real en un lado y se olvidó en el otro.

**Severidad:** bajo-medio (crash condicional según versión/operación; fix trivial).

**Fix propuesto:** Cambiar `previousDoc._status` por `previousDoc?._status` en la línea 21.

---

## BUG-04 — `apply` de internal-links reporta éxito aunque no aplique nada

**Bug:** En el endpoint que inserta un enlace interno en un `.md`, si `lineNumber` cae fuera de rango (`lineIdx < 0 || >= lines.length`) o si la regex de la keyword no matchea en esa línea, el código no modifica nada pero igual re-serializa y reescribe el archivo (`matter.stringify`) y devuelve `success: true, message: 'Link applied and synced'`.

**Archivo:línea:** `src/app/api/internal-links/apply/route.ts:48-58`

**Escenario de fallo concreto:**
1. El índice de sugerencias quedó desincronizado del archivo (contenido editado) → `lineNumber` apunta a una línea que ya no contiene la keyword → `String.replace` no reemplaza nada → se escribe el archivo sin el link y la UI muestra "Link applied and synced". El usuario cree que insertó el enlace pero no pasó nada.
2. Además, `matter.stringify` reescribe el frontmatter SIEMPRE (aunque no haya cambio real), pudiendo reordenar/reformatear YAML y disparar un `sync push` innecesario.

**Severidad:** medio (falso positivo silencioso + escritura/commit espurio de archivos de contenido).

**Fix propuesto:** Verificar que el reemplazo efectivamente ocurrió (comparar `currentLine !== replaced`, o chequear rango) y, si no, devolver `success: false` con un mensaje claro (p. ej. "keyword no encontrada en la línea N; sugerencia obsoleta"). No reescribir el archivo cuando no hubo cambio.

---

## BUG-05 — `generateMetadata` del post no filtra por `_status: published`

**Bug:** La página del post filtra por `_status: published` (`.../[category]/[slug]/page.tsx:94`), pero su `generateMetadata` consulta sin ese filtro (`:247-253`). Un post en borrador (no publicado) produce metadata real (title, canonical, OG) aunque la página en sí devuelve `notFound()`.

**Archivo:línea:** `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx:247-255`

**Escenario de fallo concreto:** URL de un post en draft → `generateMetadata` retorna metadatos del borrador (canonical, título indexable) mientras el body renderiza 404. Incoherencia entre `<head>` y contenido; riesgo de exponer título/descripción de contenido no publicado.

**Severidad:** bajo (no rompe, pero fuga metadata de drafts e inconsistencia head/body).

**Fix propuesto:** Añadir `...(draft ? [] : [{ _status: { equals: 'published' } }])` al `where` de `generateMetadata`, igual que en la página. En draft el metadata puede venir undefined → `generateMeta` ya maneja `doc: null`.

---

## BUG-06 — `generateStaticParams` del post usa slug del locale por defecto para ambos idiomas

**Bug:** El `payload.find` de `generateStaticParams` no pasa `locale`, por lo que trae el `slug` del locale por defecto (`es`). Luego genera params para `en` y `es` con ese mismo slug. Si un post tiene slug distinto por idioma, los params de `en` usan el slug español.

**Archivo:línea:** `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx:37-73` (esp. `:64-70`)

**Escenario de fallo concreto:** Post con `slug` `es="analisis-seo"` / `en="seo-analysis"` → se prerenderiza `/en/blog/.../analisis-seo` (slug es) en vez de `/en/blog/.../seo-analysis`. La URL en inglés real cae al fallback ISR (se genera on-demand) o no queda pre-renderizada.

**Severidad:** bajo (ISR lo cubre on-demand; degradación de prerender, no crash). Aplica también a `[locale]/[slug]/page.tsx:33-61` para pages con slug localizado.

**Fix propuesto:** Iterar por locale consultando `payload.find({ ..., locale })` por idioma, o usar `locale: 'all'` y leer el slug correcto por idioma al armar cada param.

---

## BUG-07 — CWV hook: promesa flotante que Vercel serverless mata (deuda reconocida)

**Bug:** `triggerCWVScan` dispara `fetchPageMetrics(...).then(...)` sin `await` a propósito para no bloquear la UI del admin. En Vercel serverless, la función termina al responder y la promesa flotante se corta antes de guardar métricas. Los propios comentarios (`:26-51`) documentan el dilema sin resolverlo.

**Archivo:línea:** `src/collections/Posts/hooks/triggerCWVScan.ts:41-60`

**Escenario de fallo concreto:** En producción (Vercel), publicar un post lanza el fetch de PSI pero el runtime se apaga → `saveMetricsToPayload` nunca corre → las métricas no se persisten. Solo funciona el botón manual "Force Scan".

**Severidad:** bajo (comportamiento conocido y con workaround manual; combinado con BUG-02, la automatización de CWV es efectivamente no funcional en prod).

**Fix propuesto:** Mover a `payload.jobs`/cola (QStash/Vercel Cron) o usar `waitUntil` de `@vercel/functions` para no perder el trabajo. Ver también `jobs.tasks: []` vacío en `payload.config.ts:229` (la infraestructura de jobs existe pero está sin usar).

---

## Observaciones menores (informativas, no bugs de comportamiento)

- **`src/app/api/seo/indexing/route.ts:59-65`** — Bloque `try {}` vacío con solo un comentario ("will implement in payload schema later"); código muerto de una feature incompleta. No rompe, pero el `if (collection && id && ...)` no hace nada.
- **`src/payload.config.ts:226`** — `authHeader === \`Bearer ${process.env.CRON_SECRET}\``: si `CRON_SECRET` no está seteado, el string queda `"Bearer undefined"` y un request con ese header exacto pasaría el gate. Mitigado porque `jobs.tasks` está vacío y existe el gate `req.user`. Recomendable guardar contra `CRON_SECRET` undefined.
- **`src/collections/Posts/hooks/populateAuthors.ts:28-46`** — Reasigna `doc.populatedAuthors` dentro del `for` en cada iteración (recalcula el array completo por autor). Ineficiencia, no bug; el resultado final es correcto. El `catch {}` (`:47`) traga errores en silencio.
- **`src/utilities/seo/seoAnalyzer.ts:378`** — `internalLinksCount: 0, // TODO: Implement link counting`: el conteo de enlaces internos del analizador está hardcodeado en 0 (siempre reporta 0 enlaces internos).
- **`src/app/(frontend)/[locale]/[slug]/page.tsx:57-58`** — `params.push(...)` sobre `params` derivado de `pages.docs?.filter(...)`. Si `pages.docs` fuese `undefined`, `params` sería `undefined` y `.push` lanzaría. Payload siempre retorna array, así que es teórico.

---

## Resumen de conteos

- **tsc `--noEmit`:** 112 errores, 100% en `tests/` (deuda vieja de tipos en fixtures/mocks: `KeywordData` sin `status`, `DinoRankAccount` incompleto, `SeoAdapter` sin `providerName`, imports a módulos movidos como `seo/keyword-utils`). **0 errores en código de producción.** Bajo el baseline de 114 → nada nuevo roto.
- **Vitest:** 776/776 verdes (rerun limpio). 5 flakes iniciales `ETIMEDOUT` en `tests/int/scripts/fixInternalLinks.int.test.ts` y `searchKeyword.int.test.ts` por spawn de `npx tsx` bajo carga; no reproducibles, no lógicos.
- **Crons:** sin cron tasks registrados (`jobs.tasks: []`, sin `vercel.json` crons). No hay fallos silenciosos de cron.

**Prioridad de arreglo sugerida:** BUG-01 y BUG-02 (paths de blog sin categoría, mismo root cause — centralizar helper de URL de post) → BUG-04 (falso positivo de apply) → BUG-03 (optional chaining) → BUG-05/06/07 (menores).
