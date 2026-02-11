import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
// import config from '@payload-config' // Alias can be flaky in some runtimes
import config from '../../../../payload.config'
import { unstable_cache } from 'next/cache'

const getCategoriesSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    try {
      const results = await payload.find({
        collection: 'categories',
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

      const dateFallback = new Date().toISOString()

      const sitemap = results.docs
        ? results.docs
            .filter((cat) => Boolean(cat?.slug))
            .map((cat) => {
              return {
                loc: `${SITE_URL}/blog/category/${cat?.slug}`,
                lastmod: cat.updatedAt || dateFallback,
              }
            })
        : []

      return sitemap
    } catch (error) {
      console.error('Error generating categories sitemap:', error)
      return []
    }
  },
  ['categories-sitemap'],
  {
    tags: ['categories-sitemap'],
  },
)

export async function GET() {
  try {
    const sitemap = await getCategoriesSitemap()
    return getServerSideSitemap(sitemap)
  } catch (error) {
    console.error('CRITICAL SITEMAP ERROR:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}
