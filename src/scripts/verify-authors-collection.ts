/**
 * Post-migration parity verification (Phase 56), mirror of `verify-authors.ts`.
 *
 * Confirms the additive migration produced full parity before Juan deploys the
 * read cutover (or after, since the cutover is fallback-safe):
 *  - 0 published posts that have a legacy author but an empty `postAuthors`
 *  - Authors count matches the eligible users count
 *  - every Author slug already existed as a user slug (URL parity)
 *
 * Run: `pnpm verify:authors`  (requires a live DATABASE_URI in .env — RUN
 * deferred to Juan, after `pnpm migrate:authors`).
 *
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  const payload = await getPayload({ config })

  // 1. Published posts: count those with a legacy author but empty postAuthors.
  let page = 1
  let hasMore = true
  let totalPublished = 0
  let postsWithOldAuthorMissingPostAuthors = 0
  const missingList: string[] = []

  while (hasMore) {
    const batch = await payload.find({
      collection: 'posts',
      overrideAccess: true,
      where: { _status: { equals: 'published' } },
      limit: 50,
      page,
      depth: 0,
    })
    totalPublished = batch.totalDocs
    for (const post of batch.docs) {
      const authors = Array.isArray(post.authors) ? post.authors : []
      const postAuthors = Array.isArray(
        (post as { postAuthors?: unknown[] }).postAuthors,
      )
        ? ((post as { postAuthors?: unknown[] }).postAuthors as unknown[])
        : []
      if (authors.length > 0 && postAuthors.length === 0) {
        postsWithOldAuthorMissingPostAuthors++
        missingList.push(String(post.slug || post.id))
      }
    }
    hasMore = batch.hasNextPage
    page++
  }

  // 2. Authors count vs eligible users (users with a slug).
  const authors = await payload.find({
    collection: 'authors',
    overrideAccess: true,
    limit: 1000,
    pagination: false,
    depth: 0,
    select: { slug: true },
  })
  const eligibleUsers = await payload.find({
    collection: 'users',
    overrideAccess: true,
    where: { slug: { exists: true } },
    limit: 1000,
    pagination: false,
    depth: 0,
    select: { slug: true },
  })

  const authorSlugs = new Set(authors.docs.map((a) => String(a.slug)).filter(Boolean))
  const userSlugs = new Set(eligibleUsers.docs.map((u) => String(u.slug)).filter(Boolean))

  // 3. Slug/URL parity: every Author slug must already exist as a user slug.
  const slugParityOk = [...authorSlugs].every((s) => userSlugs.has(s))

  const result = {
    totalPublished,
    postsWithOldAuthorMissingPostAuthors,
    authorsCount: authorSlugs.size,
    eligibleUsersCount: userSlugs.size,
    slugParityOk,
  }

  console.log('verify-authors-collection RESULT:', JSON.stringify(result, null, 2))
  if (missingList.length > 0) {
    console.log('Posts missing postAuthors:', missingList)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
