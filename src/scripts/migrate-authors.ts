/**
 * One-off, idempotent migration (Phase 56): create `authors` docs from the
 * author-facing `users` and backfill `Posts.postAuthors`. Pattern cloned from
 * `migrate-blog-listing-to-page.ts` (dotenv → getPayload → upsert by slug →
 * `disableRevalidate` → source LEFT INTACT).
 *
 * Strategy is ADDITIVE: the legacy `authors→users` field on Posts is never
 * touched or emptied — it stays as the live fallback/rollback until Phase 58.
 *
 * Run: `pnpm migrate:authors`  (requires a live DATABASE_URI in .env — RUN
 * deferred to Juan). Idempotent: re-running upserts by slug and re-sets the same
 * postAuthors, so it neither duplicates Authors nor loses associations.
 *
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Author-facing fields copied verbatim to guarantee parity with the read cutover.
const copyAuthorFields = (user: Record<string, unknown>) => ({
  name: user.name,
  slug: user.slug, // verbatim → preserves /authors/{slug}
  role: user.role ?? undefined,
  jobTitle: user.jobTitle ?? undefined,
  bio: user.bio ?? undefined,
  expertise: user.expertise ?? undefined,
  socialMedia: user.socialMedia ?? undefined,
  education: user.education ?? undefined,
  experience: user.experience ?? undefined,
  // avatar: pass the media id through (depth 0 returns the id)
  avatar:
    user.avatar && typeof user.avatar === 'object'
      ? (user.avatar as { id?: string }).id
      : (user.avatar ?? undefined),
  // SEO/meta group from seoFields()
  meta: user.meta ?? undefined,
})

async function main() {
  const payload = await getPayload({ config })

  // 1. Select users to migrate = UNION of (a) users with a slug and (b) users
  //    referenced by any post's `authors`. Dedupe by user id.
  const eligibleUserIds = new Set<string>()

  const usersWithSlug = await payload.find({
    collection: 'users',
    where: { slug: { exists: true } },
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  for (const u of usersWithSlug.docs) eligibleUserIds.add(String(u.id))

  // Paginate posts collecting referenced author ids.
  let page = 1
  let hasMore = true
  while (hasMore) {
    const batch = await payload.find({
      collection: 'posts',
      limit: 50,
      page,
      depth: 0,
      overrideAccess: true,
    })
    for (const post of batch.docs) {
      const authors = Array.isArray(post.authors) ? post.authors : []
      for (const a of authors) {
        eligibleUserIds.add(String(typeof a === 'object' ? (a as { id?: string })?.id : a))
      }
    }
    hasMore = batch.hasNextPage
    page++
  }

  // 2. Upsert an Author per eligible user, writing BOTH locales (es create/update,
  //    then en update on the same doc — Payload writes one locale per call).
  const idMap: Record<string, string> = {} // oldUserId → newAuthorId
  let authorsUpserted = 0

  for (const userId of eligibleUserIds) {
    // Read the source user per locale for the localized fields.
    const userEs = (await payload.findByID({
      collection: 'users',
      id: userId,
      locale: 'es',
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>
    const userEn = (await payload.findByID({
      collection: 'users',
      id: userId,
      locale: 'en',
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>

    const slug = userEs.slug as string | undefined
    if (!slug) continue // cannot build /authors/{slug} without a slug

    const existing = await payload.find({
      collection: 'authors',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const esData = copyAuthorFields(userEs) as any

    const authorDoc = existing.docs[0]
      ? await payload.update({
          collection: 'authors',
          id: existing.docs[0].id,
          locale: 'es',
          data: esData,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      : await payload.create({
          collection: 'authors',
          locale: 'es',
          data: esData,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })

    // Write the English locale on the SAME doc (only localized fields differ).
    await payload.update({
      collection: 'authors',
      id: authorDoc.id,
      locale: 'en',
      data: {
        jobTitle: userEn.jobTitle ?? undefined,
        bio: userEn.bio ?? undefined,
        meta: userEn.meta ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })

    idMap[String(userId)] = String(authorDoc.id)
    authorsUpserted++
  }

  // 3. Backfill Posts.postAuthors from the id map. Idempotent (re-sets same value).
  let postsBackfilled = 0
  let postsMissingMapping = 0
  page = 1
  hasMore = true
  while (hasMore) {
    const batch = await payload.find({
      collection: 'posts',
      limit: 50,
      page,
      depth: 0,
      overrideAccess: true,
    })
    for (const post of batch.docs) {
      const authors = Array.isArray(post.authors) ? post.authors : []
      if (authors.length === 0) continue
      const mapped = authors
        .map((a) => idMap[String(typeof a === 'object' ? (a as { id?: string })?.id : a)])
        .filter((id): id is string => Boolean(id))
      if (mapped.length === 0) {
        postsMissingMapping++
        continue
      }
      await payload.update({
        collection: 'posts',
        id: post.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { postAuthors: mapped } as any,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      postsBackfilled++
    }
    hasMore = batch.hasNextPage
    page++
  }

  const result = {
    usersMigrated: eligibleUserIds.size,
    authorsUpserted,
    postsBackfilled,
    postsMissingMapping,
  }
  payload.logger.info(`migrate-authors RESULT: ${JSON.stringify(result)}`)
  // `users` and `Posts.authors` left INTACT (rollback until Phase 58).
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
