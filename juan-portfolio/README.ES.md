# Juan Portfolio — Documentación (español)

Este repositorio es una versión personalizada de la plantilla "Payload Website Template" adaptada para el portafolio de Juan. Incluye un backend con Payload CMS y una web con Next.js (App Router). El objetivo principal es permitir que todo el front-end sea editable desde el panel de Payload (i18n, SEO, bloques, páginas, case studies, autores, etc.).

Contenido rápido

- Backend: Payload CMS (config en `src/payload.config.ts` y colecciones en `src/collections`).
- Frontend: Next.js (App Router) en `src/app` y componentes en `src/components`.
- Base de datos: MongoDB (conector `@payloadcms/db-mongodb`).
- Tests: Vitest (unit + integración) y Playwright (e2e).

Requisitos

- Node 18+ (se recomienda la versión indicada en `package.json`).
- pnpm (v9+ o v10+).
- MongoDB accesible (URI en `DATABASE_URI` del `.env`).

Variables de entorno importantes

- `DATABASE_URI` — Cadena de conexión a MongoDB utilizada por Payload y los scripts de migración/seed.
- `PAYLOAD_SECRET` — Secret para Payload (auth). Normalmente definido en `.env`.
- Otros valores (opcional): `PORT`, `NEXT_PUBLIC_...` según uso.

Comandos útiles (scripts en `package.json`)

- `pnpm dev` — Inicia Next.js en modo desarrollo (puedes editar `src/` y ver cambios en caliente).
- `pnpm build` — Genera la build de producción (ejecuta tests de integración antes del build por `prebuild`).
- `pnpm start` — Inicia la app en modo producción (tras `pnpm build`).
- `pnpm payload ...` — Ejecuta comandos de Payload (por ej. `pnpm payload generate:types`).
- `pnpm test` — Ejecuta tests (integra unit + integración + e2e si están configurados).
- `pnpm run test:int` — Ejecuta sólo los tests de integración/Unit con Vitest.
- `pnpm run test:e2e` — Ejecuta tests con Playwright.

Scripts añadidos para este proyecto

- `pnpm run seed` — Ejecuta `scripts/seedPagesWithMongo.mjs` (usa `DATABASE_URI`). Inserta/actualiza páginas esenciales: `home`, `blog`, `case-studies` y un ejemplo de case-study.
- `pnpm run create-index` — Ejecuta `scripts/createUsersSlugIndex.mjs` y crea un índice único parcial en la colección `users` sobre `slug` para prevenir duplicados.

Razonamiento de seeds e índices

1. Seed de páginas

   - El panel de admin de Payload mostrará las páginas listadas sólo si existen documentos en la colección `pages`.
   - Si no ves `home`, `blog` o `case-studies` en el admin, ejecuta:

```bash
pnpm run seed
```

- El script es idempotente: no reinsertará documentos si ya existen por `slug`.

2. Índice único en `users.slug`

   - Para evitar que dos usuarios terminen con el mismo `slug` y para estabilizar el comportamiento del hook que genera slugs, hemos añadido un índice único parcial en `users.slug`.
   - Crea el índice ejecutando:

```bash
pnpm run create-index
```

- Es recomendable ejecutar `pnpm run create-index` una vez contra la BD de desarrollo/producción antes de crear usuarios en masa.

Colecciones importantes (resumen)

- `users` — Colección de usuarios/autores. Campos clave: `name`, `email`, `avatar`, `role`, `bio`, `slug`. Hay un `beforeChange` hook `ensureUniqueSlug` que autogenera `slug` a partir de `name`, y le añade sufijos si es necesario. Además hay un índice único parcial en la BD para reforzar unicidad.
- `pages` — Páginas del sitio (Home, Blog grid, Case Studies grid, etc.). Usan `layout` (layout builder con bloques), `hero` y `seo`.
- `posts` — Entradas de blog. Contienen `content` con richText (Lexical) y relación con `users` (autores).
- `case-studies` — Casos de estudio (lista + single). Puedes migrar antiguas `works` a `case-studies` con los scripts en `scripts/`.

Scripts de migración y utilidades

- `scripts/migrateWorksToCaseStudies.js` — Migración que convierte documentos de `works` a `case-studies` (si existe en el repo).
- `scripts/fixCaseStudySlugs.js` — Añade slugs faltantes a `case-studies`.
- `scripts/seedPagesWithMongo.mjs` — Script ESM que inserta páginas y un case-study de ejemplo directamente usando el driver `mongodb`.
- `scripts/createUsersSlugIndex.mjs` — Script ESM para crear índice único parcial en `users.slug`.

Cómo correr localmente

1. Copia las variables de entorno de ejemplo y edítalas:

```bash
cp .env.example .env
# Edita .env y establece DATABASE_URI, PAYLOAD_SECRET, etc.
```

2. Instala dependencias y arranca desarrollo:

```bash
pnpm install
pnpm dev
```

3. (Opcional) Crear el índice y seedear páginas para que el admin muestre contenido:

```bash
pnpm run create-index
pnpm run seed
```

4. Entra al admin en `http://localhost:3000/admin` y crea un usuario admin si aún no existe.

Tests

- Ejecutar integraciones (rápido):

```bash
pnpm run test:int -- --run
```

- Ejecutar e2e con Playwright (recomendado en CI separado):

```bash
pnpm run test:e2e
```

Consideraciones y notas de troubleshooting

- Slugs duplicados: El hook `ensureUniqueSlug` intenta evitar colisiones añadiendo sufijos (`-1`, `-2`, ...). Además el índice único parcial en Mongo previene duplicados a nivel DB. Si ves errores de índice duplicado al crear usuarios, ejecuta `pnpm run create-index` y vuelve a intentar crear el usuario.
- Admin con páginas vacías: ejecutar `pnpm run seed` insertará las páginas mínimas.
- Errores de validación en tests: las pruebas de integración usan formas de datos completas (por ejemplo, `hero` y `layout` con la estructura requerida). Si una prueba falla por validación, revisa el test y el esquema de la colección correspondiente.
- Locks o errores IX en Mongo durante pruebas: si ejecutas muchas operaciones concurrentes sobre la misma colección (por ejemplo `users`), considera serializar operaciones o usar una BD de pruebas aislada.

Buenas prácticas recomendadas (siguientes pasos)

- Implementar captura atómica de errores de clave duplicada en el flujo de guardado (para reintentar con un nuevo slug en caso de race). Actualmente el hook reduce colisiones pero no atrapa un error thrown por la BD durante `create`/`update`.
- Añadir un script `pnpm run seed:all` que ejecute `create-index` + `seed` en un solo comando.
- En CI, usar una instancia de MongoDB dedicada o contenedores efímeros para aislar pruebas.

Contribuir

Si deseas contribuir, abre un issue o PR. Para cambios mayores (migraciones o cambios de colecciones), añade tests y scripts de migración.

Archivos clave para revisar

- `src/payload.config.ts` — Configuración principal de Payload.
- `src/collections/*` — Definición de colecciones (Users, Pages, Posts, CaseStudies, etc.).
- `src/blocks/*` — Bloques reutilizables para el layout builder.
- `scripts/*` — Seeds, índices y migraciones.
- `tests/*` — Unit e integración.

Licencia

Este proyecto usa la licencia MIT (ver `package.json`).

---

Si quieres que incorpore este README.md directamente en la raíz (reemplazando el README original en inglés) o prefieres que cree una versión `README.ES.md` y actualice la `package.json` con un `pnpm run seed:all`, dime cuál opción prefieres y lo hago.
