/**
 * One-off, idempotent migration: copy the `case-studies-listing` global into a Pages
 * collection entry (slug `case-studies`), writing BOTH locales (es create, en update on
 * the same doc). Leaves the `case-studies-listing` global INTACT (rollback until Phase 58).
 *
 * Run: `pnpm migrate:case-studies-listing`  (requires a live DATABASE_URI in .env)
 *
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const SLUG = 'case-studies'

async function main() {
  const payload = await getPayload({ config })

  // 1. Read the source global per locale (depth 0: raw block data, relations as IDs).
  const es = await payload.findGlobal({ slug: 'case-studies-listing', locale: 'es', depth: 0 })
  const en = await payload.findGlobal({ slug: 'case-studies-listing', locale: 'en', depth: 0 })

  // 2. Idempotency: upsert by slug.
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: SLUG } },
    limit: 1,
    overrideAccess: true,
  })

  // Global -> Page field mapping: title->title (required), layout->content.layout
  // (required, non-empty), description->meta.description (seoPlugin; strict improvement,
  // the global never wired description into meta). hero is intentionally left empty:
  // the listing's visible hero is the ListingHero block inside layout.
  const esData = {
    title: es.title ?? 'Casos de estudio',
    slug: SLUG,
    _status: 'published' as const,
    content: { layout: es.layout ?? [] },
    meta: { description: es.description ?? undefined },
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
      title: en.title ?? 'Case studies',
      content: { layout: en.layout ?? [] },
      meta: { description: en.description ?? undefined },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  })

  payload.logger.info(`Migrated case-studies-listing -> pages/${doc.id} (slug '${SLUG}')`)
  // Global `case-studies-listing` left intact (rollback until Phase 58).
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
