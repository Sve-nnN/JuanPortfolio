import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
// import config from '@payload-config'
import config from '../../../../payload.config'
import { unstable_cache } from 'next/cache'
import { buildAlternateRefs } from '@/utilities/sitemap'

const getAuthorsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    try {
      // Prefer the Authors collection; fall back to users when it is still empty
      // (migration not yet run). URLs are identical because the slug is carried
      // over verbatim. Single-deploy safe. Phase 56 (AUTHORS-03).
      let results = await payload.find({
        collection: 'authors',
        overrideAccess: true,
        depth: 0,
        limit: 1000,
        pagination: false,
        select: {
          slug: true,
          updatedAt: true,
        },
        where: {
          slug: {
            exists: true,
          },
        },
      })

      if (!results.docs || results.docs.length === 0) {
        // Cast: User and Author both expose `slug` + `updatedAt`, the only fields
        // read below. Keeps `results` a single inferred type across the fallback.
        results = (await payload.find({
          collection: 'users',
          overrideAccess: true,
          depth: 0,
          limit: 1000,
          pagination: false,
          select: {
            slug: true,
            updatedAt: true,
          },
          where: {
            slug: {
              exists: true,
            },
          },
        })) as unknown as typeof results
      }

      const dateFallback = new Date().toISOString()

      const sitemap = results.docs
        ? results.docs
            .filter((user) => Boolean(user?.slug))
            .flatMap((user) => {
              const esLoc = `${SITE_URL}/authors/${user?.slug}`
              const enLoc = `${SITE_URL}/en/authors/${user?.slug}`
              const alternateRefs = buildAlternateRefs(esLoc, enLoc)
              const lastmod = user.updatedAt || dateFallback
              return [
                { loc: esLoc, lastmod, alternateRefs },
                { loc: enLoc, lastmod, alternateRefs },
              ]
            })
        : []

      return sitemap
    } catch (error) {
      console.error('Error generating authors sitemap:', error)
      return []
    }
  },
  ['authors-sitemap'],
  {
    tags: ['authors-sitemap'],
  },
)

export async function GET() {
  try {
    const sitemap = await getAuthorsSitemap()
    return getServerSideSitemap(sitemap)
  } catch (error) {
    console.error('CRITICAL AUTHORS SITEMAP ERROR:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}
