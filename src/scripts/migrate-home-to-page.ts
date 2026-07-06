/**
 * One-off, idempotent migration: copy the `home` global into a Pages collection
 * entry (slug `home`), writing BOTH locales (es create, en update on the same doc).
 * Leaves the `home` global INTACT (rollback until Phase 58).
 *
 * The `home` global only has a `layout` field (no title/meta), so the Page title is a
 * hardcoded fallback ('Inicio' / 'Home') and no meta is copied. hero is intentionally
 * left empty: the home's visible hero is the HeroHome block inside layout.
 *
 * Run: `pnpm migrate:home`  (requires a live DATABASE_URI in .env)
 *
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const SLUG = 'home'

async function main() {
  const payload = await getPayload({ config })

  // 1. Read the source global per locale (depth 0: raw block data, relations as IDs).
  const es = await payload.findGlobal({ slug: 'home', locale: 'es', depth: 0 })
  const en = await payload.findGlobal({ slug: 'home', locale: 'en', depth: 0 })

  // 2. Idempotency: upsert by slug.
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: SLUG } },
    limit: 1,
    overrideAccess: true,
  })

  // Global -> Page field mapping: layout->content.layout (required, non-empty). The
  // global has no title/meta, so title is a hardcoded fallback and meta is omitted.
  const esData = {
    title: 'Inicio',
    slug: SLUG,
    _status: 'published' as const,
    content: { layout: es.layout ?? [] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  const doc = existing.docs[0]
    ? await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        locale: 'es',
        data: esData,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
    : await payload.create({
        collection: 'pages',
        locale: 'es',
        data: esData,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })

  // 3. Write the English locale onto the SAME doc (Payload writes one locale per call).
  await payload.update({
    collection: 'pages',
    id: doc.id,
    locale: 'en',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: 'Home',
      content: { layout: en.layout ?? [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })

  payload.logger.info(`Migrated home -> pages/${doc.id} (slug '${SLUG}')`)
  // Global `home` left intact (rollback until Phase 58).
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
