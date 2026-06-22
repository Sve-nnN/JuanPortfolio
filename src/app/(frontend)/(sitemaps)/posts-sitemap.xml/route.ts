import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
// import config from '@payload-config'
import config from '../../../../payload.config'
import { unstable_cache } from 'next/cache'
import { buildAlternateRefs } from '@/utilities/sitemap'

const getPostsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    try {
      const results = await payload.find({
        collection: 'posts',
        overrideAccess: true,
        draft: false,
        depth: 2,
        limit: 1000,
        pagination: false,
        where: {
          _status: {
            equals: 'published',
          },
        },
        select: {
          slug: true,
          updatedAt: true,
          categories: true,
        },
      })

      const dateFallback = new Date().toISOString()

      const sitemap = results.docs
        ? results.docs
            .filter((post) => Boolean(post?.slug))
            .flatMap((post) => {
              const categories = post.categories || []
              let categorySlug = 'general'

              if (categories && categories.length > 0) {
                const firstCategory = categories[0]
                if (
                  typeof firstCategory === 'object' &&
                  'slug' in firstCategory &&
                  firstCategory.slug
                ) {
                  categorySlug = String(firstCategory.slug)
                } else if (typeof firstCategory === 'string') {
                  categorySlug = firstCategory
                }
              }

              const esLoc = `${SITE_URL}/blog/${categorySlug}/${post.slug}`
              const enLoc = `${SITE_URL}/en/blog/${categorySlug}/${post.slug}`
              const alternateRefs = buildAlternateRefs(esLoc, enLoc)
              const lastmod = post.updatedAt || dateFallback
              return [
                { loc: esLoc, lastmod, alternateRefs },
                { loc: enLoc, lastmod, alternateRefs },
              ]
            })
        : []

      return sitemap
    } catch (error) {
      console.error('Error generating posts sitemap:', error)
      return []
    }
  },
  ['posts-sitemap'],
  {
    tags: ['posts-sitemap'],
  },
)

export async function GET() {
  try {
    const sitemap = await getPostsSitemap()
    return getServerSideSitemap(sitemap)
  } catch (error) {
    console.error('CRITICAL POSTS SITEMAP ERROR:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}
